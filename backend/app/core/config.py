import os
import json
from pydantic_settings import BaseSettings
from typing import Dict, Any
from dotenv import load_dotenv

# Load root .env and backend .env if present
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

class Settings(BaseSettings):
    PROJECT_NAME: str = "AAROH Navigation API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aaroh")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENROUTESERVICE_API_KEY: str = os.getenv("OPENROUTESERVICE_API_KEY", "")
    
    # Paths to config JSON files
    ROOT_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    
    @property
    def scoring_weights(self) -> Dict[str, float]:
        path = os.path.join(self.ROOT_DIR, "config", "scoring_weights.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "activity": 0.18, "businesses": 0.12, "emergency": 0.15,
            "time": 0.08, "isolation": 0.15, "surveillance": 0.07,
            "network": 0.10, "transit": 0.07, "lighting": 0.08
        }

    @property
    def surveillance_weights(self) -> Dict[str, Any]:
        path = os.path.join(self.ROOT_DIR, "config", "surveillance_weights.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "proxy_weights": {"police": 1.0, "bank": 1.0, "atm": 0.9, "jewellery": 0.9, "fuel": 0.8, "traffic_signal": 0.8, "mall": 0.8, "commercial_complex": 0.8, "hospital": 0.7, "metro_station": 0.7},
            "distance_decay": {"tier_1_dist_m": 50, "tier_1_weight": 1.0, "tier_2_dist_m": 100, "tier_2_weight": 0.7, "tier_3_dist_m": 150, "tier_3_weight": 0.4, "cutoff_dist_m": 250},
            "max_score_cap": 95.0
        }

    @property
    def feature_config(self) -> Dict[str, Any]:
        path = os.path.join(self.ROOT_DIR, "config", "feature_config.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "segmentation": {"target_segment_length_m": 150, "min_segment_length_m": 80, "max_segment_length_m": 250},
            "attention_thresholds": {"strong": 75, "moderate": 60, "caution": 40},
            "search_radii_m": {"businesses": 150, "emergency": 2500, "lighting": 100, "transit": 300, "surveillance": 200, "activity": 200},
            "route_scoring": {"average_weight": 0.70, "weakest_weight": 0.30}
        }

settings = Settings()
