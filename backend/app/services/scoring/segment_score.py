from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.context.activity import evaluate_public_activity
from app.services.context.businesses import evaluate_open_businesses
from app.services.context.emergency import evaluate_emergency_access
from app.services.context.time_context import evaluate_time_context
from app.services.context.isolation import calculate_isolation_index
from app.services.context.surveillance import evaluate_surveillance_presence
from app.services.context.network import evaluate_mobile_network
from app.services.context.transit import evaluate_public_transit
from app.services.context.lighting import evaluate_street_lighting

def calculate_segment_context(
    center_lat: float,
    center_lng: float,
    travel_datetime_str: str,
    segment_idx: int,
    geometry: Dict[str, Any],
    length_m: float,
    route_id: Optional[str] = None
) -> Dict[str, Any]:
    weights = settings.scoring_weights
    
    # 1. Time Context
    time_eval = evaluate_time_context(travel_datetime_str)
    hour = time_eval["hour"]
    is_night = time_eval["is_night"]
    
    # 2. Open Businesses
    biz_eval = evaluate_open_businesses(center_lat, center_lng, hour, route_id=route_id)
    
    # 3. Public Activity
    act_eval = evaluate_public_activity(center_lat, center_lng, hour, route_id=route_id)
    
    # 4. Emergency Access
    emg_eval = evaluate_emergency_access(center_lat, center_lng, route_id=route_id)
    
    # 5. Public Transport
    tr_eval = evaluate_public_transit(center_lat, center_lng, hour, route_id=route_id)
    
    # 6. Street Lighting
    lt_eval = evaluate_street_lighting(center_lat, center_lng, is_night, route_id=route_id)
    
    # 7. Isolation Index
    iso_eval = calculate_isolation_index(
        activity_score=act_eval["score"],
        business_score=biz_eval["score"],
        emergency_score=emg_eval["score"],
        transit_score=tr_eval["score"],
        lighting_score=lt_eval["score"]
    )
    
    # 8. Surveillance Presence
    surv_eval = evaluate_surveillance_presence(center_lat, center_lng, route_id=route_id)
    
    # 9. Mobile Network
    net_eval = evaluate_mobile_network(center_lat, center_lng)
    
    # Calculate weighted score
    segment_score = (
        act_eval["score"] * weights.get("activity", 0.18) +
        biz_eval["score"] * weights.get("businesses", 0.12) +
        emg_eval["score"] * weights.get("emergency", 0.15) +
        time_eval["score"] * weights.get("time", 0.08) +
        iso_eval["positive_score"] * weights.get("isolation", 0.15) +
        surv_eval["score"] * weights.get("surveillance", 0.07) +
        net_eval["score"] * weights.get("network", 0.10) +
        tr_eval["score"] * weights.get("transit", 0.07) +
        lt_eval["score"] * weights.get("lighting", 0.08)
    )
    
    segment_score = round(max(0.0, min(100.0, segment_score)), 1)
    
    # Formulate human-readable reasons for low/high scores
    reasons = []
    if act_eval["score"] < 50.0:
        reasons.append("Low ambient public activity")
    if biz_eval["score"] < 45.0:
        reasons.append("Few open commercial facilities")
    if not tr_eval.get("service_operating", False):
        reasons.append("Reduced transit operating schedule at travel time")
    if iso_eval["isolation_index"] > 60.0:
        reasons.append("Higher isolation index")
    if is_night and lt_eval["status"] == "unknown":
        reasons.append("Street lighting unverified in this corridor")
    elif is_night and lt_eval["score"] < 50.0:
        reasons.append("Reduced lighting coverage reported")
    if emg_eval["score"] < 50.0:
        reasons.append("Emergency infrastructure at greater distance")

    if not reasons:
        reasons.append("Active commercial corridor with verified support availability")
        
    return {
        "id": f"seg_{segment_idx}",
        "segment_index": segment_idx,
        "length_m": length_m,
        "segment_score": segment_score,
        "confidence": biz_eval["confidence"],
        "scores": {
            "activity": act_eval["score"],
            "businesses": biz_eval["score"],
            "emergency": emg_eval["score"],
            "time": time_eval["score"],
            "isolation": iso_eval["isolation_index"],
            "surveillance": surv_eval["score"],
            "network": net_eval["score"],
            "transit": tr_eval["score"],
            "lighting": lt_eval["score"]
        },
        "provenance": {
            "businesses": {"status": biz_eval["status"], "source": biz_eval["source"]},
            "emergency": {
                "status": emg_eval["status"],
                "source": emg_eval["source"],
                "nearest_police_m": emg_eval["nearest_police_m"],
                "nearest_hospital_m": emg_eval["nearest_hospital_m"]
            },
            "cctv": {"status": surv_eval["status"], "cctv_status": surv_eval["cctv_status"], "label": surv_eval["label"]},
            "lighting": {"status": lt_eval["status"], "source": lt_eval["source"], "label": lt_eval["label"]},
            "network": {"status": net_eval["status"], "source": net_eval["source"], "label": net_eval["label"]},
            "transit": {"status": tr_eval["status"], "source": tr_eval["source"], "label": tr_eval["label"]}
        },
        "geometry": geometry,
        "reasons": reasons
    }
