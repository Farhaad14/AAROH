import requests
from typing import List, Dict, Any, Optional
from app.core.logging import logger
from app.services.routing.route_validator import RouteValidator
from app.services.routing.fallback_router import generate_fallback_routes

OSRM_SERVERS = [
    "https://router.project-osrm.org",
    "https://routing.openstreetmap.de/routed-car"
]

ROUTE_LABELS = [
    "Main Arterial Corridor",
    "Commercial Sector Avenue",
    "Outer Ring Boulevard",
    "Connecting Sector Parkway"
]

def fetch_route_alternatives(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float
) -> List[Dict[str, Any]]:
    """
    Fetches native, real-road routes from OSRM using alternatives=3.
    Applies RouteValidator to ensure only geographically sensible, non-looping,
    non-backtracking alternatives are returned.
    Real distance and duration metrics from OSRM are preserved without fake clamping.
    """
    valid_routes: List[Dict[str, Any]] = []
    fastest_route: Optional[Dict[str, Any]] = None

    for base_url in OSRM_SERVERS:
        try:
            # Request native alternatives from OSRM (up to 3 alternatives)
            osrm_url = (
                f"{base_url}/route/v1/driving/"
                f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
                f"?overview=full&geometries=geojson&alternatives=3"
            )
            res = requests.get(osrm_url, timeout=3.5)
            if res.status_code != 200:
                continue

            data = res.json()
            raw_routes = data.get("routes", [])
            if not raw_routes:
                continue

            # Process candidates natively
            for idx, r_item in enumerate(raw_routes):
                geom = r_item.get("geometry")
                dist_m = float(r_item.get("distance", 0.0))
                dur_s = float(r_item.get("duration", 0.0))

                candidate = {
                    "id": f"route_0{len(valid_routes) + 1}",
                    "name": f"Route {len(valid_routes) + 1}: {ROUTE_LABELS[min(len(valid_routes), len(ROUTE_LABELS)-1)]}",
                    "geometry": geom,
                    "distance_m": round(dist_m, 1),
                    "duration_seconds": round(dur_s, 1),
                    "source": "osrm"
                }

                # Validate against RouteValidator
                val_result = RouteValidator.validate_route(
                    candidate=candidate,
                    fastest_route=fastest_route,
                    origin_lat=origin_lat,
                    origin_lng=origin_lng,
                    dest_lat=dest_lat,
                    dest_lng=dest_lng,
                    existing_routes=valid_routes
                )

                if val_result["valid"]:
                    candidate["validation"] = val_result
                    if not fastest_route:
                        fastest_route = candidate
                    valid_routes.append(candidate)
                else:
                    logger.info(
                        f"[ROUTER] Rejected OSRM alternative candidate {idx+1}: "
                        f"{'; '.join(val_result['reasons'])}"
                    )

            # If OSRM native Contraction Hierarchies returned fewer than 3 corridors,
            # query real-road corridors via snapped lateral road waypoints on OpenStreetMap.
            if len(valid_routes) < 3 and fastest_route:
                dlat = dest_lat - origin_lat
                dlng = dest_lng - origin_lng
                norm = (dlat**2 + dlng**2) ** 0.5
                if norm > 0.001:
                    perp_lat = -dlng / norm
                    perp_lng = dlat / norm
                    mid_lat = (origin_lat + dest_lat) / 2.0
                    mid_lng = (origin_lng + dest_lng) / 2.0

                    corridor_attempts = [
                        (-0.006, "Western Corridor Avenue"),
                        (0.006, "Eastern Sector Parkway"),
                        (-0.010, "Outer West Arterial"),
                        (0.010, "Outer East Boulevard")
                    ]

                    for offset, label in corridor_attempts:
                        if len(valid_routes) >= 3:
                            break
                        t_lat = mid_lat + offset * perp_lat
                        t_lng = mid_lng + offset * perp_lng
                        try:
                            # 1. Snap to nearest real drivable road node on OpenStreetMap
                            near_url = f"{base_url}/nearest/v1/driving/{t_lng},{t_lat}"
                            near_res = requests.get(near_url, timeout=2.0)
                            if near_res.status_code != 200:
                                continue
                            near_json = near_res.json()
                            waypoints = near_json.get("waypoints", [])
                            if not waypoints:
                                continue
                            w_lng, w_lat = waypoints[0]["location"]

                            # 2. Query OSRM for the exact driving path through that snapped road waypoint
                            via_url = (
                                f"{base_url}/route/v1/driving/"
                                f"{origin_lng},{origin_lat};{w_lng},{w_lat};{dest_lng},{dest_lat}"
                                f"?overview=full&geometries=geojson&continue_straight=true"
                            )
                            via_res = requests.get(via_url, timeout=3.0)
                            if via_res.status_code != 200:
                                continue
                            via_json = via_res.json()
                            v_routes = via_json.get("routes", [])
                            if not v_routes:
                                continue

                            vr = v_routes[0]
                            cand = {
                                "id": f"route_0{len(valid_routes) + 1}",
                                "name": f"Route {len(valid_routes) + 1}: {ROUTE_LABELS[min(len(valid_routes), len(ROUTE_LABELS)-1)]}",
                                "geometry": vr.get("geometry"),
                                "distance_m": round(float(vr.get("distance", 0.0)), 1),
                                "duration_seconds": round(float(vr.get("duration", 0.0)), 1),
                                "source": "osrm"
                            }

                            val_res = RouteValidator.validate_route(
                                candidate=cand,
                                fastest_route=fastest_route,
                                origin_lat=origin_lat,
                                origin_lng=origin_lng,
                                dest_lat=dest_lat,
                                dest_lng=dest_lng,
                                existing_routes=valid_routes
                            )

                            if val_res["valid"]:
                                cand["validation"] = val_res
                                valid_routes.append(cand)
                                logger.info(f"[ROUTER] Added validated real-road corridor alternative: {cand['name']}")
                            else:
                                logger.info(f"[ROUTER] Corridor candidate {label} rejected: {'; '.join(val_res['reasons'])}")
                        except Exception as ex:
                            logger.debug(f"[ROUTER] Corridor attempt failed: {ex}")

            if valid_routes:
                logger.info(
                    f"[ROUTER] Successfully resolved {len(valid_routes)} validated real road route(s) via {base_url}."
                )
                return valid_routes
            elif raw_routes:
                logger.warning("[ROUTER] Validator filtered all alternatives; falling back to primary OSRM route.")
                r0 = raw_routes[0]
                return [{
                    "id": "route_01",
                    "name": "Route 1: Main Arterial Corridor",
                    "geometry": r0.get("geometry"),
                    "distance_m": round(float(r0.get("distance", 0.0)), 1),
                    "duration_seconds": round(float(r0.get("duration", 0.0)), 1),
                    "source": "osrm"
                }]

        except Exception as e:
            logger.warning(f"[ROUTER] OSRM query failed for {base_url}: {e}")
            continue

    # Fallback to demo safety net ONLY if OSRM network is completely unreachable
    logger.warning("[ROUTER] OSRM network completely unavailable. Falling back to demo router.")
    return generate_fallback_routes(origin_lat, origin_lng, dest_lat, dest_lng)
