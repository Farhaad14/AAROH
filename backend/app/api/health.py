from fastapi import APIRouter
from app.core.database import IS_POSTGRES_AVAILABLE

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "AAROH Navigation API",
        "version": "1.0.0",
        "database": "PostgreSQL + PostGIS" if IS_POSTGRES_AVAILABLE else "Spatial GeoJSON Memory Engine"
    }
