from typing import Dict, Any, Optional
from app.services.geospatial.overpass import query_nearby_overpass_features
from app.services.geospatial.spatial_queries import spatial_manager

def evaluate_public_transit(
    lat: float,
    lng: float,
    hour: int,
    route_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates nearby public transit access (bus stops, metro, railway).
    Uses live OSM data if available, demo GTFS dataset if in demo area,
    or honestly marks as unknown/unavailable.
    """
    # 1. Check live OSM Overpass transit features
    live_feats = query_nearby_overpass_features(lat, lng, radius_m=400.0, route_id=route_id)
    osm_transit = [f for f in live_feats if f.get("category") == "transit"]

    # 2. Check local demo dataset
    demo_transit = spatial_manager.get_nearby_transit(lat, lng, radius_m=400.0)

    if osm_transit:
        source = "osm_overpass"
        status = "observed"
        label = "Verified OSM Transit"
        total_stops = len(osm_transit)
        # In general OSM, standard operating transit runs 06:00 to 22:30
        is_operating = (6 <= hour <= 22)
        base_score = 70.0 + min(25.0, total_stops * 8.0) if is_operating else 35.0
        confidence = "HIGH"

    elif demo_transit:
        source = "demo_dataset"
        status = "demo_fallback"
        label = "Prototype Demo Transit"
        total_stops = len(demo_transit)
        active_stops = 0
        for feature, _ in demo_transit:
            props = feature["properties"]
            start_hour = int(props.get("start_time", "05:30:00").split(":")[0])
            end_hour = int(props.get("end_time", "23:15:00").split(":")[0])
            if start_hour <= hour <= end_hour:
                active_stops += 1
        is_operating = (active_stops > 0)
        base_score = 70.0 + min(25.0, active_stops * 10.0) if is_operating else 35.0
        confidence = "MEDIUM"

    else:
        return {
            "score": 30.0,
            "total_stops": 0,
            "active_stops": 0,
            "service_operating": False,
            "label": "No transit stops nearby",
            "status": "unknown",
            "source": "unknown",
            "confidence": "LOW"
        }

    return {
        "score": round(base_score, 1),
        "total_stops": total_stops,
        "service_operating": is_operating,
        "label": label,
        "status": status,
        "source": source,
        "confidence": confidence
    }
