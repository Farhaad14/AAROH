from typing import Dict, Any, List, Optional
from app.services.geospatial.overpass import query_nearby_overpass_features
from app.services.geospatial.spatial_queries import spatial_manager
from app.core.config import settings

def evaluate_surveillance_presence(
    lat: float,
    lng: float,
    route_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates surveillance presence with explicit distinction between:
    1. VERIFIED_CCTV (Actual OSM surveillance camera node/tag)
    2. COMMERCIAL_SURVEILLANCE_PROXY (Banks, ATMs, fuel stations, malls)
    3. UNKNOWN (No verified camera or proxy evidence)
    """
    cfg = settings.surveillance_weights
    proxy_weights = cfg.get("proxy_weights", {})
    max_cap = cfg.get("max_score_cap", 95.0)

    # 1. Query Overpass features
    live_feats = query_nearby_overpass_features(lat, lng, radius_m=200.0, route_id=route_id)
    surv_feats = [f for f in live_feats if f.get("category") == "surveillance"]

    # If no live Overpass features, fallback to spatial demo POIs if within demo area
    if not surv_feats:
        nearby_pois = spatial_manager.get_nearby_pois(lat, lng, radius_m=200.0)
        surv_feats = [
            {
                "amenity": p[0]["properties"].get("type"),
                "shop": p[0]["properties"].get("type"),
                "distance_m": p[1],
                "is_verified_cctv": False
            }
            for p in nearby_pois
        ]

    verified_cctv_count = 0
    detected_proxies = []
    accumulated_score = 0.0

    for feat in surv_feats:
        if feat.get("is_verified_cctv") or feat.get("man_made") == "surveillance":
            verified_cctv_count += 1
            accumulated_score += 45.0
            continue

        poi_type = str(feat.get("amenity") or feat.get("shop") or feat.get("highway") or "").lower()
        if poi_type in proxy_weights:
            weight = proxy_weights[poi_type]
            dist = float(feat.get("distance_m", 100.0))

            if dist <= 50.0:
                d_factor = 1.0
            elif dist <= 100.0:
                d_factor = 0.7
            elif dist <= 150.0:
                d_factor = 0.4
            else:
                d_factor = 0.1

            accumulated_score += weight * d_factor * 30.0
            detected_proxies.append(poi_type)

    if verified_cctv_count > 0:
        cctv_status = "VERIFIED_CCTV"
        label = "Verified CCTV"
        status = "observed"
        source = "osm_overpass"
        confidence = "HIGH"
        final_score = min(max_cap, max(60.0, accumulated_score))
    elif detected_proxies:
        cctv_status = "COMMERCIAL_SURVEILLANCE_PROXY"
        label = "Commercial surveillance proxy"
        status = "inferred"
        source = "osm_overpass" if live_feats else "demo_dataset"
        confidence = "MEDIUM"
        final_score = min(80.0, max(40.0, accumulated_score))
    else:
        cctv_status = "UNKNOWN"
        label = "Coverage unknown"
        status = "unknown"
        source = "unknown"
        confidence = "LOW"
        final_score = 25.0

    return {
        "score": round(final_score, 1),
        "cctv_status": cctv_status,
        "label": label,
        "status": status,
        "source": source,
        "confidence": confidence,
        "verified_cctv_count": verified_cctv_count,
        "detected_proxies": list(set(detected_proxies))
    }
