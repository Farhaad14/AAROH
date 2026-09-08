import requests
from typing import List, Dict, Any, Optional
from app.core.logging import logger

NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "AAROH-Navigation-App/1.0 (contact@aaroh-safety.org)"

# Fallback presets for popular Indian cities / demo locations
INDIAN_DEMO_PRESETS: List[Dict[str, Any]] = [
    {"display_name": "Sector 62, Noida, Uttar Pradesh, India", "lat": 28.6280, "lng": 77.3639, "city": "Noida", "type": "suburb"},
    {"display_name": "Sector 18, Noida, Uttar Pradesh, India", "lat": 28.5705, "lng": 77.3235, "city": "Noida", "type": "suburb"},
    {"display_name": "Botanical Garden Metro Station, Noida, Uttar Pradesh, India", "lat": 28.5645, "lng": 77.3340, "city": "Noida", "type": "station"},
    {"display_name": "Noida Electronic City Metro Station, Noida, Uttar Pradesh, India", "lat": 28.6275, "lng": 77.3735, "city": "Noida", "type": "station"},
    {"display_name": "Connaught Place, New Delhi, Delhi, India", "lat": 28.6315, "lng": 77.2167, "city": "New Delhi", "type": "commercial"},
    {"display_name": "HSR Layout, Bengaluru, Karnataka, India", "lat": 12.9121, "lng": 77.6445, "city": "Bengaluru", "type": "suburb"},
    {"display_name": "Marine Drive, Mumbai, Maharashtra, India", "lat": 18.9438, "lng": 72.8231, "city": "Mumbai", "type": "road"},
]

def get_location_suggestions(query: str) -> List[Dict[str, Any]]:
    """
    Queries Nominatim API to return live autocomplete suggestions for addresses/locations in India.
    """
    if not query or len(query.strip()) < 2:
        return INDIAN_DEMO_PRESETS[:4]

    query_str = query.strip()

    try:
        params = {
            "q": query_str,
            "format": "json",
            "countrycodes": "in",
            "limit": 6,
            "addressdetails": 1
        }
        headers = {"User-Agent": USER_AGENT}
        res = requests.get(NOMINATIM_SEARCH_URL, params=params, headers=headers, timeout=4)

        if res.status_code == 200:
            data = res.json()
            suggestions = []
            for item in data:
                lat = float(item.get("lat", 0.0))
                lng = float(item.get("lon", 0.0))
                disp_name = item.get("display_name", query_str)
                place_type = item.get("type", item.get("class", "location"))

                address = item.get("address", {})
                city = address.get("city") or address.get("town") or address.get("suburb") or address.get("state_district") or "India"

                suggestions.append({
                    "display_name": disp_name,
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "city": city,
                    "type": place_type
                })

            if suggestions:
                return suggestions
    except Exception as e:
        logger.warning(f"Nominatim autocomplete query failed ({e}). Returning filtered fallback presets.")

    # Fallback filtering
    q_low = query_str.lower()
    matched = [p for p in INDIAN_DEMO_PRESETS if q_low in p["display_name"].lower()]
    return matched if matched else INDIAN_DEMO_PRESETS[:4]

def geocode_address(query: str) -> Dict[str, Any]:
    """
    Geocodes text address into lat/lng anywhere in India using Nominatim.
    """
    suggestions = get_location_suggestions(query)
    if suggestions:
        return suggestions[0]

    return {
        "display_name": query,
        "lat": 28.6280,
        "lng": 77.3639,
        "city": "Noida",
        "type": "fallback"
    }

def reverse_geocode(lat: float, lng: float) -> str:
    """
    Converts lat/lng into human-readable Indian location display name.
    """
    try:
        params = {
            "lat": lat,
            "lon": lng,
            "format": "json",
            "addressdetails": 1
        }
        headers = {"User-Agent": USER_AGENT}
        res = requests.get(NOMINATIM_REVERSE_URL, params=params, headers=headers, timeout=4)
        if res.status_code == 200:
            data = res.json()
            return data.get("display_name", f"{lat:.4f}, {lng:.4f}")
    except Exception as e:
        logger.warning(f"Reverse geocoding failed: {e}")

    return f"Location [{lat:.4f}, {lng:.4f}]"
