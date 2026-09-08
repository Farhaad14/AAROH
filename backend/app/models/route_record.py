from sqlalchemy import Column, String, DateTime, JSON
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class RouteEvaluationRecord(Base):
    __tablename__ = "route_evaluations"

    request_id = Column(String(64), primary_key=True, index=True)
    created_at = Column(DateTime, default=utc_now)
    travel_datetime = Column(String(64), nullable=True)
    recommended_route_id = Column(String(64), nullable=True)
    explanation_source = Column(String(64), nullable=True)
    routes_json = Column(JSON, nullable=False)
    explanation_json = Column(JSON, nullable=False)
