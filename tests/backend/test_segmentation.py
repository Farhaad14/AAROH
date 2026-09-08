import pytest
from app.services.geospatial.segmentation import segment_route_geometry

def test_segmentation_length_and_indexes():
    coords = [
        [77.3639, 28.6280],
        [77.3680, 28.6250],
        [77.3715, 28.6210]
    ]
    segments = segment_route_geometry(coords, target_len_m=150.0)
    assert len(segments) >= 2
    assert segments[0]["segment_index"] == 1
    assert segments[1]["segment_index"] == 2
    for seg in segments:
        assert seg["length_m"] > 30.0
        assert "geometry" in seg
        assert seg["geometry"]["type"] == "LineString"
