from typing import Dict, Any, Optional
from app.services.geospatial.overpass import query_nearby_overpass_features
from app.services.geospatial.spatial_queries import spatial_manager

def evaluate_emergency_access(
    lat: float,
    lng: float,
    route_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates proximity to police, hospitals, and fire stations.
    Returns explicit distance metrics (or None if unavailable, never 999999).
    """
    live_feats = query_nearby_overpass_features(lat, lng, radius_m=2500.0, route_id=route_id)
    emg_feats = [f for f in live_feats if f.get("category") == "emergency"]
    source = "osm_overpass"

    if not emg_feats:
        # Fallback to local demo dataset if in demo boundary
        demo_dist, demo_type = spatial_manager.get_nearest_emergency(lat, lng)
        if demo_dist < 5000.0:
            source = "demo_dataset"
            emg_feats = [{
                "amenity": demo_type,
                "distance_m": demo_dist,
                "name": f"Noida {demo_type.title()}"
            }]
        else:
            source = "unknown"

    nearest_police_m: Optional[float] = None
    nearest_hospital_m: Optional[float] = None
    nearest_fire_m: Optional[float] = None

    for f in emg_feats:
        d = float(f.get("distance_m", 9999.0))
        amenity = str(f.get("amenity", "")).lower()

        if "police" in amenity:
            nearest_police_m = d if nearest_police_m is None else min(nearest_police_m, d)
        elif "hospital" in amenity or "clinic" in amenity:
            nearest_hospital_m = d if nearest_hospital_m is None else min(nearest_hospital_m, d)
        elif "fire" in amenity:
            nearest_fire_m = d if nearest_fire_m is None else min(nearest_fire_m, d)

    # Find the closest of any emergency service
    all_dists = [d for d in [nearest_police_m, nearest_hospital_m, nearest_fire_m] if d is not None]
    
    if all_dists:
        min_dist = min(all_dists)
        status = "observed"
        confidence = "HIGH" if min_dist < 1500.0 else "MEDIUM"
        
        if min_dist <= 300.0:
            score = 100.0
        elif min_dist <= 1000.0:
            score = 100.0 - (min_dist - 300.0) * (25.0 / 700.0)
        elif min_dist <= 2500.0:
            score = 75.0 - (min_dist - 1000.0) * (35.0 / 1500.0)
        else:
            score = max(25.0, 40.0 - (min_dist - 2500.0) * (15.0 / 2500.0))
    else:
        min_dist = None
        status = "unknown"
        source = "unknown"
        confidence = "LOW"
        score = 30.0

    return {
        "score": round(score, 1),
        "nearest_police_m": round(nearest_police_m, 1) if nearest_police_m is not None else None,
        "nearest_hospital_m": round(nearest_hospital_m, 1) if nearest_hospital_m is not None else None,
        "nearest_fire_station_m": round(nearest_fire_m, 1) if nearest_fire_m is not None else None,
        "nearest_distance_m": round(min_dist, 1) if min_dist is not None else None,
        "status": status,
        "source": source,
        "confidence": confidence
    }
