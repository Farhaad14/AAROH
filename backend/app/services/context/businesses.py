from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.geospatial.overpass import query_nearby_overpass_features
from app.services.context.opening_hours import parse_opening_hours
from app.services.geospatial.spatial_queries import spatial_manager

BUSINESS_WEIGHTS = {
    "pharmacy": 1.0,
    "convenience": 0.9,
    "supermarket": 0.8,
    "restaurant": 0.8,
    "cafe": 0.7,
    "fuel": 0.8,
    "bank": 0.7,
    "atm": 0.6,
    "jewelry": 0.5,
    "school": 0.6,
    "college": 0.6,
    "general": 0.5
}

def evaluate_open_businesses(
    lat: float,
    lng: float,
    hour: int,
    travel_dt: Optional[datetime] = None,
    route_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates commercial presence and opening hours along a segment.
    Clearly distinguishes verified open businesses from estimated activity.
    Never claims unverified businesses are open.
    """
    if not travel_dt:
        now = datetime.now()
        travel_dt = now.replace(hour=hour, minute=0, second=0)

    source = "osm_overpass"
    live_feats = query_nearby_overpass_features(lat, lng, radius_m=150.0, route_id=route_id)
    biz_feats = [f for f in live_feats if f.get("category") in ("business", "surveillance")]

    # If live Overpass returned 0 features, check demo dataset if in demo bounds
    if not biz_feats:
        source = "demo_dataset"
        demo_pois = spatial_manager.get_nearby_pois(lat, lng, radius_m=150.0)
        biz_feats = [
            {
                "amenity": p[0]["properties"].get("type"),
                "shop": p[0]["properties"].get("type"),
                "opening_hours": p[0]["properties"].get("opening_hours"),
                "distance_m": p[1],
                "source": "demo_dataset"
            }
            for p in demo_pois
        ]

    total_count = len(biz_feats)
    verified_open_count = 0
    verified_closed_count = 0
    unknown_hours_count = 0
    accumulated_presence = 0.0

    for feat in biz_feats:
        key = feat.get("amenity") or feat.get("shop") or "convenience"
        base_weight = BUSINESS_WEIGHTS.get(str(key).lower(), 0.5)
        dist = feat.get("distance_m", 75.0)

        # Distance decay (0-50m: 1.0, 50-100m: 0.7, 100-150m: 0.4)
        if dist <= 50.0:
            dist_factor = 1.0
        elif dist <= 100.0:
            dist_factor = 0.7
        else:
            dist_factor = 0.4

        # Opening hours evaluation (returns True, False, or None for unknown)
        oh_status = parse_opening_hours(feat.get("opening_hours"), travel_dt)

        if oh_status is True:
            verified_open_count += 1
            hour_factor = 1.0
        elif oh_status is False:
            verified_closed_count += 1
            hour_factor = 0.1
        else:
            unknown_hours_count += 1
            # Inferred baseline: general daylight commercial presence vs late night
            hour_factor = 0.7 if (8 <= hour < 21) else 0.25

        contribution = base_weight * dist_factor * hour_factor * 25.0
        accumulated_presence += contribution

    if total_count > 0:
        score = min(98.0, max(25.0, accumulated_presence))
        status = "observed" if (verified_open_count + verified_closed_count > 0) else "inferred"
        confidence = "HIGH" if total_count >= 2 else "MEDIUM"
    else:
        # No verified businesses discovered
        score = 65.0 if (8 <= hour < 21) else 35.0
        status = "unknown"
        source = "rule_engine"
        confidence = "LOW"

    return {
        "score": round(score, 1),
        "total_count": total_count,
        "verified_open_count": verified_open_count,
        "verified_closed_count": verified_closed_count,
        "unknown_hours_count": unknown_hours_count,
        "label": "Estimated Public Activity",
        "status": status,
        "source": source,
        "confidence": confidence
    }
