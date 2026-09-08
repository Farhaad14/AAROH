import uuid
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Query
from app.schemas.route import RouteRequestCreate, RouteAnalysisResponse, RouteDetailSchema, SegmentDetailSchema
from app.services.routing.router import fetch_route_alternatives
from app.services.geospatial.segmentation import segment_route_geometry
from app.services.scoring.segment_score import calculate_segment_context
from app.services.scoring.route_score import calculate_route_scores
from app.core.logging import logger
from app.services.ai.gemini import generate_route_explanation

from app.services.geospatial.overpass import prefetch_route_overpass, clear_route_prefetch

router = APIRouter()

# In-memory session cache for fast GET lookups
ROUTES_CACHE: Dict[str, Dict[str, Any]] = {}

from app.services.geocoding.nominatim import geocode_address

@router.post("/routes", response_model=RouteAnalysisResponse)
def analyze_routes(req: RouteRequestCreate):
    request_id = f"req_{uuid.uuid4().hex[:8]}"

    origin_lat = req.origin_lat
    origin_lng = req.origin_lng
    dest_lat = req.destination_lat
    dest_lng = req.destination_lng

    # Auto-geocode text addresses if coordinates are zero or default preset coordinates
    if req.origin_address and (origin_lat == 0.0 or origin_lng == 0.0 or (round(origin_lat, 3) == 28.628 and "sector 62" not in req.origin_address.lower())):
        geo_orig = geocode_address(req.origin_address)
        origin_lat, origin_lng = geo_orig["lat"], geo_orig["lng"]

    if req.destination_address and (dest_lat == 0.0 or dest_lng == 0.0 or (round(dest_lat, 3) == 28.571 and "sector 18" not in req.destination_address.lower())):
        geo_dest = geocode_address(req.destination_address)
        dest_lat, dest_lng = geo_dest["lat"], geo_dest["lng"]
    
    # 1. Fetch 3 to 4 route alternatives
    raw_routes = fetch_route_alternatives(
        origin_lat, origin_lng,
        dest_lat, dest_lng
    )
    
    from concurrent.futures import ThreadPoolExecutor, as_completed

    def _process_single_route(r_raw: Dict[str, Any]) -> Dict[str, Any]:
        r_id = r_raw["id"]
        r_coords = r_raw["geometry"]["coordinates"]

        # Prefetch Overpass data for the full route bounding box once
        prefetch_route_overpass(r_id, r_coords)
        
        try:
            # 2. Segment route geometry into ~150m geographic segments
            raw_segments = segment_route_geometry(r_coords, target_len_m=150.0)
            
            # 3. Analyze each segment across 9 context factors
            evaluated_segments = []
            for seg in raw_segments:
                seg_eval = calculate_segment_context(
                    center_lat=seg["center_lat"],
                    center_lng=seg["center_lng"],
                    travel_datetime_str=req.travel_datetime,
                    segment_idx=seg["segment_index"],
                    geometry=seg["geometry"],
                    length_m=seg["length_m"],
                    route_id=r_id
                )
                evaluated_segments.append(seg_eval)
        finally:
            clear_route_prefetch(r_id)
            
        # 4. Compute route-level score (70% Avg + 30% Weakest)
        route_scoring = calculate_route_scores(evaluated_segments)
        
        return {
            "id": r_id,
            "name": r_raw["name"],
            "distance_m": r_raw["distance_m"],
            "duration_seconds": r_raw["duration_seconds"],
            "score": route_scoring["score"],
            "confidence": route_scoring["confidence"],
            "features": route_scoring["features"],
            "attention_zones": route_scoring["attention_zones"],
            "segments": evaluated_segments,
            "geometry": r_raw["geometry"]
        }

    processed_routes: List[Dict[str, Any]] = []
    
    with ThreadPoolExecutor(max_workers=min(4, len(raw_routes))) as executor:
        future_to_route = {executor.submit(_process_single_route, r_raw): r_raw["id"] for r_raw in raw_routes}
        # Maintain original route order
        route_results_map = {}
        for future in as_completed(future_to_route):
            res = future.result()
            route_results_map[res["id"]] = res
            
        for r_raw in raw_routes:
            if r_raw["id"] in route_results_map:
                processed_routes.append(route_results_map[r_raw["id"]])
        
    # 5. Route Recommendation Engine
    if req.priority_safety:
        # Prioritize contextual score
        recommended_route = max(processed_routes, key=lambda x: x["score"])
    else:
        # Balanced score considering ETA
        recommended_route = max(processed_routes, key=lambda x: (x["score"] * 0.7) - (x["duration_seconds"] / 120.0))
        
    rec_id = recommended_route["id"]
    
    # 6. Context Explanation Layer (Gemini Grounded / Deterministic Fallback)
    explanation_data = generate_route_explanation(processed_routes, rec_id, req.travel_datetime)
    explanation_source = (
        explanation_data.get("status", "deterministic_fallback")
        if isinstance(explanation_data, dict)
        else "deterministic_fallback"
    )
    
    response_payload = {
        "request_id": request_id,
        "travel_datetime": req.travel_datetime,
        "recommended_route_id": rec_id,
        "routes": processed_routes,
        "explanation": explanation_data,
        "explanation_source": explanation_source
    }
    
    # In-memory session cache for instant UI rendering
    ROUTES_CACHE[request_id] = response_payload
    for pr in processed_routes:
        ROUTES_CACHE[pr["id"]] = pr
        
    # Persistent storage in database
    try:
        from app.core.database import SessionLocal
        from app.models.route_record import RouteEvaluationRecord
        db = SessionLocal()
        record = RouteEvaluationRecord(
            request_id=request_id,
            travel_datetime=req.travel_datetime,
            recommended_route_id=rec_id,
            explanation_source=explanation_source,
            routes_json=processed_routes,
            explanation_json=explanation_data
        )
        db.merge(record)
        db.commit()
        db.close()
    except Exception as e:
        logger.warning(f"[DB] Failed to persist route evaluation {request_id}: {e}")
        
    return response_payload

