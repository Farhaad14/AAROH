from pydantic import BaseModel, Field
from typing import Optional

class ObservationCreate(BaseModel):
    segment_id: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    type: str = Field(..., description="lighting, activity, surveillance, road_condition, crowding, business_status")
    value: str = Field(..., description="good, poor, quiet, busy, observed, blocked, etc.")

class ObservationResponse(BaseModel):
    id: str
    status: str
    message: str
    timestamp: str
