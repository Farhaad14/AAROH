from typing import Dict, Any
from app.services.geospatial.spatial_queries import spatial_manager

def evaluate_mobile_network(lat: float, lng: float) -> Dict[str, Any]:
    """
    Evaluates mobile network connectivity.
    Inside demo region: marked clearly as 'demo_fallback' ('Prototype coverage data').
    Outside demo region: marked honestly as 'unknown' ('Connectivity data unavailable').
    Never invents live signal strength.
    """
    polygons = spatial_manager.get_network_coverage(lat, lng)

    if not polygons:
        return {
            "score": 50.0,
            "operators": [],
            "technologies": [],
            "label": "Connectivity data unavailable",
            "status": "unknown",
            "source": "unknown",
            "confidence": "LOW"
        }

    ops = set()
    techs = set()

    for poly in polygons:
        ops.add(poly.get("operator", "Prototype Operator"))
        techs.add(poly.get("technology", "4G"))

    score = 70.0 + min(20.0, len(ops) * 6.0)
    if "5G" in techs:
        score += 5.0

    return {
        "score": min(95.0, round(score, 1)),
        "operators": list(ops),
        "technologies": list(techs),
        "label": "Prototype coverage data",
        "status": "demo_fallback",
        "source": "demo_dataset",
        "confidence": "MEDIUM"
    }
