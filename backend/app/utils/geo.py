import math
from typing import List, Tuple
from shapely.geometry import LineString, Point

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two lat/lon coordinates."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def interpolate_point(p1: Tuple[float, float], p2: Tuple[float, float], fraction: float) -> Tuple[float, float]:
    """Interpolate coordinate (lon, lat) between p1 and p2."""
    lon = p1[0] + (p2[0] - p1[0]) * fraction
    lat = p1[1] + (p2[1] - p1[1]) * fraction
    return (lon, lat)

def linestring_length_m(coords: List[Tuple[float, float]]) -> float:
    """Calculates total geodesic distance in meters for a coordinate list [(lon, lat), ...]"""
    total = 0.0
    for i in range(len(coords) - 1):
        total += haversine_distance_m(coords[i][1], coords[i][0], coords[i+1][1], coords[i+1][0])
    return total
