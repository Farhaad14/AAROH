from typing import Dict, Any, Optional
from app.services.context.businesses import evaluate_open_businesses
from app.services.geospatial.spatial_queries import spatial_manager

def evaluate_public_activity(
    lat: float,
    lng: float,
    hour: int,
    route_id: Optional[str] = None
) -> Dict[str, Any]:
    biz_eval = evaluate_open_businesses(lat, lng, hour, route_id=route_id)
    transit_nearby = spatial_manager.get_nearby_transit(lat, lng, radius_m=300.0)
    obs_nearby = spatial_manager.get_nearby_observations(lat, lng, radius_m=200.0)
    
    # Base activity derived from business presence
    base_activity = biz_eval["score"]
    
    # Transit active bonus
    transit_bonus = min(20.0, len(transit_nearby) * 8.0) if (6 <= hour <= 22) else min(5.0, len(transit_nearby) * 2.0)
    
    # Observation adjustments
    obs_adj = 0.0
    for obs in obs_nearby:
        if obs.get("type") == "activity":
            val = str(obs.get("value", "")).lower()
            if val == "busy":
                obs_adj += 15.0
            elif val == "quiet":
                obs_adj -= 15.0
                
    raw_score = base_activity * 0.7 + transit_bonus + obs_adj
    final_score = min(98.0, max(15.0, raw_score))
    
    return {
        "score": round(final_score, 1),
        "open_business_proxy": biz_eval.get("verified_open_count", 0),
        "transit_stop_count": len(transit_nearby),
        "label": "Estimated Public Activity",
        "status": "inferred",
        "source": biz_eval.get("source", "rule_engine"),
        "confidence": "HIGH" if (biz_eval["total_count"] > 2 or len(transit_nearby) > 0) else "MEDIUM"
    }
