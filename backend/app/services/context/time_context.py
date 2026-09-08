from datetime import datetime
from typing import Dict, Any
from app.utils.time import get_time_context

def evaluate_time_context(travel_datetime_str: str) -> Dict[str, Any]:
    """
    Evaluates time context factor:
    Returns time_score (0 to 100) and contextual metadata.
    Daytime (e.g. 12 PM) provides maximum ambient context score (100).
    Nighttime (e.g. 11:30 PM) reduces baseline ambient light/activity score (40-60).
    Late night (e.g. 2:00 AM) drops score to 30.
    """
    try:
        dt = datetime.fromisoformat(travel_datetime_str.replace("Z", "+00:00"))
    except Exception:
        dt = datetime.now()

    info = get_time_context(dt)
    hour = info["hour"]

    if 7 <= hour <= 18:
        score = 100.0
    elif (18 < hour <= 20) or (5 <= hour < 7):
        score = 75.0
    elif 20 < hour <= 23:
        score = 55.0
    else:  # 00:00 to 05:00
        score = 30.0

    return {
        "score": score,
        "hour": hour,
        "is_night": info["is_night"],
        "is_weekend": info["is_weekend"],
        "day_of_week": info["day_of_week"]
    }
