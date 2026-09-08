"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { RouteDetail, SegmentDetail } from "@/types/route";

interface AarohMapProps {
  routes: RouteDetail[];
  selectedRouteId: string | null;
  hoveredRouteId?: string | null;
  onSelectRoute: (id: string) => void;
  onSelectSegment: (segment: SegmentDetail) => void;
  originCoords: [number, number];
  destCoords: [number, number];
  debugMode?: boolean;
}

// OpenFreeMap MapLibre-compatible style URL
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Helper function to map segment score to safety color
const getSafetyColor = (score: number): string => {
  if (score >= 80) return "#10b981"; // Emerald Green (Strong)
  if (score >= 60) return "#eab308"; // Yellow (Moderate)
  if (score >= 40) return "#f97316"; // Orange (Caution)
  return "#ef4444"; // Red (Attention Concern)
};

// GeoJSON coordinate and structure validator
const validateRouteGeometry = (route: RouteDetail): boolean => {
  if (!route || !route.geometry) {
    console.error("[AAROH MAP] Invalid route geometry: missing geometry object", route?.id);
    return false;
  }

  if (route.geometry.type !== "LineString") {
    console.error(`[AAROH MAP] Invalid route geometry: type is ${route.geometry.type}, expected LineString`, route.id);
    return false;
  }

  const coords = route.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) {
    console.error("[AAROH MAP] Invalid route geometry: insufficient coordinates", route.id, coords);
    return false;
  }

  for (let i = 0; i < coords.length; i++) {
    const pt = coords[i];
    if (!Array.isArray(pt) || pt.length < 2 || isNaN(pt[0]) || isNaN(pt[1])) {
      console.error(`[AAROH MAP] Invalid coordinate at index ${i} in route ${route.id}`, pt);
      return false;
    }
    const [lng, lat] = pt;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      console.error(`[AAROH MAP] Out-of-bounds coordinate at index ${i} in route ${route.id}: [${lng}, ${lat}]`);
      return false;
    }
  }

  return true;
};

