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
  onSelectSegment?: (segment: SegmentDetail) => void;
  originCoords: [number, number];
  destCoords: [number, number];
  debugMode?: boolean;
}

// Dark-themed MapLibre style from OpenFreeMap
const DARK_MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";
// Fallback if dark tiles take longer to load
const LIBERTY_MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/**
 * Maps route segment score to the requested palette:
 * - High score (>= 75): Vibrant neon pink (#ff1493)
 * - Moderate (60-74): Electric amethyst (#a855f7)
 * - Low / Attention (< 60): Dull, desaturated slate-grey (#64748b)
 */
const getSegmentColor = (score: number): string => {
  if (score >= 75) return "#ff1493"; // Vibrant neon pink
  if (score >= 60) return "#a855f7"; // Electric amethyst
  return "#64748b"; // Dull desaturated slate-grey
};

// GeoJSON coordinate and structure validator
const validateRouteGeometry = (route: RouteDetail): boolean => {
  if (!route || !route.geometry) return false;
  if (route.geometry.type !== "LineString") return false;
  const coords = route.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return false;

  for (let i = 0; i < coords.length; i++) {
    const pt = coords[i];
    if (!Array.isArray(pt) || pt.length < 2 || isNaN(pt[0]) || isNaN(pt[1])) return false;
    const [lng, lat] = pt;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
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
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const lastAnimatedRouteIdRef = useRef<string | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  // 1. Initialize MapLibre map instance once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: DARK_MAP_STYLE,
      center: originCoords || [77.35, 28.6],
      zoom: 12,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.on("load", () => {
      map.resize();
      setMapLoaded(true);

      // GeoJSON Sources
      if (!map.getSource("aaroh-alt-routes")) {
        map.addSource("aaroh-alt-routes", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      if (!map.getSource("aaroh-selected-base")) {
        map.addSource("aaroh-selected-base", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      if (!map.getSource("aaroh-segments")) {
        map.addSource("aaroh-segments", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      // ── Layers ──

      // 1. Alternative Route Hit-Area for easy click targeting
      if (!map.getLayer("aaroh-alt-hitarea")) {
        map.addLayer({
          id: "aaroh-alt-hitarea",
          type: "line",
          source: "aaroh-alt-routes",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-width": 24,
            "line-opacity": 0,
          },
        });

        map.on("click", "aaroh-alt-hitarea", (e) => {
          if (e.features && e.features.length > 0) {
            const routeId = e.features[0].properties?.id;
            if (routeId) onSelectRoute(routeId);
          }
        });

        map.on("mouseenter", "aaroh-alt-hitarea", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "aaroh-alt-hitarea", () => {
          map.getCanvas().style.cursor = "";
        });
      }

      // 2. Alternative Routes Visible Line (semi-transparent plum/violet)
      if (!map.getLayer("aaroh-alt-line")) {
        map.addLayer({
          id: "aaroh-alt-line",
          type: "line",
          source: "aaroh-alt-routes",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#7928ca",
            "line-width": 5,
            "line-opacity": 0.65,
          },
        });
      }

      // 3. Selected Route Ambient Neon Glow Underlay
      if (!map.getLayer("aaroh-glow-underlay")) {
        map.addLayer({
          id: "aaroh-glow-underlay",
          type: "line",
          source: "aaroh-selected-base",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#ff1493",
            "line-width": 14,
            "line-opacity": 0.25,
            "line-blur": 6,
          },
        });
      }

      // 4. Selected Route Base Outline
      if (!map.getLayer("aaroh-base-line")) {
        map.addLayer({
          id: "aaroh-base-line",
          type: "line",
          source: "aaroh-selected-base",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#150b26",
            "line-width": 8,
            "line-opacity": 0.9,
          },
        });
      }

      // 5. Dynamic Safety Segments Polyline (Bright Neon Pink vs Dull Slate Grey)
      if (!map.getLayer("aaroh-segments-line")) {
        map.addLayer({
          id: "aaroh-segments-line",
          type: "line",
          source: "aaroh-segments",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 5.5,
            "line-opacity": 0.95,
          },
        });
      }
    });

    const handleResize = () => {
      mapRef.current?.resize();
    };

    window.addEventListener("resize", handleResize);
    mapRef.current = map;

    return () => {
      window.removeEventListener("resize", handleResize);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // 2. Render routes, markers, and trigger camera flyTo animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.isStyleLoaded()) return;

    const validRoutes = routes.filter((r) => validateRouteGeometry(r));
    if (validRoutes.length === 0) return;

    const selectedRoute = validRoutes.find((r) => r.id === selectedRouteId) || validRoutes[0];

    // Clear old HTML markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Alternative Routes features
    const altFeatures: any[] = validRoutes
      .filter((r) => r.id !== selectedRoute.id)
      .map((r) => ({
        type: "Feature",
        properties: { id: r.id, name: r.name, score: r.score },
        geometry: r.geometry,
      }));

    // Selected Route Base feature
    const selectedFeature: any = {
      type: "Feature",
      properties: { id: selectedRoute.id, name: selectedRoute.name },
      geometry: selectedRoute.geometry,
    };

    // Safety Segments features with score-driven styling
    const segmentFeatures: any[] = selectedRoute.segments.map((seg) => ({
      type: "Feature",
      properties: {
        id: seg.id,
        segment_index: seg.segment_index,
        score: seg.segment_score,
        color: getSegmentColor(seg.segment_score),
      },
      geometry: seg.geometry,
    }));

    // Update GeoJSON sources safely
    const altSource = map.getSource("aaroh-alt-routes") as maplibregl.GeoJSONSource;
    altSource?.setData({ type: "FeatureCollection", features: altFeatures });

    const baseSource = map.getSource("aaroh-selected-base") as maplibregl.GeoJSONSource;
    baseSource?.setData({ type: "FeatureCollection", features: [selectedFeature] });

    const segSource = map.getSource("aaroh-segments") as maplibregl.GeoJSONSource;
    segSource?.setData({ type: "FeatureCollection", features: segmentFeatures });

    // Update Hover highlight on alternative route
    if (map.getLayer("aaroh-alt-line")) {
      if (hoveredRouteId) {
        map.setPaintProperty("aaroh-alt-line", "line-color", [
          "case",
          ["==", ["get", "id"], hoveredRouteId],
          "#d946ef",
          "#7928ca",
        ]);
        map.setPaintProperty("aaroh-alt-line", "line-width", [
          "case",
          ["==", ["get", "id"], hoveredRouteId],
          8,
          5,
        ]);
      } else {
        map.setPaintProperty("aaroh-alt-line", "line-color", "#7928ca");
        map.setPaintProperty("aaroh-alt-line", "line-width", 5);
      }
    }

    // ── Custom Flowery HTML Markers (Blooming Lotus 🌸 vs Wilted Roses 🥀) ──
    const newMarkers: maplibregl.Marker[] = [];

    // Origin Marker (🌸 Radiant Lotus Origin)
    const startCoord = selectedRoute.geometry.coordinates[0] || originCoords;
    const elStart = document.createElement("div");
    elStart.className =
      "aaroh-origin-marker flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff1493] to-[#d946ef] text-white text-base shadow-[0_0_20px_rgba(255,20,147,0.8)] border-2 border-white cursor-pointer transform hover:scale-110 transition";
    elStart.innerHTML = "🌸";
    elStart.title = `Start: ${selectedRoute.name.split("→")[0] || "Origin"}`;
    const startMarker = new maplibregl.Marker({ element: elStart, anchor: "center" })
      .setLngLat(startCoord as [number, number])
      .addTo(map);
    newMarkers.push(startMarker);

    // Destination Marker (📍 Radiant Violet Goal)
    const destCoord =
      selectedRoute.geometry.coordinates[selectedRoute.geometry.coordinates.length - 1] || destCoords;
    const elDest = document.createElement("div");
    elDest.className =
      "aaroh-dest-marker flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#a855f7] to-[#7928ca] text-white text-base shadow-[0_0_20px_rgba(168,85,247,0.8)] border-2 border-white cursor-pointer transform hover:scale-110 transition";
    elDest.innerHTML = "📍";
    elDest.title = `Destination: ${selectedRoute.name.split("→")[1] || "Destination"}`;
    const destMarker = new maplibregl.Marker({ element: elDest, anchor: "center" })
      .setLngLat(destCoord as [number, number])
      .addTo(map);
    newMarkers.push(destMarker);

    // Segment Node Markers:
    // High score (>=75) -> Blooming lotus 🌸 at node intervals
    // Low score (<60) -> Wilted drooping grey-brown rose 🥀
    selectedRoute.segments.forEach((seg, idx) => {
      // Pick a representative coordinate along the segment
      const coords = seg.geometry?.coordinates;
      if (!coords || coords.length === 0) return;
      const midCoord = coords[Math.floor(coords.length / 2)];
      if (!midCoord || midCoord.length < 2) return;

      const isHighScore = seg.segment_score >= 75;
      const isLowScore = seg.segment_score < 60;

      // Filter nodes to avoid clutter: only show every 2nd or 3rd high node, or all low nodes
      if (isHighScore && idx % 3 !== 0) return;

      const elFlower = document.createElement("div");
      elFlower.className = `aaroh-flower-marker flex items-center justify-center rounded-full cursor-pointer transition transform hover:scale-125 z-20 ${
        isHighScore
          ? "w-7 h-7 bg-[#150b26]/90 border border-[#ff1493]/60 text-sm shadow-[0_0_15px_rgba(255,20,147,0.6)] animate-pulse-glow"
          : isLowScore
          ? "w-7 h-7 bg-[#1e1e24]/90 border border-slate-600/70 text-sm shadow-[0_0_10px_rgba(100,116,139,0.4)] opacity-85"
          : "w-6 h-6 bg-[#150b26]/80 border border-[#a855f7]/40 text-xs shadow-fuchsia-glow"
      }`;

      elFlower.innerHTML = isHighScore ? "🌸" : isLowScore ? "🥀" : "✨";
      elFlower.title = `Segment #${seg.segment_index}: Score ${seg.segment_score}/100`;

      elFlower.onclick = (e) => {
        e.stopPropagation();
        if (onSelectSegment) onSelectSegment(seg);

        if (activePopupRef.current) activePopupRef.current.remove();

        const popupDiv = document.createElement("div");
        popupDiv.className =
          "p-3 rounded-xl bg-[#150b26] text-white border border-[#d946ef]/40 shadow-2xl font-sans max-w-xs text-xs space-y-1.5";
        popupDiv.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between; font-weight:bold; color:${isHighScore ? "#ff1493" : isLowScore ? "#cbd5e1" : "#d946ef"};">
            <span>${isHighScore ? "🌸 Blooming Corridor" : isLowScore ? "🥀 Wilted / Attention Spot" : "✨ Balanced Pathway"}</span>
            <span>${seg.segment_score}/100</span>
          </div>
          <p style="color:#e2e8f0; font-size:11px; margin:0;">
            ${seg.reasons && seg.reasons.length > 0 ? seg.reasons.join(" • ") : "Context factor details analyzed."}
          </p>
        `;

        const popup = new maplibregl.Popup({ closeOnClick: true, offset: 12 })
          .setLngLat(midCoord as [number, number])
          .setDOMContent(popupDiv)
          .addTo(map);

        activePopupRef.current = popup;
      };

      const marker = new maplibregl.Marker({ element: elFlower, anchor: "center" })
        .setLngLat(midCoord as [number, number])
        .addTo(map);
      newMarkers.push(marker);
    });

    // Alternative Route Clickable Badges
    validRoutes
      .filter((r) => r.id !== selectedRoute.id)
      .forEach((altRoute, idx) => {
        const coords = altRoute.geometry.coordinates;
        const midIdx = Math.floor(coords.length * 0.45);
        const midCoord = coords[midIdx] || coords[0];

        if (midCoord && midCoord.length === 2) {
          const isHovered = altRoute.id === hoveredRouteId;
          const elBadge = document.createElement("div");
          elBadge.className = `aaroh-alt-badge cursor-pointer px-3 py-1 rounded-full border shadow-xl flex items-center gap-1.5 font-bold text-xs transition-all z-20 transform -translate-x-1/2 -translate-y-1/2 ${
            isHovered
              ? "bg-[#ff1493] text-white border-white scale-110 shadow-pink-glow-strong"
              : "bg-[#150b26]/95 text-fuchsia-200 border-[#a855f7]/60 hover:border-[#ff1493] hover:text-white"
          }`;
          elBadge.innerHTML = `
            <span>Alt ${idx + 1}</span>
            <span class="bg-[#08040d]/80 px-1.5 py-0.5 rounded text-[10px] text-fuchsia-300 font-semibold">${Math.round(
              altRoute.score
            )}</span>
          `;

          elBadge.onclick = (e) => {
            e.stopPropagation();
            onSelectRoute(altRoute.id);
          };

          const marker = new maplibregl.Marker({ element: elBadge, anchor: "center" })
            .setLngLat(midCoord as [number, number])
            .addTo(map);
          newMarkers.push(marker);
        }
      });

    markersRef.current = newMarkers;

    // ── Camera Panning Animation (Anti-Loop Camera Lock via useRef) ──
    // Execute camera animation ONLY ONCE when a new route is selected
    if (selectedRoute.id !== lastAnimatedRouteIdRef.current) {
      lastAnimatedRouteIdRef.current = selectedRoute.id;

      const bounds = new maplibregl.LngLatBounds();
      selectedRoute.geometry.coordinates.forEach((c) => bounds.extend(c as [number, number]));
      const center = bounds.getCenter();

      map.flyTo({
        center: [center.lng, center.lat],
        zoom: 12.8,
        pitch: 35,
        bearing: 10,
        duration: 1800,
        essential: true,
      });

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitBounds(bounds, {
            padding: { top: 70, bottom: 70, left: 80, right: 80 },
            maxZoom: 14.5,
            duration: 1000,
          });
        }
      }, 1200);
    }

    setTimeout(() => map.resize(), 300);
  }, [routes, selectedRouteId, hoveredRouteId, originCoords, destCoords, mapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-[#08040d] flex flex-col">
      <div ref={mapContainer} className="w-full h-full flex-1 min-h-[500px]" />

      {/* Floating Map Legend Indicator */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-[#150b26]/85 backdrop-blur-md border border-[#d946ef]/25 px-3 py-1.5 rounded-xl shadow-fuchsia-glow text-[11px] text-fuchsia-200 pointer-events-none">
        <span className="flex items-center gap-1 font-semibold text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff1493] shadow-[0_0_8px_#ff1493]" />
          🌸 Vibrant Safe (≥75)
        </span>
        <span className="text-fuchsia-400/40">•</span>
        <span className="flex items-center gap-1 font-semibold text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" />
          🥀 Attention Zone (&lt;60)
        </span>
      </div>
    </div>
  );
};

export default AarohMap;
