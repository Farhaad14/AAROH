from typing import Dict, Any

def calculate_isolation_index(
    activity_score: float,
    business_score: float,
    emergency_score: float,
    transit_score: float,
    lighting_score: float
) -> Dict[str, Any]:
    """
    Computes Isolation Index (0 = highly connected, 100 = highly isolated).
    High support availability and public activity reduce isolation.
    """
    connectivity_support = (
        activity_score * 0.30 +
        business_score * 0.25 +
        emergency_score * 0.20 +
        transit_score * 0.15 +
        lighting_score * 0.10
    )
    
    isolation_index = max(0.0, min(100.0, 100.0 - connectivity_support))
    positive_isolation_score = 100.0 - isolation_index
    
    return {
        "isolation_index": round(isolation_index, 1),
        "positive_score": round(positive_isolation_score, 1),
        "confidence": "HIGH"
    }
