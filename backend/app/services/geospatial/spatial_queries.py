import os
import json
from typing import List, Dict, Any, Tuple
from shapely.geometry import shape, Point, LineString, Polygon
from app.utils.geo import haversine_distance_m
from app.core.logging import logger

class SpatialDataManager:
    _instance = None
    
    def __init__(self):
        self.pois: List[Dict[str, Any]] = []
        self.streetlights: List[Dict[str, Any]] = []
        self.transit: List[Dict[str, Any]] = []
        self.network: List[Dict[str, Any]] = []
        self.observations: List[Dict[str, Any]] = []
        self._load_demo_datasets()

    def _load_demo_datasets(self):
        demo_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "demo", "noida"))
        
        poi_file = os.path.join(demo_dir, "pois.geojson")
        if os.path.exists(poi_file):
            with open(poi_file, "r", encoding="utf-8") as f:
                self.pois = json.load(f).get("features", [])
                
        sl_file = os.path.join(demo_dir, "streetlights.geojson")
        if os.path.exists(sl_file):
            with open(sl_file, "r", encoding="utf-8") as f:
                self.streetlights = json.load(f).get("features", [])

        tr_file = os.path.join(demo_dir, "transit.geojson")
        if os.path.exists(tr_file):
            with open(tr_file, "r", encoding="utf-8") as f:
                self.transit = json.load(f).get("features", [])

        net_file = os.path.join(demo_dir, "network.geojson")
        if os.path.exists(net_file):
            with open(net_file, "r", encoding="utf-8") as f:
                self.network = json.load(f).get("features", [])
                
        logger.info(f"Loaded spatial demo datasets: {len(self.pois)} POIs, {len(self.streetlights)} Streetlights, {len(self.transit)} Transit stops, {len(self.network)} Network polygons")

    def get_nearby_pois(self, lat: float, lng: float, radius_m: float = 250.0) -> List[Tuple[Dict[str, Any], float]]:
        results = []
        for feature in self.pois:
            coords = feature["geometry"]["coordinates"]
            dist = haversine_distance_m(lat, lng, coords[1], coords[0])
            if dist <= radius_m:
                results.append((feature, dist))
        return sorted(results, key=lambda x: x[1])

    def get_nearest_emergency(self, lat: float, lng: float) -> Tuple[float, str]:
        """Finds distance in meters to nearest hospital, police station, or fire station."""
        min_dist = 999999.0
        emergency_type = "none"
        for feature in self.pois:
            poi_type = feature["properties"].get("type", "")
            if poi_type in ["police", "hospital", "fire_station"]:
                coords = feature["geometry"]["coordinates"]
                dist = haversine_distance_m(lat, lng, coords[1], coords[0])
                if dist < min_dist:
                    min_dist = dist
                    emergency_type = poi_type
        return (min_dist, emergency_type)

    def get_nearby_streetlights(self, lat: float, lng: float, radius_m: float = 120.0) -> List[Tuple[Dict[str, Any], float]]:
        results = []
        for feature in self.streetlights:
            coords = feature["geometry"]["coordinates"]
            dist = haversine_distance_m(lat, lng, coords[1], coords[0])
            if dist <= radius_m:
                results.append((feature, dist))
        return results

    def get_nearby_transit(self, lat: float, lng: float, radius_m: float = 400.0) -> List[Tuple[Dict[str, Any], float]]:
        results = []
        for feature in self.transit:
            coords = feature["geometry"]["coordinates"]
            dist = haversine_distance_m(lat, lng, coords[1], coords[0])
            if dist <= radius_m:
                results.append((feature, dist))
        return results

    def get_network_coverage(self, lat: float, lng: float) -> List[Dict[str, Any]]:
        pt = Point(lng, lat)
        results = []
        for feature in self.network:
            poly = shape(feature["geometry"])
            if poly.contains(pt) or poly.distance(pt) < 0.005:
                results.append(feature["properties"])
        return results

    def add_user_observation(self, observation_data: Dict[str, Any]):
        self.observations.append(observation_data)

    def get_nearby_observations(self, lat: float, lng: float, radius_m: float = 300.0) -> List[Dict[str, Any]]:
        results = []
        for obs in self.observations:
            obs_lat = obs.get("lat")
            obs_lng = obs.get("lng")
            if obs_lat and obs_lng:
                dist = haversine_distance_m(lat, lng, obs_lat, obs_lng)
                if dist <= radius_m:
                    results.append(obs)
        return results

spatial_manager = SpatialDataManager()
