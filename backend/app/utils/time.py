from datetime import datetime, time
from typing import Dict, Any

def parse_iso_datetime(dt_str: str) -> datetime:
    """Parses ISO datetime string safely."""
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return datetime.now()

def get_time_context(dt: datetime) -> Dict[str, Any]:
    """
    Computes time parameters:
    - is_night: True if travel between 19:30 and 06:00
    - is_weekend: True if Saturday or Sunday
    - hour: Integer 0-23
    """
    hour = dt.hour
    is_night = hour >= 19 or hour < 6
    is_weekend = dt.weekday() >= 5
    
    return {
        "hour": hour,
        "is_night": is_night,
        "is_weekend": is_weekend,
        "day_of_week": dt.strftime("%A")
    }

def is_business_open_at_hour(opening_hours_str: str, hour: int) -> float:
    """
    Returns probability weight (0.0 to 1.0) of business being open at specified hour.
    Default heuristics:
    - 24/7: 1.0
    - Emergency/Police/Hospital: 1.0 always
    - Day store: 0.9 between 9 AM and 10 PM, 0.1 at night
    - Restaurant: 0.9 between 8 AM and 11 PM, 0.2 late night
    """
    if not opening_hours_str or opening_hours_str == "24/7":
        return 1.0
    
    if "24/7" in opening_hours_str:
        return 1.0
        
    # Standard commercial hours check
    if 9 <= hour <= 21:
        return 1.0
    elif 21 < hour <= 23:
        return 0.4
    else:
        return 0.1
