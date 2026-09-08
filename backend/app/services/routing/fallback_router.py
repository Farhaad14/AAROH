import math
from typing import List, Dict, Any, Tuple
from app.utils.geo import haversine_distance_m, interpolate_point

def generate_fallback_dense_path(
    p1: Tuple[float, float], p2: Tuple[float, float], offset_factor: float, curve_freq: float, steps: int = 35
) -> List[Tuple[float, float]]:
    """
    Generates a smooth multi-point curved path between p1 and p2 with sine-wave street grid turns.
    """
    coords = []
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    
    for i in range(steps + 1):
        t = i / float(steps)
        # Base linear interpolation
        base_lng = p1[0] + t * dx
        base_lat = p1[1] + t * dy
        
        # Parabolic curve displacement perpendicular to main line
        curve_envelope = math.sin(t * math.pi)
        perp_offset_lng = -dy * offset_factor * curve_envelope
        perp_offset_lat = dx * offset_factor * curve_envelope
        
        # Micro street grid turns (sine variation)
        grid_variation = math.sin(t * math.pi * curve_freq) * 0.08 * curve_envelope
        
        lng = base_lng + perp_offset_lng + (-dy * grid_variation)
        lat = base_lat + perp_offset_lat + (dx * grid_variation)
        coords.append((round(lng, 6), round(lat, 6)))
        
    return coords

def generate_fallback_routes(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float
) -> List[Dict[str, Any]]:
    """
    Generates 4 distinct dense, realistic alternative route geometries between origin and destination.
    Route 1: Direct Main Arterial Corridor
    Route 2: Outer Expressway Bypass (Curved North/East, +10% ETA)
    Route 3: Commercial Sector Avenue (Curved South/West, +14% ETA)
    Route 4: Ring Road Boulevard (Curved Outer Ring, +18% ETA)
    """
    direct_dist_m = haversine_distance_m(origin_lat, origin_lng, dest_lat, dest_lng)
    if direct_dist_m < 100.0:
        direct_dist_m = 500.0
        
    p_start = (origin_lng, origin_lat)
    p_end = (dest_lng, dest_lat)
    
    # Route 1: Direct Main Corridor (Base route)
    r1_coords = generate_fallback_dense_path(p_start, p_end, offset_factor=0.04, curve_freq=4.0, steps=35)
    r1_dist = direct_dist_m * 1.08
    r1_dur = (r1_dist / 1000.0) * (3600.0 / 30.0)
    
    # Route 2: Outer Expressway Bypass (+6% dist, +7% duration)
    r2_coords = generate_fallback_dense_path(p_start, p_end, offset_factor=0.14, curve_freq=3.0, steps=38)
    r2_dist = r1_dist * 1.06
    r2_dur = r1_dur * 1.07
    
    # Route 3: Commercial Sector Avenue (+11% dist, +12% duration)
    r3_coords = generate_fallback_dense_path(p_start, p_end, offset_factor=-0.12, curve_freq=4.5, steps=38)
    r3_dist = r1_dist * 1.11
    r3_dur = r1_dur * 1.12

    # Route 4: Ring Road Boulevard (+15% dist, +17% duration)
    r4_coords = generate_fallback_dense_path(p_start, p_end, offset_factor=0.16, curve_freq=2.5, steps=40)
    r4_dist = r1_dist * 1.15
    r4_dur = r1_dur * 1.17
    
    return [
        {
            "id": "route_01",
            "name": "Route 1: Main Arterial Corridor",
            "geometry": {"type": "LineString", "coordinates": r1_coords},
            "distance_m": round(r1_dist, 1),
            "duration_seconds": round(r1_dur, 1),
            "source": "demo_fallback"
        },
        {
            "id": "route_02",
            "name": "Route 2: Outer Expressway Bypass",
            "geometry": {"type": "LineString", "coordinates": r2_coords},
            "distance_m": round(r2_dist, 1),
            "duration_seconds": round(r2_dur, 1),
            "source": "demo_fallback"
        },
        {
            "id": "route_03",
            "name": "Route 3: Commercial Sector Avenue",
            "geometry": {"type": "LineString", "coordinates": r3_coords},
            "distance_m": round(r3_dist, 1),
            "duration_seconds": round(r3_dur, 1),
            "source": "demo_fallback"
        },
        {
            "id": "route_04",
            "name": "Route 4: Ring Road Boulevard",
            "geometry": {"type": "LineString", "coordinates": r4_coords},
            "distance_m": round(r4_dist, 1),
            "duration_seconds": round(r4_dur, 1),
            "source": "demo_fallback"
        }
    ]
