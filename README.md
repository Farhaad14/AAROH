# AAROH: Time-Aware, Context-Aware Navigation Platform

> **"Navigate with context, not just directions."**

AAROH is a production-quality hackathon MVP navigation platform built to evaluate route alternatives based on environmental and contextual conditions rather than distance and ETA alone. AAROH considers public activity, open businesses, emergency access, time context, isolation index, estimated surveillance presence, mobile network coverage, public transit, and street lighting.

---

## 🌟 Core Features

- **Time-Aware Context Engine**: Recalculates route suitability based on the exact departure hour (e.g. 6:00 PM peak commercial activity vs. 11:30 PM late-night reduced transit & business hours).
- **9 Deterministic Context Layers**:
  1. Public Activity Proxy (18%)
  2. Open Businesses (12%)
  3. Emergency Access (15%)
  4. Time Context (8%)
  5. Isolation Index (15%) (`100 - isolation`)
  6. Estimated Surveillance Presence (7%)
  7. Mobile Network Coverage (10%)
  8. Public Transport Schedule (7%)
  9. Street Lighting Coverage (8%)
- **Geodesic Route Segmentation**: Breaks LineString route geometries into ~150m segments using geodesic math.
- **Attention Zone Detection**: Highlights segments scoring below threshold (<60) with actionable context reasons.
- **Gemini AI Natural Text Explanations**: Converts deterministic route scoring arrays into objective explanations without safety or crime prediction claims.
- **Interactive MapLibre GL Dashboard**: Dual-pane UI with route polyline rendering, clickable segment details, side-by-side time comparison demo (6:00 PM vs 11:30 PM), and field observation submission.
- **Resilient Fallbacks**: Dual PostgreSQL/PostGIS & in-memory spatial GeoJSON engine for instant out-of-the-box local execution.

---

## 🏗️ Architecture

```
User Input (Origin, Destination, Travel Time, Preference)
                       │
                       ▼
            Next.js Frontend (App Router)
                       │
                       ▼ REST API
            FastAPI Backend Monolith
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
  Routing Engine             Geospatial Engine
 (OpenRouteService/      (PostGIS / Shapely Geometry
  Mapbox/OSRM/Fallback)    Segmentation 100-250m)
         │                           │
         └─────────────┬─────────────┘
                       ▼
              Context Engine (9 Layers)
   ├── Public Activity Proxy    ├── Estimated Surveillance
   ├── Open Businesses          ├── Mobile Network Score
   ├── Emergency Access         ├── Public Transport
   ├── Time Context Engine      └── Street Lighting
   └── Isolation Index
                       │
                       ▼
         Deterministic Scoring Engine
   ├── Feature Normalization (0-100)
   ├── Segment Score Calculation
   ├── Route Score (70% Avg + 30% Weakest)
   └── Attention Zone & Confidence System
                       │
                       ▼
             Gemini AI Explanation Layer
       (Deterministic scores → Natural text)
                       │
                       ▼
      Structured JSON Response to Frontend
 (MapLibre Rendering, Route Cards, Attention Zones)
```

---

## 🛠️ Open Tech Stack Architecture

- **Map Rendering**: MapLibre GL JS
- **Free Map Tiles & Styles**: OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`)
- **Geographic & POI Data**: OpenStreetMap (OSM)
- **Routing Engine**: OpenRouteService (with realistic spatial fallback engine)
- **OSM POI Fetching**: Overpass API
- **Geographic Cache & Database**: PostgreSQL with PostGIS extension (or bundled GeoJSON spatial engine)
- **Network Coverage Layer**: TRAI / operator polygon coverage data
- **Public Transport**: GTFS schedule integration
- **Backend**: Python 3.12/3.13, FastAPI, Pydantic v2, SQLAlchemy, GeoAlchemy2 / Shapely, PyProj, Google Gemini API (`google-genai`), Pytest.
- **Frontend**: Next.js 15, React 19, TypeScript, MapLibre GL JS, Tailwind CSS, Lucide React icons.

---

## 🚀 Quick Local Setup (Without Docker)

### Prerequisites
- Node.js v20+ and npm
- Python 3.10+
- (Optional) PostgreSQL 14+ with PostGIS extension enabled

---

### 1. Backend Setup

```bash
cd backend

# Install Python requirements
pip install -r requirements.txt

# Create .env file from .env.example
cp .env.example .env

# Run FastAPI Backend Server
uvicorn app.main:app --reload --port 8000
```
Backend server will run at `http://127.0.0.1:8000`. Test health status at `http://127.0.0.1:8000/api/health`.

---

### 2. Run Backend Unit Tests

```bash
py -3.13 -m pytest tests/backend -o pythonpath=backend -v
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install Node modules
npm install

# Run Next.js Development Server
npm run dev
```
Frontend application will be accessible at `http://localhost:3000`.

---

## 📊 Scoring Methodology

Every segment is evaluated on a normalized scale of 0 to 100:

$$\text{Segment Score} = \sum (\text{Feature Score}_i \times \text{Weight}_i)$$

Route-level score combines weighted segment average with weakest-segment protection:

$$\text{Route Score} = 0.70 \times \text{Average Segment Score} + 0.30 \times \text{Weakest Segment Score}$$

---

## 💡 Important Data Honesty & Safety Policy

AAROH explicitly avoids making claims of crime prediction or guaranteed safety. Terms used across the platform are strictly framed as *contextual safety*, *environmental conditions*, *estimated surveillance presence*, *support availability*, and *attention zones*.

---

## 📄 License
MIT License. Developed as a hackathon MVP.
