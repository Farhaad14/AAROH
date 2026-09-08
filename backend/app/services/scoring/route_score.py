from typing import List, Dict, Any

def calculate_route_scores(segments: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not segments:
        return {
            "score": 50.0,
            "average_segment_score": 50.0,
            "weakest_segment_score": 50.0,
            "confidence": "MEDIUM",
            "features": {
                "activity": 50.0, "businesses": 50.0, "emergency": 50.0,
                "time": 50.0, "isolation": 50.0, "surveillance": 50.0,
                "network": 50.0, "transit": 50.0, "lighting": 50.0
            },
            "attention_zones": []
        }
        
    scores = [s["segment_score"] for s in segments]
    avg_score = sum(scores) / len(scores)
    weakest_score = min(scores)
    
    # Formula: 70% average + 30% weakest segment
    final_route_score = (0.70 * avg_score) + (0.30 * weakest_score)
    final_route_score = round(max(0.0, min(100.0, final_route_score)), 1)
    
    # Calculate feature averages
    feat_keys = ["activity", "businesses", "emergency", "time", "isolation", "surveillance", "network", "transit", "lighting"]
    avg_features = {}
    for fk in feat_keys:
        tot = sum(s["scores"][fk] for s in segments)
        avg_features[fk] = round(tot / len(segments), 1)
        
    # Cluster contiguous low-scoring segments (< 50) into single Attention Zones
    attention_zones = []
    current_cluster = []
    
    for s in segments:
        if s["segment_score"] < 50.0:
            current_cluster.append(s)
        else:
            if current_cluster:
                seg_indices = [c["segment_index"] for c in current_cluster]
                cluster_scores = [c["segment_score"] for c in current_cluster]
                min_score = min(cluster_scores)
                all_reasons = list(set(r for c in current_cluster for r in c["reasons"]))
                all_coords = [coord for c in current_cluster for coord in c["geometry"]["coordinates"]]
                
                mid_idx = len(all_coords) // 2
                rep_coord = all_coords[mid_idx] if all_coords else [77.35, 28.60]
                
                attention_zones.append({
                    "segment_index": seg_indices[0],
                    "segment_start_index": seg_indices[0],
                    "segment_end_index": seg_indices[-1],
                    "score": round(min_score, 1),
                    "severity": "attention" if min_score < 40.0 else "caution",
                    "primary_reasons": all_reasons if all_reasons else ["Reduced ambient context"],
                    "representative_coordinate": rep_coord,
                    "coordinates": all_coords
                })
                current_cluster = []
                
    if current_cluster:
        seg_indices = [c["segment_index"] for c in current_cluster]
        cluster_scores = [c["segment_score"] for c in current_cluster]
        min_score = min(cluster_scores)
        all_reasons = list(set(r for c in current_cluster for r in c["reasons"]))
        all_coords = [coord for c in current_cluster for coord in c["geometry"]["coordinates"]]
        
        mid_idx = len(all_coords) // 2
        rep_coord = all_coords[mid_idx] if all_coords else [77.35, 28.60]
        
        attention_zones.append({
            "segment_index": seg_indices[0],
            "segment_start_index": seg_indices[0],
            "segment_end_index": seg_indices[-1],
            "score": round(min_score, 1),
            "severity": "attention" if min_score < 40.0 else "caution",
            "primary_reasons": all_reasons if all_reasons else ["Reduced ambient context"],
            "representative_coordinate": rep_coord,
            "coordinates": all_coords
        })
            
    # Overall Route Confidence rating
    confidences = [s["confidence"] for s in segments]
    if confidences.count("HIGH") > len(confidences) * 0.6:
        overall_confidence = "HIGH"
    elif confidences.count("LOW") > len(confidences) * 0.4:
        overall_confidence = "LOW"
    else:
        overall_confidence = "MEDIUM"
        
    return {
        "score": final_route_score,
        "average_segment_score": round(avg_score, 1),
        "weakest_segment_score": round(weakest_score, 1),
        "confidence": overall_confidence,
        "features": avg_features,
        "attention_zones": attention_zones
    }
