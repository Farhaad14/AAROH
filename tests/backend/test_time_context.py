import pytest
from app.services.context.time_context import evaluate_time_context
from app.services.context.businesses import evaluate_open_businesses

def test_time_context_recalculation():
    day_eval = evaluate_time_context("2026-09-07T18:00:00") # 6:00 PM
    night_eval = evaluate_time_context("2026-09-07T23:30:00") # 11:30 PM
    
    assert day_eval["score"] > night_eval["score"]
    assert day_eval["is_night"] == False
    assert night_eval["is_night"] == True
    
    biz_day = evaluate_open_businesses(28.6280, 77.3639, hour=18)
    biz_night = evaluate_open_businesses(28.6280, 77.3639, hour=23)
    
    assert biz_day["score"] >= biz_night["score"]
