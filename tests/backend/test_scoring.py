import pytest
from app.services.scoring.route_score import calculate_route_scores

def test_route_scoring_formula():
    mock_segments = [
        {"segment_index": 1, "segment_score": 90.0, "confidence": "HIGH", "scores": {"activity": 90, "businesses": 90, "emergency": 90, "time": 90, "isolation": 10, "surveillance": 90, "network": 90, "transit": 90, "lighting": 90}, "geometry": {"coordinates": [[77.3, 28.6]]}, "reasons": []},
        {"segment_index": 2, "segment_score": 40.0, "confidence": "HIGH", "scores": {"activity": 40, "businesses": 40, "emergency": 40, "time": 40, "isolation": 60, "surveillance": 40, "network": 40, "transit": 40, "lighting": 40}, "geometry": {"coordinates": [[77.31, 28.61]]}, "reasons": ["Low activity"]},
        {"segment_index": 3, "segment_score": 80.0, "confidence": "HIGH", "scores": {"activity": 80, "businesses": 80, "emergency": 80, "time": 80, "isolation": 20, "surveillance": 80, "network": 80, "transit": 80, "lighting": 80}, "geometry": {"coordinates": [[77.32, 28.62]]}, "reasons": []}
    ]
    result = calculate_route_scores(mock_segments)
    
    avg_score = (90.0 + 40.0 + 80.0) / 3.0 # 70.0
    weakest = 40.0
    expected_final = (0.70 * avg_score) + (0.30 * weakest) # 49.0 + 12.0 = 61.0
    
    assert result["score"] == expected_final
    assert len(result["attention_zones"]) == 1
    assert result["attention_zones"][0]["segment_index"] == 2
