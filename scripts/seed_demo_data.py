import os
import json
import uuid

def load_geojson(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("features", [])

def seed_database():
    demo_dir = os.path.join(os.path.dirname(__file__), "..", "data", "demo", "noida")
    pois = load_geojson(os.path.join(demo_dir, "pois.geojson"))
    streetlights = load_geojson(os.path.join(demo_dir, "streetlights.geojson"))
    transit = load_geojson(os.path.join(demo_dir, "transit.geojson"))
    network = load_geojson(os.path.join(demo_dir, "network.geojson"))
    
    print("Demo Data Summary:")
    print(f"- POIs: {len(pois)}")
    print(f"- Streetlights: {len(streetlights)}")
    print(f"- Transit Stops: {len(transit)}")
    print(f"- Network Coverage Polygons: {len(network)}")
    print("Demo data loaded successfully for Noida region.")

if __name__ == "__main__":
    seed_database()
