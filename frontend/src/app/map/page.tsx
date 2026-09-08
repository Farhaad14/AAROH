"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { fetchRouteAnalysis, fetchLocationSuggestions, LocationSuggestion } from "@/lib/api";
import { RouteAnalysisResponse, RouteDetail, SegmentDetail } from "@/types/route";
import { RouteCard } from "@/components/route/RouteCard";
import { ScoreBreakdown } from "@/components/route/ScoreBreakdown";
import { SegmentDetails } from "@/components/route/SegmentDetails";
import { ObservationForm } from "@/components/observations/ObservationForm";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { TimeContextPicker } from "@/components/search/TimeContextPicker";
import {
  Compass,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  SlidersHorizontal,
  ArrowLeft,
} from "lucide-react";

const AarohMap = dynamic(() => import("@/components/map/AarohMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
      Initializing MapLibre GL Engine...
    </div>
  ),
});

/** Returns current local time as "HH:MM" */
function getCurrentLocalTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * Fallback coordinate lookup for Noida demo presets.
 * Only used when no lat/lng query params are provided.
 */
const getCoordsFallback = (loc: string): [number, number] => {
  const l = loc.toLowerCase();
  if (l.includes("18")) return [77.3235, 28.5705];
  if (l.includes("botanical")) return [77.334, 28.5645];
  if (l.includes("electronic")) return [77.3735, 28.6275];
  return [77.3639, 28.628]; // Sector 62 default
};

