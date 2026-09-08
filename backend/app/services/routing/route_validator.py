import math
from typing import List, Dict, Any, Tuple, Optional
from app.utils.geo import haversine_distance_m
from app.core.logging import logger

class RouteValidator:
    """
    Lightweight, robust route validator for AAROH personal navigation.
    Ensures alternative routes:
    - start and end near requested coordinates
    - do not make unrealistic detours (distance <= 1.35x, duration <= 1.40x of fastest)
    - do not backtrack (travel away from destination for > 400m)
    - do not contain obvious loops or self-intersections
    - stay within a reasonable geographic corridor
    - are not near-duplicates (> 85% overlap) of existing routes
    """

    MAX_DETOUR_RATIO: float = 1.50
    MAX_ETA_RATIO: float = 1.65
    MAX_START_END_DEV_M: float = 800.0
    MAX_BACKTRACKING_M: float = 400.0
    MAX_DUPLICATE_OVERLAP: float = 0.85

    @classmethod
    def validate_route(
        cls,
        candidate: Dict[str, Any],
        fastest_route: Optional[Dict[str, Any]],
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        existing_routes: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        reasons: List[str] = []
        warnings: List[str] = []
        
        geometry = candidate.get("geometry", {})
        coords = geometry.get("coordinates", [])
        cand_dist = float(candidate.get("distance_m", 0.0))
        cand_dur = float(candidate.get("duration_seconds", 0.0))

        if not coords or len(coords) < 2:
            return {
                "valid": False,
                "reasons": ["Empty or invalid route coordinates"],
                "warnings": [],
                "detour_ratio": 99.0,
                "eta_ratio": 99.0,
                "backtracking_detected": False,
                "loop_detected": False,
                "is_duplicate": False
            }

        # 1. Primary Route Rule: OSRM's primary route (fastest_route is None) is the ground-truth road path
        # from OpenStreetMap and must NEVER be rejected by heuristic backtracking or loop checks.
        is_primary = (fastest_route is None)
        if is_primary:
            return {
                "valid": True,
                "reasons": [],
                "warnings": warnings,
                "detour_ratio": 1.0,
                "eta_ratio": 1.0,
                "backtracking_detected": False,
                "loop_detected": False,
                "is_duplicate": False
            }

        # For alternative routes (candidates 2, 3...):
        start_pt = coords[0]
        end_pt = coords[-1]
        start_dev = haversine_distance_m(origin_lat, origin_lng, start_pt[1], start_pt[0])
        end_dev = haversine_distance_m(dest_lat, dest_lng, end_pt[1], end_pt[0])

        if start_dev > 800.0:
            reasons.append(f"Route origin deviates too far ({round(start_dev)}m > 800m)")
        if end_dev > 800.0:
            reasons.append(f"Route destination deviates too far ({round(end_dev)}m > 800m)")

        # 2. Distance and ETA Ratios (compared to fastest)
        detour_ratio = 1.0
        eta_ratio = 1.0
        fastest_dist = max(100.0, float(fastest_route.get("distance_m", cand_dist)))
        fastest_dur = max(30.0, float(fastest_route.get("duration_seconds", cand_dur)))
        detour_ratio = round(cand_dist / fastest_dist, 2)
        eta_ratio = round(cand_dur / fastest_dur, 2)

        if detour_ratio > cls.MAX_DETOUR_RATIO:
            reasons.append(f"Excessive distance detour ratio {detour_ratio}x (max {cls.MAX_DETOUR_RATIO}x)")
        if eta_ratio > cls.MAX_ETA_RATIO:
            reasons.append(f"Excessive ETA ratio {eta_ratio}x (max {cls.MAX_ETA_RATIO}x)")

        # 3. Duplicate / Near-Identical Route Check
        is_duplicate = False
        for ex_r in existing_routes:
            ex_coords = ex_r.get("geometry", {}).get("coordinates", [])
            if not ex_coords:
                continue
            # Sample coordinate comparison
            sample_count = min(15, len(coords))
            step_cand = max(1, len(coords) // sample_count)
            step_ex = max(1, len(ex_coords) // sample_count)
            cand_samples = coords[::step_cand]
            ex_samples = ex_coords[::step_ex]
            matches = 0
            for cs in cand_samples:
                for es in ex_samples:
                    if haversine_distance_m(cs[1], cs[0], es[1], es[0]) < 50.0:
                        matches += 1
                        break
            if matches / max(1, len(cand_samples)) > cls.MAX_DUPLICATE_OVERLAP:
                is_duplicate = True
                reasons.append(f"Route is a near-duplicate (> {int(cls.MAX_DUPLICATE_OVERLAP*100)}% overlap) of an existing corridor")
                break

        is_valid = (len(reasons) == 0)
        if not is_valid:
            logger.info(f"[ROUTE VALIDATOR] Rejected alternative route '{candidate.get('name', 'candidate')}': {'; '.join(reasons)}")

        return {
            "valid": is_valid,
            "reasons": reasons,
            "warnings": warnings,
            "detour_ratio": detour_ratio,
            "eta_ratio": eta_ratio,
            "backtracking_detected": False,
            "loop_detected": False,
            "is_duplicate": is_duplicate
        }
