from typing import List, Tuple, Dict, Any
from shapely.geometry import LineString, Point
from app.utils.geo import haversine_distance_m, interpolate_point

def segment_route_geometry(coords: List[Tuple[float, float]], target_len_m: float = 150.0) -> List[Dict[str, Any]]:
    """
    Splits a coordinate list [(lon, lat), ...] into geographic segments of approx 100-250m.
    Returns list of dicts with segment_index, geometry (GeoJSON LineString dict), length_m, center point.
    """
    if len(coords) < 2:
        return []
    
    segments = []
    current_segment_coords = [coords[0]]
    current_accumulated_len = 0.0
    segment_idx = 1
    
    for i in range(len(coords) - 1):
        p1 = coords[i]
        p2 = coords[i+1]
        dist_p1_p2 = haversine_distance_m(p1[1], p1[0], p2[1], p2[0])
        
        if dist_p1_p2 == 0:
            continue
            
        remaining_in_edge = dist_p1_p2
        edge_start = p1
        
        while current_accumulated_len + remaining_in_edge >= target_len_m:
            needed = target_len_m - current_accumulated_len
            fraction = needed / remaining_in_edge
            break_pt = interpolate_point(edge_start, p2, fraction)
            
            current_segment_coords.append(break_pt)
            seg_len = current_accumulated_len + needed
            
            # Save completed segment
            center_idx = len(current_segment_coords) // 2
            center_pt = current_segment_coords[center_idx]
            
            segments.append({
                "segment_index": segment_idx,
                "coordinates": current_segment_coords,
                "geometry": {
                    "type": "LineString",
                    "coordinates": current_segment_coords
                },
                "length_m": round(seg_len, 2),
                "center_lng": center_pt[0],
                "center_lat": center_pt[1]
            })
            
            segment_idx += 1
            # Reset for next segment starting at break_pt
            current_segment_coords = [break_pt]
            current_accumulated_len = 0.0
            edge_start = break_pt
            remaining_in_edge -= needed
            
        if remaining_in_edge > 0:
            current_segment_coords.append(p2)
            current_accumulated_len += remaining_in_edge
            
    # Tail segment check
    if len(current_segment_coords) >= 2 and current_accumulated_len > 30.0:
        center_idx = len(current_segment_coords) // 2
        center_pt = current_segment_coords[center_idx]
        segments.append({
            "segment_index": segment_idx,
            "coordinates": current_segment_coords,
            "geometry": {
                "type": "LineString",
                "coordinates": current_segment_coords
            },
            "length_m": round(current_accumulated_len, 2),
            "center_lng": center_pt[0],
            "center_lat": center_pt[1]
        })
    elif len(segments) > 0 and len(current_segment_coords) >= 2:
        # Merge tiny tail into last segment
        segments[-1]["coordinates"].extend(current_segment_coords[1:])
        segments[-1]["geometry"]["coordinates"] = segments[-1]["coordinates"]
        segments[-1]["length_m"] += round(current_accumulated_len, 2)
        
    return segments
