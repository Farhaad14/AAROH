# Architecture Documentation

AAROH is built as a modular monolith in Python FastAPI, combined with an interactive Next.js 15 App Router frontend.

## Data Flow Pipeline
1. **User Request**: Origin & Destination lat/lng, travel ISO datetime, and priority preference.
2. **Routing Provider**: Obtains 2-3 route options from OpenRouteService / Mapbox / Fallback spatial router.
3. **Geodesic Segmentation Engine**: Breaks LineStrings into 100-250m segments with center coordinate interpolation.
4. **Context Factors Analysis**: Evaluates 9 context factor engines using PostGIS spatial queries or memory GeoJSON datasets.
5. **Deterministic Route Scoring**: Computes segment context scores and applies the 70% average + 30% weakest segment protection formula.
6. **Gemini AI Summary**: Translates deterministic JSON score payloads into natural language text explanations.
7. **Next.js MapLibre Dashboard**: Renders interactive polylines, attention zone markers, score breakdown charts, and segment inspector modals.
