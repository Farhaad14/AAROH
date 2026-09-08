import time
import requests
from typing import List, Dict, Any, Optional
from app.core.logging import logger
from app.utils.geo import haversine_distance_m

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
]

# In-memory spatial query cache keyed by coarse bbox
# TTL: 15 minutes — long enough to cover a full route analysis session
OVERPASS_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 900  # 15 min

# Thread-local prefetch store: populated once per route, read by segment evaluators
# Key: route_id → list of features covering the full route bbox
_ROUTE_PREFETCH_STORE: Dict[str, List[Dict[str, Any]]] = {}


def set_route_prefetch(route_id: str, features: List[Dict[str, Any]]) -> None:
    """Store prefetched features for a given route so segment evaluators can use them."""
    _ROUTE_PREFETCH_STORE[route_id] = features


def get_route_prefetch(route_id: str) -> Optional[List[Dict[str, Any]]]:
    """Retrieve prefetched features for a route, or None if not available."""
    return _ROUTE_PREFETCH_STORE.get(route_id)


def clear_route_prefetch(route_id: str) -> None:
    """Clear prefetch store for a route after processing is complete."""
    _ROUTE_PREFETCH_STORE.pop(route_id, None)


def fetch_overpass_infrastructure(
    min_lat: float, min_lng: float,
    max_lat: float, max_lng: float,
    timeout: int = 1
) -> List[Dict[str, Any]]:
    """
    Fetches OpenStreetMap infrastructure via Overpass API for a bounding box.
    Uses coarse 2-decimal (~1.1km) grid cache keys for very high cache hit rates.
    """
    # Round bbox to 2 decimals (~1.1km grid) — far coarser than before (was 3 = ~110m)
    # This means adjacent segments within 1km share the same cache entry
    bbox_key = f"{round(min_lat, 2)},{round(min_lng, 2)},{round(max_lat, 2)},{round(max_lng, 2)}"
    now = time.time()

    if bbox_key in OVERPASS_CACHE:
        cached = OVERPASS_CACHE[bbox_key]
        if now - cached["timestamp"] < CACHE_TTL_SECONDS:
            return cached["features"]

    bbox_str = f"{min_lat},{min_lng},{max_lat},{max_lng}"
    query = f"""
    [out:json][timeout:{timeout}];
    (
      node["amenity"~"police|hospital|fire_station|pharmacy|cafe|restaurant|bank|atm|fuel|school|college|clinic"]({bbox_str});
      way["amenity"~"police|hospital|fire_station|pharmacy|cafe|restaurant|bank|atm|fuel|school|college|clinic"]({bbox_str});
      node["shop"~"convenience|supermarket|jewelry|department_store|general"]({bbox_str});
      way["shop"~"convenience|supermarket|jewelry|department_store|general"]({bbox_str});
      node["highway"~"traffic_signals|bus_stop|street_lamp"]({bbox_str});
      node["man_made"="surveillance"]({bbox_str});
      way["highway"]["lit"~"yes|no"]({bbox_str});
      node["railway"="station"]({bbox_str});
      node["station"="subway"]({bbox_str});
    );
    out center body;
    """

    features: List[Dict[str, Any]] = []

    for endpoint in OVERPASS_ENDPOINTS:
        try:
            res = requests.post(endpoint, data={"data": query}, timeout=max(2, timeout))
            if res.status_code == 200:
                data = res.json()
                elements = data.get("elements", [])

                for el in elements:
                    lat = el.get("lat") or el.get("center", {}).get("lat")
                    lng = el.get("lon") or el.get("center", {}).get("lon")
                    if not lat or not lng:
                        continue

                    tags = el.get("tags", {})
                    category = "general"
                    amenity = tags.get("amenity")
                    shop = tags.get("shop")
                    highway = tags.get("highway")
                    railway = tags.get("railway")
                    man_made = tags.get("man_made")
                    lit = tags.get("lit")

                    is_verified_cctv = (man_made == "surveillance")
                    is_verified_lighting = (highway == "street_lamp" or lit == "yes")

                    if amenity in ("police", "hospital", "fire_station", "clinic"):
                        category = "emergency"
                    elif amenity in ("pharmacy", "cafe", "restaurant", "school", "college") or shop in ("convenience", "supermarket", "department_store", "general"):
                        category = "business"
                    elif is_verified_cctv or amenity in ("bank", "atm", "fuel") or shop == "jewelry" or highway == "traffic_signals":
                        category = "surveillance"
                    elif highway == "bus_stop" or railway == "station" or tags.get("station") == "subway":
                        category = "transit"
                    elif is_verified_lighting or lit == "no":
                        category = "lighting"

                    features.append({
                        "id": str(el.get("id")),
                        "category": category,
                        "name": tags.get("name", category.title()),
                        "amenity": amenity,
                        "shop": shop,
                        "highway": highway,
                        "railway": railway,
                        "man_made": man_made,
                        "lit": lit,
                        "is_verified_cctv": is_verified_cctv,
                        "is_verified_lighting": is_verified_lighting,
                        "opening_hours": tags.get("opening_hours"),
                        "lat": round(lat, 6),
                        "lng": round(lng, 6),
                        "source": "osm_overpass"
                    })

                OVERPASS_CACHE[bbox_key] = {"timestamp": now, "features": features}
                logger.info(f"Retrieved {len(features)} live OSM infrastructure items via Overpass API.")
                return features
        except Exception as e:
            logger.warning(f"Overpass endpoint {endpoint} failed ({e}). Trying next endpoint.")

    OVERPASS_CACHE[bbox_key] = {"timestamp": now, "features": features}
    return features