@router.get("/routes/{route_id}", response_model=RouteDetailSchema)
def get_route_by_id(route_id: str):
    if route_id in ROUTES_CACHE:
        return ROUTES_CACHE[route_id]
    # Check DB fallback
    try:
        from app.core.database import SessionLocal
        from app.models.route_record import RouteEvaluationRecord
        db = SessionLocal()
        records = db.query(RouteEvaluationRecord).order_by(RouteEvaluationRecord.created_at.desc()).limit(20).all()
        for rec in records:
            for r in (rec.routes_json or []):
                if r.get("id") == route_id:
                    ROUTES_CACHE[route_id] = r
                    db.close()
                    return r
        db.close()
    except Exception as e:
        logger.warning(f"[DB] Error looking up route_id {route_id}: {e}")
    raise HTTPException(status_code=404, detail="Route not found")

@router.get("/routes/{route_id}/segments", response_model=List[SegmentDetailSchema])
def get_route_segments(route_id: str):
    if route_id in ROUTES_CACHE:
        return ROUTES_CACHE[route_id].get("segments", [])
    # DB lookup if needed
    try:
        from app.core.database import SessionLocal
        from app.models.route_record import RouteEvaluationRecord
        db = SessionLocal()
        records = db.query(RouteEvaluationRecord).order_by(RouteEvaluationRecord.created_at.desc()).limit(20).all()
        for rec in records:
            for r in (rec.routes_json or []):
                if r.get("id") == route_id:
                    ROUTES_CACHE[route_id] = r
                    db.close()
                    return r.get("segments", [])
        db.close()
    except Exception as e:
        logger.warning(f"[DB] Error looking up segments for {route_id}: {e}")
    raise HTTPException(status_code=404, detail="Route segments not found")

