import os
import json
import requests
import argparse

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

POI_QUERY_TEMPLATE = """
[out:json][timeout:25];
(
  node["amenity"="police"]({south},{west},{north},{east});
  node["amenity"="hospital"]({south},{west},{north},{east});
  node["amenity"="bank"]({south},{west},{north},{east});
  node["amenity"="atm"]({south},{west},{north},{east});
  node["amenity"="fuel"]({south},{west},{north},{east});
  node["amenity"="pharmacy"]({south},{west},{north},{east});
  node["amenity"="restaurant"]({south},{west},{north},{east});
  node["shop"="jewellery"]({south},{west},{north},{east});
  node["shop"="mall"]({south},{west},{north},{east});
);
out body;
"""

def fetch_osm_pois(bbox):
    south, west, north, east = bbox
    query = POI_QUERY_TEMPLATE.format(south=south, west=west, north=north, east=east)
    print(f"Querying Overpass API for bbox {bbox}...")
    try:
        response = requests.post(OVERPASS_URL, data={"data": query}, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        features = []
        for element in data.get("elements", []):
            tags = element.get("tags", {})
            feature = {
                "type": "Feature",
                "properties": {
                    "id": f"osm_{element['id']}",
                    "name": tags.get("name", "Unknown POI"),
                    "type": tags.get("amenity") or tags.get("shop", "commercial_complex"),
                    "opening_hours": tags.get("opening_hours", "unknown"),
                    "source": "osm",
                    "confidence": "HIGH"
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [element["lon"], element["lat"]]
                }
            }
            features.append(feature)
            
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "osm")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, "pois_imported.geojson")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(geojson, f, indent=2)
        print(f"Successfully saved {len(features)} POIs to {output_path}")
    except Exception as e:
        print(f"Error downloading OSM POIs: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download OSM POIs for bounding box.")
    parser.add_argument("--bbox", nargs=4, type=float, default=[28.50, 77.30, 28.65, 77.40],
                        help="BBox: south west north east")
    args = parser.parse_args()
    fetch_osm_pois(args.bbox)