def prefetch_route_overpass(
    route_id: str,
    coordinates: List[List[float]],
    padding_deg: float = 0.01
) -> List[Dict[str, Any]]:
    """
    Fetches Overpass data for an entire route in ONE request.
    Stores results in the prefetch store so all segment evaluators can reuse it.

    Args:
        route_id: Unique route identifier for keying the store.
        coordinates: List of [lng, lat] from route geometry.
        padding_deg: Extra padding around the bbox (~1.1km at 0.01°).
    Returns:
        Full list of features covering the route area.
    """
    if not coordinates:
        return []

    # Compute bounding box of entire route
    lngs = [c[0] for c in coordinates]
    lats = [c[1] for c in coordinates]
    min_lat = min(lats) - padding_deg
    max_lat = max(lats) + padding_deg
    min_lng = min(lngs) - padding_deg
    max_lng = max(lngs) + padding_deg

    logger.info(f"[OVERPASS] Prefetching full route bbox for {route_id}: "
                f"({min_lat:.4f},{min_lng:.4f}) -> ({max_lat:.4f},{max_lng:.4f})")

    try:
        features = fetch_overpass_infrastructure(min_lat, min_lng, max_lat, max_lng, timeout=1)
    except Exception as e:
        logger.warning(f"[OVERPASS] Route prefetch failed for {route_id}: {e}. Falling back to spatial demo store.")
        features = []

    set_route_prefetch(route_id, features)
    logger.info(f"[OVERPASS] Prefetch complete for {route_id}: {len(features)} features cached.")
    return features


def query_nearby_overpass_features(
    center_lat: float,
    center_lng: float,
    radius_m: float = 150.0,
    route_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Returns features within radius_m of center coordinate.

    If route_id is provided and prefetch data exists, filters from the in-memory
    prefetch store (zero network calls). Otherwise falls back to a bbox Overpass fetch.
    """
    # Fast path: use prefetched route data if available
    if route_id:
        prefetched = get_route_prefetch(route_id)
        if prefetched is not None:
            nearby = []
            for f in prefetched:
                dist = haversine_distance_m(center_lat, center_lng, f["lat"], f["lng"])
                if dist <= radius_m:
                    f_copy = dict(f)
                    f_copy["distance_m"] = round(dist, 1)
                    nearby.append(f_copy)
            return nearby

    # Fallback: fetch from Overpass with a per-segment bbox (old behaviour)
    deg_offset = (radius_m + 50.0) / 111000.0
    min_lat = center_lat - deg_offset
    max_lat = center_lat + deg_offset
    min_lng = center_lng - deg_offset
    max_lng = center_lng + deg_offset

    all_feats = fetch_overpass_infrastructure(min_lat, min_lng, max_lat, max_lng)
    nearby = []
    for f in all_feats:
        dist = haversine_distance_m(center_lat, center_lng, f["lat"], f["lng"])
        if dist <= radius_m:
            f_copy = dict(f)
            f_copy["distance_m"] = round(dist, 1)
            nearby.append(f_copy)
    return nearby
