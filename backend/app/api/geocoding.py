from typing import List, Dict, Any
from fastapi import APIRouter, Query
from app.services.geocoding.nominatim import get_location_suggestions, geocode_address, reverse_geocode

router = APIRouter()

@router.get("/geocoding/search")
def search_locations(q: str = Query(..., min_length=1, description="Search term for Indian location suggestions")) -> List[Dict[str, Any]]:
    """
    Returns live autocomplete suggestions for addresses, cities, landmarks, or streets in India.
    """
    return get_location_suggestions(q)

@router.get("/geocoding/geocode")
def geocode(q: str = Query(..., min_length=1)) -> Dict[str, Any]:
    """
    Geocodes text string into lat/lng.
    """
    return geocode_address(q)

@router.get("/geocoding/reverse")
def reverse(lat: float = Query(...), lng: float = Query(...)) -> Dict[str, Any]:
    """
    Reverse geocodes lat/lng into address string.
    """
    display_name = reverse_geocode(lat, lng)
    return {"lat": lat, "lng": lng, "display_name": display_name}