export const AarohMap: React.FC<AarohMapProps> = ({
  routes,
  selectedRouteId,
  hoveredRouteId = null,
  onSelectRoute,
  onSelectSegment,
  originCoords,
  destCoords,
  debugMode = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // 1. Initialize MapLibre map EXACTLY ONCE
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: OPENFREEMAP_STYLE,
      center: originCoords || [77.35, 28.60],
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.resize();
      setMapLoaded(true);

      // Initialize stable GeoJSON sources
      if (!map.getSource("aaroh-alternative-routes")) {
        map.addSource("aaroh-alternative-routes", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      if (!map.getSource("aaroh-recommended-route")) {
        map.addSource("aaroh-recommended-route", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      if (!map.getSource("aaroh-safety-segments")) {
        map.addSource("aaroh-safety-segments", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      // 1. Alternative Route Hit-Area Layer (Wide 20px transparent line for easy clicks)
      if (!map.getLayer("aaroh-alt-hitarea")) {
        map.addLayer({
          id: "aaroh-alt-hitarea",
          type: "line",
          source: "aaroh-alternative-routes",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-width": 20,
            "line-opacity": 0,
          },
        });

        map.on("click", "aaroh-alt-hitarea", (e) => {
          if (e.features && e.features.length > 0) {
            const routeId = e.features[0].properties?.id;
            if (routeId) {
              onSelectRoute(routeId);
            }
          }
        });

        map.on("mouseenter", "aaroh-alt-hitarea", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "aaroh-alt-hitarea", () => {
          map.getCanvas().style.cursor = "";
        });
      }

      // 2. Alternative Route Visible Lines
      if (!map.getLayer("aaroh-alt-layer")) {
        map.addLayer({
          id: "aaroh-alt-layer",
          type: "line",
          source: "aaroh-alternative-routes",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#6366f1",
            "line-width": 6,
            "line-opacity": 0.8,
          },
        });
      }

      // 3. Recommended Base Route Underlay
      if (!map.getLayer("aaroh-rec-layer")) {
        map.addLayer({
          id: "aaroh-rec-layer",
          type: "line",
          source: "aaroh-recommended-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#0284c7",
            "line-width": 8,
            "line-opacity": 0.35,
          },
        });
      }

      // 4. Recommended Route Safety Segments Overlay
      if (!map.getLayer("aaroh-segments-layer")) {
        map.addLayer({
          id: "aaroh-segments-layer",
          type: "line",
          source: "aaroh-safety-segments",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 6,
            "line-opacity": 0.95,
          },
        });
      }
    });

    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };

    window.addEventListener("resize", handleResize);
    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // 2. Reactively update GeoJSON sources when routes, selection, or hover changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;

    // Validate all candidate routes before rendering
    const validRoutes = routes.filter((r) => validateRouteGeometry(r));
    if (validRoutes.length === 0) {
      console.warn("[AAROH MAP] No valid routes available to render");
      return;
    }

    const selectedRoute = validRoutes.find((r) => r.id === selectedRouteId) || validRoutes[0];

    // Build Alternative Routes Feature Collection
    const altFeatures: any[] = validRoutes
      .filter((r) => r.id !== selectedRoute.id)
      .map((r) => ({
        type: "Feature",
        properties: { id: r.id, name: r.name, score: r.score, isHovered: r.id === hoveredRouteId },
        geometry: r.geometry,
      }));

    // Build Selected Recommended Base Route Feature
    const recFeature: any = {
      type: "Feature",
      properties: { id: selectedRoute.id, name: selectedRoute.name },
      geometry: selectedRoute.geometry,
    };

    // Build Safety-Colored Segment Features using EXACT segment LineString geometries
    const safetySegmentFeatures: any[] = selectedRoute.segments.map((seg) => ({
      type: "Feature",
      properties: {
        id: seg.id,
        segment_index: seg.segment_index,
        score: seg.segment_score,
        color: getSafetyColor(seg.segment_score),
        reasons: seg.reasons,
      },
      geometry: seg.geometry,
    }));

    // Update MapLibre sources safely in-place
    const altSource = map.getSource("aaroh-alternative-routes") as maplibregl.GeoJSONSource;
    if (altSource) {
      altSource.setData({ type: "FeatureCollection", features: altFeatures });
    }

    const recSource = map.getSource("aaroh-recommended-route") as maplibregl.GeoJSONSource;
    if (recSource) {
      recSource.setData({ type: "FeatureCollection", features: [recFeature] });
    }

    const segSource = map.getSource("aaroh-safety-segments") as maplibregl.GeoJSONSource;
    if (segSource) {
      segSource.setData({ type: "FeatureCollection", features: safetySegmentFeatures });
    }

    // Highlight hovered alternative route on map
    if (map.getLayer("aaroh-alt-layer")) {
      if (hoveredRouteId) {
        map.setPaintProperty("aaroh-alt-layer", "line-color", [
          "case",
          ["==", ["get", "id"], hoveredRouteId],
          "#38bdf8",
          "#6366f1",
        ]);
        map.setPaintProperty("aaroh-alt-layer", "line-width", [
          "case",
          ["==", ["get", "id"], hoveredRouteId],
          9,
          6,
        ]);
      } else {
        map.setPaintProperty("aaroh-alt-layer", "line-color", "#6366f1");
        map.setPaintProperty("aaroh-alt-layer", "line-width", 6);
      }
    }

    // Clear existing HTML DOM markers
    const markers = document.querySelectorAll(".aaroh-marker");
    markers.forEach((m) => m.remove());

    // 3. Render START Marker (Green A) at exact route origin
    const startCoord = selectedRoute.geometry.coordinates[0] || originCoords;
    const elStart = document.createElement("div");
    elStart.className =
      "aaroh-marker flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white font-extrabold text-xs border-2 border-white shadow-xl z-30 pointer-events-auto transform -translate-x-1/2 -translate-y-1/2";
    elStart.innerText = "A";
    new maplibregl.Marker({ element: elStart, anchor: "center" })
      .setLngLat(startCoord as [number, number])
      .addTo(map);

    // 4. Render DESTINATION Marker (Red B) at exact route destination
    const destCoord =
      selectedRoute.geometry.coordinates[selectedRoute.geometry.coordinates.length - 1] || destCoords;
    const elDest = document.createElement("div");
    elDest.className =
      "aaroh-marker flex items-center justify-center w-8 h-8 rounded-full bg-rose-500 text-white font-extrabold text-xs border-2 border-white shadow-xl z-30 pointer-events-auto transform -translate-x-1/2 -translate-y-1/2";
    elDest.innerText = "B";
    new maplibregl.Marker({ element: elDest, anchor: "center" })
      .setLngLat(destCoord as [number, number])
      .addTo(map);

    // 5. Render Interactive Pill Badges for Alternative Routes on Map
    validRoutes
      .filter((r) => r.id !== selectedRoute.id)
      .forEach((altRoute, idx) => {
        const coords = altRoute.geometry.coordinates;
        const midIdx = Math.floor(coords.length * 0.4);
        const midCoord = coords[midIdx] || coords[0];

        if (midCoord && midCoord.length === 2) {
          const isHovered = altRoute.id === hoveredRouteId;
          const elBadge = document.createElement("div");
          elBadge.className = `aaroh-marker cursor-pointer px-3 py-1.5 rounded-full border shadow-xl flex items-center gap-1.5 font-bold text-xs transition-all z-20 transform -translate-x-1/2 -translate-y-1/2 ${
            isHovered
              ? "bg-sky-500 text-slate-950 border-white scale-110 shadow-sky-500/50"
              : "bg-slate-900/90 text-indigo-300 border-indigo-500/70 hover:bg-sky-600 hover:text-white"
          }`;
          elBadge.innerHTML = `
            <span>Alt ${idx + 1}</span>
            <span class="bg-slate-950/80 px-1.5 py-0.5 rounded text-[10px] text-slate-200 font-semibold">${Math.round(
              altRoute.score
            )} Score</span>
          `;

          elBadge.onclick = (e) => {
            e.stopPropagation();
            onSelectRoute(altRoute.id);
          };

          new maplibregl.Marker({ element: elBadge, anchor: "center" })
            .setLngLat(midCoord as [number, number])
            .addTo(map);
        }
      });

    // 6. Render Attention Zone Markers ONLY for grouped low-score clusters (<50)
    selectedRoute.attention_zones.forEach((az) => {
      const coord = az.representative_coordinate || az.coordinates[Math.floor(az.coordinates.length / 2)];
      if (coord && coord.length === 2) {
        const elAZ = document.createElement("div");
        elAZ.className =
          "aaroh-marker cursor-pointer flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold text-xs border-2 border-amber-300 shadow-2xl animate-pulse z-20 transform -translate-x-1/2 -translate-y-1/2";
        elAZ.title = `Attention Zone (Score ${az.score})`;
        elAZ.innerText = "!";

        elAZ.onclick = (e) => {
          e.stopPropagation();

          if (activePopupRef.current) {
            activePopupRef.current.remove();
          }

          const popupContent = document.createElement("div");
          popupContent.className = "p-3 space-y-2 text-slate-900 font-sans max-w-xs";
          popupContent.innerHTML = `
            <div style="font-weight:bold; font-size:14px; color:#b45309; display:flex; items-center; gap:4px;">
              ⚠ Attention Zone
            </div>
            <div style="font-size:12px; color:#475569;">
              Segments #${az.segment_start_index} to #${az.segment_end_index} (Score ${az.score}/100)
            </div>
            <div style="font-size:11px; color:#334155; margin-top:4px;">
              <strong>Context Factors:</strong>
              <ul style="margin-top:2px; padding-left:12px; list-style-type:disc;">
                ${az.primary_reasons.map((r) => `<li>${r}</li>`).join("")}
              </ul>
            </div>
          `;

          const popup = new maplibregl.Popup({ closeOnClick: true, offset: 15 })
            .setLngLat(coord)
            .setDOMContent(popupContent)
            .addTo(map);

          activePopupRef.current = popup;
        };

        new maplibregl.Marker({ element: elAZ, anchor: "center" })
          .setLngLat(coord)
          .addTo(map);
      }
    });

    // 7. Camera Auto Fit Bounds for all valid routes
    const bounds = new maplibregl.LngLatBounds();
    validRoutes.forEach((r) => {
      r.geometry.coordinates.forEach((c) => bounds.extend(c as [number, number]));
    });

    map.fitBounds(bounds, { padding: 70, maxZoom: 15 });
    setTimeout(() => map.resize(), 100);

    // Update Debug Logs if debug mode enabled
    if (debugMode) {
      const logs = [
        `Valid Routes: ${validRoutes.length}`,
        `Selected Route: ${selectedRoute.id} (${selectedRoute.name})`,
        `Route Length: ${selectedRoute.distance_m}m (${selectedRoute.geometry.coordinates.length} coords)`,
        `Safety Segments: ${selectedRoute.segments.length}`,
        `Attention Zones: ${selectedRoute.attention_zones.length}`,
      ];
      setDebugLogs(logs);
    }
  }, [routes, selectedRouteId, hoveredRouteId, originCoords, destCoords, mapLoaded, debugMode]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950 flex flex-col">
      <div ref={mapContainer} className="w-full h-full flex-1 min-h-[500px]" />

      {/* Debug Mode Overlay */}
      {debugMode && (
        <div className="absolute bottom-4 left-4 z-40 bg-slate-900/90 border border-slate-700 text-slate-200 p-3 rounded-lg text-xs font-mono max-w-sm space-y-1 shadow-2xl pointer-events-none">
          <div className="font-bold text-sky-400 border-b border-slate-800 pb-1 mb-1">
            [AAROH DEBUG MODE]
          </div>
          {debugLogs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AarohMap;
