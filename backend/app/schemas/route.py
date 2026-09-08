from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RouteRequestCreate(BaseModel):
    origin_lat: float = Field(..., description="Origin Latitude")
    origin_lng: float = Field(..., description="Origin Longitude")
    destination_lat: float = Field(..., description="Destination Latitude")
    destination_lng: float = Field(..., description="Destination Longitude")
    origin_address: Optional[str] = Field(None, description="Optional text address for origin")
    destination_address: Optional[str] = Field(None, description="Optional text address for destination")
    travel_datetime: str = Field(..., description="ISO 8601 travel date time")
    priority_safety: bool = Field(True, description="Prioritize contextual safety over travel time")

class FeatureScoresSchema(BaseModel):
    activity: float
    businesses: float
    emergency: float
    time: float
    isolation: float
    surveillance: float
    network: float
    transit: float
    lighting: float

class AttentionZoneSchema(BaseModel):
    segment_start_index: int
    segment_end_index: int
    segment_index: Optional[int] = None
    score: float
    severity: str # moderate, caution, attention
    primary_reasons: List[str]
    representative_coordinate: List[float]
    coordinates: List[List[float]]

class SegmentDetailSchema(BaseModel):
    id: str
    segment_index: int
    length_m: float
    segment_score: float
    confidence: str
    scores: FeatureScoresSchema
    geometry: Dict[str, Any]
    reasons: List[str]
    provenance: Optional[Dict[str, Any]] = None

class RouteDetailSchema(BaseModel):
    id: str
    name: str
    distance_m: float
    duration_seconds: float
    score: float
    confidence: str
    features: FeatureScoresSchema
    attention_zones: List[AttentionZoneSchema]
    segments: List[SegmentDetailSchema]
    geometry: Dict[str, Any]
    source: Optional[str] = "osrm"
    validation: Optional[Dict[str, Any]] = None

class RouteAnalysisResponse(BaseModel):
    request_id: str
    travel_datetime: str
    recommended_route_id: str
    routes: List[RouteDetailSchema]
    explanation: Any = "Route context analysis completed successfully."
    explanation_source: Optional[str] = "deterministic_fallback"
