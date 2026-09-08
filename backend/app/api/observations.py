import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.schemas.observation import ObservationCreate, ObservationResponse
from app.services.geospatial.spatial_queries import spatial_manager

router = APIRouter()

@router.post("/observations", response_model=ObservationResponse)
def submit_observation(obs: ObservationCreate):
    obs_id = f"obs_{uuid.uuid4().hex[:8]}"
    timestamp = datetime.now().isoformat()
    
    obs_record = {
        "id": obs_id,
        "segment_id": obs.segment_id,
        "lat": obs.lat,
        "lng": obs.lng,
        "type": obs.type,
        "value": obs.value,
        "timestamp": timestamp,
        "confidence": "MEDIUM",
        "source": "user"
    }
    
    spatial_manager.add_user_observation(obs_record)
    
    return {
        "id": obs_id,
        "status": "success",
        "message": f"User observation '{obs.type}:{obs.value}' successfully recorded.",
        "timestamp": timestamp
    }