function MapDashboardContent() {
  const searchParams = useSearchParams();

  // Text labels from URL
  const originParam = searchParams.get("origin") || "Noida Sector 62";
  const destParam = searchParams.get("dest") || "Noida Sector 18";
  const timeParam = searchParams.get("time") || null; // null = use live time

  // Parse coordinate params — passed from homepage when user picked a Nominatim suggestion
  const olatParam = searchParams.get("olat");
  const olngParam = searchParams.get("olng");
  const dlatParam = searchParams.get("dlat");
  const dlngParam = searchParams.get("dlng");

  // ── Location text state ──
  const [originText, setOriginText] = useState(originParam);
  const [destText, setDestText] = useState(destParam);

  // ── Coordinate state ──
  // Seeded from URL params (if user selected a Nominatim suggestion on homepage),
  // or from fallback lookup. Updated live when user selects a suggestion in sidebar.
  const [originCoords, setOriginCoords] = useState<[number, number]>(() => {
    if (olatParam && olngParam) return [parseFloat(olngParam), parseFloat(olatParam)];
    return getCoordsFallback(originParam);
  });
  const [destCoords, setDestCoords] = useState<[number, number]>(() => {
    if (dlatParam && dlngParam) return [parseFloat(dlngParam), parseFloat(dlatParam)];
    return getCoordsFallback(destParam);
  });

  // ── Time state — default to live time unless a time param was explicitly set ──
  const [selectedTime, setSelectedTime] = useState<string>(
    timeParam || getCurrentLocalTime()
  );

  const priorityParam = searchParams.get("priority") !== "false";
  const [prioritySafety] = useState(priorityParam);

  // ── Route analysis state ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RouteAnalysisResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<SegmentDetail | null>(null);
  const [showObsForm, setShowObsForm] = useState(false);

  const loadRoutes = useCallback(
    async (time: string, oc: [number, number], dc: [number, number], oText?: string, dText?: string) => {
      setLoading(true);
      setError(null);
      try {
        let activeOc = oc;
        let activeDc = dc;
        const oAddress = oText !== undefined ? oText : originText;
        const dAddress = dText !== undefined ? dText : destText;

        // Perform live geocoding if lat/lng are not explicitly passed via URL params or if user typed custom text
        if ((!olatParam || !olngParam || oText) && oAddress && oAddress.trim().length > 1) {
          const suggestions = await fetchLocationSuggestions(oAddress);
          if (suggestions && suggestions.length > 0) {
            activeOc = [suggestions[0].lng, suggestions[0].lat];
            setOriginCoords(activeOc);
          }
        }

        if ((!dlatParam || !dlngParam || dText) && dAddress && dAddress.trim().length > 1) {
          const suggestions = await fetchLocationSuggestions(dAddress);
          if (suggestions && suggestions.length > 0) {
            activeDc = [suggestions[0].lng, suggestions[0].lat];
            setDestCoords(activeDc);
          }
        }

        const todayISO = new Date().toISOString().split("T")[0];
        const isoDateTime = `${todayISO}T${time}:00`;

        const result = await fetchRouteAnalysis({
          origin_lat: activeOc[1],
          origin_lng: activeOc[0],
          destination_lat: activeDc[1],
          destination_lng: activeDc[0],
          origin_address: oAddress,
          destination_address: dAddress,
          travel_datetime: isoDateTime,
          priority_safety: prioritySafety,
        });

        setData(result);
        setSelectedRouteId(result.recommended_route_id);
      } catch (err: any) {
        setError(err.message || "Failed to analyze routes.");
      } finally {
        setLoading(false);
      }
    },
    [prioritySafety, originText, destText, olatParam, olngParam, dlatParam, dlngParam]
  );

  // Initial load on mount
  useEffect(() => {
    loadRoutes(selectedTime, originCoords, destCoords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called when user changes time in header TimeContextPicker
  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    loadRoutes(newTime, originCoords, destCoords);
  };

  // Called when user clicks "Update Route Analysis" in sidebar
  const handleReanalyze = () => {
    loadRoutes(selectedTime, originCoords, destCoords, originText, destText);
  };

  // Handle origin suggestion selected in sidebar
  const handleOriginSuggestion = (s: LocationSuggestion) => {
    setOriginText(s.display_name);
    setOriginCoords([s.lng, s.lat]);
  };

  // Handle destination suggestion selected in sidebar
  const handleDestSuggestion = (s: LocationSuggestion) => {
    setDestText(s.display_name);
    setDestCoords([s.lng, s.lat]);
  };

  const selectedRoute = data?.routes.find((r) => r.id === selectedRouteId) || data?.routes[0];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* ── Top Bar ── */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Back + Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-sm">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-100 text-base hidden sm:inline tracking-tight">AAROH Map</span>
          </div>
        </div>

        {/* Right: Time Context Picker (compact) + Recalculate */}
        <div className="flex items-center gap-2">
          <TimeContextPicker
            value={selectedTime}
            onChange={handleTimeChange}
            compact={true}
          />

          <button
            onClick={handleReanalyze}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Recalculate</span>
          </button>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* ── Left Sidebar ── */}
        <div className="w-full md:w-[420px] lg:w-[460px] border-r border-slate-800 bg-slate-950/95 flex flex-col h-full shrink-0 z-20 shadow-2xl">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="font-semibold text-slate-300 text-sm">Evaluating Route Context Layers...</p>
              <p className="text-xs text-slate-500 max-w-xs">Analyzing 9 environmental factors across geographic segments</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3 text-rose-400">
              <AlertTriangle className="w-8 h-8 mx-auto" />
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={handleReanalyze}
                className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-lg"
              >
                Retry Route Analysis
              </button>
            </div>
          ) : data ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">

              {/* ── Location Search + Time ── */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3 shadow-md">
                <LocationAutocomplete
                  label="Start Location"
                  placeholder="Search start location in India..."
                  value={originText}
                  onChange={(v) => {
                    setOriginText(v);
                    // Don't clear coords on typing — only clear when user picks a new suggestion
                  }}
                  onSelectSuggestion={handleOriginSuggestion}
                  iconColor="text-emerald-400"
                />

                <LocationAutocomplete
                  label="Destination"
                  placeholder="Search destination in India..."
                  value={destText}
                  onChange={(v) => setDestText(v)}
                  onSelectSuggestion={handleDestSuggestion}
                  iconColor="text-rose-400"
                />

                {/* Sidebar time context picker */}
                <TimeContextPicker
                  value={selectedTime}
                  onChange={(t) => setSelectedTime(t)}
                />

                <button
                  onClick={handleReanalyze}
                  disabled={loading}
                  className="w-full py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-lg transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Update Live Route Analysis
                </button>
              </div>

              {/* ── AI / Context Engine Explanation Card ── */}
              {(() => {
                const exp: any = data.explanation;
                const isObj = typeof exp === "object" && exp !== null;
                const isAi = (isObj && exp.status === "ai_generated") || data.explanation_source === "ai_generated";
                const headline = isObj ? (exp.headline || exp.summary) : exp;
                const summary = isObj && exp.headline ? exp.summary : null;
                const why: string[] = isObj && Array.isArray(exp.why_recommended) ? exp.why_recommended : [];
                const tradeoffs: string[] = isObj && Array.isArray(exp.tradeoffs) ? exp.tradeoffs : [];
                const attention: string[] = isObj && Array.isArray(exp.attention_summary) ? exp.attention_summary : [];

                return (
                  <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900 p-4 rounded-xl border border-sky-800/40 shadow-lg space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>Route Context Engine</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${
                        isAi
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                      }`}>
                        {isAi ? "Gemini Grounded" : "Deterministic Engine"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-100 leading-snug">{headline}</p>
                      {summary && (
                        <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
                      )}
                    </div>

                    {why.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Key Context Factors:</span>
                        <ul className="space-y-1">
                          {why.map((pt, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold mt-0.5">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tradeoffs.length > 0 && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Trade-offs:</span>
                        <ul className="space-y-1">
                          {tradeoffs.map((to, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                              <span className="text-sky-400 font-bold mt-0.5">→</span>
                              <span>{to}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {attention.length > 0 && attention[0] !== "No major attention zones detected along this route." && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Attention Notice:</span>
                        <ul className="space-y-1">
                          {attention.map((att, i) => (
                            <li key={i} className="text-xs text-amber-300/90 flex items-start gap-1.5">
                              <span className="text-amber-400 font-bold mt-0.5">⚠</span>
                              <span>{att}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Route Alternatives ── */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-200 text-sm flex items-center justify-between">
                  <span>Route Alternatives ({data.routes.length})</span>
                  <span className="text-xs text-slate-400 font-normal">Sorted by Context</span>
                </h3>

                {data.routes.map((r) => (
                  <RouteCard
                    key={r.id}
                    route={r}
                    isSelected={r.id === selectedRouteId}
                    isRecommended={r.id === data.recommended_route_id}
                    onSelect={() => setSelectedRouteId(r.id)}
                    onMouseEnter={() => setHoveredRouteId(r.id)}
                    onMouseLeave={() => setHoveredRouteId(null)}
                  />
                ))}
              </div>

              {/* ── Score Breakdown + Attention Zones ── */}
              {selectedRoute && (
                <div className="space-y-4">
                  <ScoreBreakdown features={selectedRoute.features} />

                  {selectedRoute.attention_zones.length > 0 && (
                    <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 space-y-2">
                      <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Attention Zones ({selectedRoute.attention_zones.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedRoute.attention_zones.map((az, idx) => (
                          <div key={idx} className="bg-slate-900/80 p-2.5 rounded-lg text-xs space-y-1">
                            <div className="flex justify-between font-semibold text-slate-200">
                              <span>Segments #{az.segment_start_index}–#{az.segment_end_index}</span>
                              <span className="text-amber-400">Score {az.score}/100</span>
                            </div>
                            <p className="text-slate-400 text-[11px]">{az.primary_reasons.join(", ")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observation form toggle */}
                  <button
                    onClick={() => setShowObsForm(!showObsForm)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 font-medium text-xs rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {showObsForm ? "Hide Observation Form" : "Submit Field Observation"}
                  </button>

                  {showObsForm && (
                    <ObservationForm
                      onSuccess={() => {
                        setTimeout(handleReanalyze, 500);
                      }}
                    />
                  )}
                </div>
              )}

              {/* ── Hackathon Presentation Disclaimer ── */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60 text-[11px] text-slate-500 leading-relaxed space-y-1">
                <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">AAROH Prototype Notice</span>
                <p>
                  Scores evaluate environmental context (lighting, open establishments, emergency proximity) from OpenStreetMap. Prototype assessment — does not predict crime or guarantee personal safety.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── Right Map ── */}
        <div className="flex-1 h-full relative">
          <AarohMap
            routes={data?.routes || []}
            selectedRouteId={selectedRouteId}
            hoveredRouteId={hoveredRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            onSelectSegment={(seg) => setActiveSegment(seg)}
            originCoords={originCoords}
            destCoords={destCoords}
          />
        </div>
      </div>

      {/* ── Segment Detail Modal ── */}
      <SegmentDetails segment={activeSegment} onClose={() => setActiveSegment(null)} />
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Loading AAROH Map Dashboard...
        </div>
      }
    >
      <MapDashboardContent />
    </Suspense>
  );
}
