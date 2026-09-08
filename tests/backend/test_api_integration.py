from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_routes_analysis_endpoint():
    payload = {
        "origin_lat": 28.6280,
        "origin_lng": 77.3639,
        "destination_lat": 28.5705,
        "destination_lng": 77.3235,
        "travel_datetime": "2026-09-07T18:00:00",
        "priority_safety": True
    }
    response = client.post("/api/routes", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "routes" in data
    assert len(data["routes"]) >= 2
    assert "recommended_route_id" in data
    assert "explanation" in data

def test_observation_submission_endpoint():
    payload = {
        "type": "lighting",
        "value": "poor",
        "lat": 28.6280,
        "lng": 77.3639
    }
    response = client.post("/api/observations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

def test_geocoding_autocomplete_endpoint():
    response = client.get("/api/geocoding/search?q=Noida")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "display_name" in data[0]

