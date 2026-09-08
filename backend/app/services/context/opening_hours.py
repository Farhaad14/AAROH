import re
from datetime import datetime
from typing import Optional
from app.core.logging import logger

def parse_opening_hours(opening_hours_str: Optional[str], travel_datetime: Optional[datetime] = None) -> bool:
    """
    Evaluates whether a shop or amenity with OpenStreetMap opening_hours string is OPEN at travel_datetime.
    If travel_datetime is None, uses current datetime.
    Supports formats:
    - '24/7', 'open' -> True
    - 'off', 'closed' -> False
    - Time ranges like '09:00-22:00', '10:00 - 21:30'
    - Day prefix like 'Mo-Su 09:00-22:00', 'Mo-Fr 08:00-20:00'
    - Crossover night ranges like '18:00-02:00'
    - Fallback: if tag is missing, assumes open during day (08:00-22:00) and closed late night (22:00-06:00).
    """
    if not travel_datetime:
        travel_datetime = datetime.now()

    target_hour = travel_datetime.hour
    target_minute = travel_datetime.minute
    target_time_min = target_hour * 60 + target_minute
    weekday_idx = travel_datetime.weekday() # 0 = Monday, 6 = Sunday

    if not opening_hours_str or not isinstance(opening_hours_str, str):
        return None

    oh_clean = opening_hours_str.strip().lower()

    if "24/7" in oh_clean or oh_clean == "open" or "24 hours" in oh_clean:
        return True

    if oh_clean in ("off", "closed"):
        return False

    # Extract time ranges matching HH:MM-HH:MM
    time_match = re.search(r'(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})', oh_clean)
    if time_match:
        h1, m1, h2, m2 = map(int, time_match.groups())
        start_min = h1 * 60 + m1
        end_min = h2 * 60 + m2

        if start_min <= end_min:
            return start_min <= target_time_min <= end_min
        else:
            # Overnight range (e.g. 18:00 to 02:00)
            return target_time_min >= start_min or target_time_min <= end_min

    return None
