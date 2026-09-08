from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.api import health, routes, observations, geocoding
from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info(f"AAROH Backend API v{settings.VERSION} initialized successfully.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AAROH: Time-aware, context-aware navigation platform backend API",
    lifespan=lifespan,
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(routes.router, prefix=settings.API_V1_STR, tags=["Routes"])
app.include_router(observations.router, prefix=settings.API_V1_STR, tags=["Observations"])
app.include_router(geocoding.router, prefix=settings.API_V1_STR, tags=["Geocoding"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

