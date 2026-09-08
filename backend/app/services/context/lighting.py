from typing import Dict, Any, Optional
from app.services.geospatial.overpass import query_nearby_overpass_features
from app.services.geospatial.spatial_queries import spatial_manager

def evaluate_street_lighting(
    lat: float,
    lng: float,
    is_night: bool,
    route_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates street lighting infrastructure.
    Uses real OSM street_lamp and lit tags, user observations, or demo datasets.
    Explicitly marks status as 'unknown' when no verified data exists.
    """
    # 1. Live OSM Overpass check
    live_feats = query_nearby_overpass_features(lat, lng, radius_m=120.0, route_id=route_id)
    osm_lighting = [f for f in live_feats if f.get("category") == "lighting"]

    # 2. User observations
    user_obs = spatial_manager.get_nearby_observations(lat, lng, radius_m=150.0)
    lighting_obs = [obs for obs in user_obs if obs.get("type") == "lighting"]

    # 3. Demo dataset check
    demo_lights = spatial_manager.get_nearby_streetlights(lat, lng, radius_m=120.0)

    if osm_lighting:
        source = "osm_overpass"
        status = "observed"
        working_count = sum(1 for f in osm_lighting if f.get("is_verified_lighting") or f.get("lit") == "yes")
        unlit_count = sum(1 for f in osm_lighting if f.get("lit") == "no")
        
        score = 50.0 + min(40.0, working_count * 15.0) - (unlit_count * 25.0)
        confidence = "HIGH" if working_count > 0 else "MEDIUM"
        label = "Verified OSM Lighting"

    elif lighting_obs:
        source = "user_observation"
        status = "observed"
        working_count = 0
        score = 50.0
        for obs in lighting_obs:
            val = str(obs.get("value", "")).lower()
            if val == "good":
                score += 25.0
            elif val == "poor":
                score -= 25.0
        confidence = "MEDIUM"
        label = "Community Observed Lighting"

    elif demo_lights:
        source = "demo_dataset"
        status = "demo_fallback"
        working_count = sum(1 for feature, _ in demo_lights if feature["properties"].get("status") == "working")
        score = 50.0 + min(40.0, working_count * 15.0)
        confidence = "MEDIUM"
        label = "Prototype Demo Lighting"

    else:
        # Honest fallback: unverified
        return {
            "score": 50.0,
            "working_lights": 0,
            "total_lights": 0,
            "label": "Lighting data unavailable",
            "status": "unknown",
            "source": "unknown",
            "confidence": "LOW"
        }

    final_score = min(98.0, max(20.0, score))

    return {
        "score": round(final_score, 1),
        "working_lights": working_count,
        "total_lights": len(osm_lighting) or len(demo_lights),
        "label": label,
        "status": status,
        "source": source,
        "confidence": confidence
    }
