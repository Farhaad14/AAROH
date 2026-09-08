"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Compass,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  SlidersHorizontal,
  ArrowLeft,
  Shield,
  Layers,
  Sliders,
  Clock,
  MapPin,
  ArrowUpDown,
  X,
  Navigation,
} from "lucide-react";
import { LandingCanvas } from "@/components/layout/LandingCanvas";
import { LotusLoader } from "@/components/ui/LotusLoader";
import { CompanionAvatar } from "@/components/ui/CompanionAvatar";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { RouteCard } from "@/components/route/RouteCard";
import { ScoreBreakdown } from "@/components/route/ScoreBreakdown";
import { SegmentDetails } from "@/components/route/SegmentDetails";
import { ObservationForm } from "@/components/observations/ObservationForm";
import { WeightSettingsModal } from "@/components/ui/WeightSettingsModal";
import {
  fetchRouteAnalysis,
  fetchLocationSuggestions,
  LocationSuggestion,
} from "@/lib/api";
import { RouteAnalysisResponse, SegmentDetail } from "@/types/route";
import { sweetCoatAIFeedback } from "@/lib/sweetCoat";

const AarohMap = dynamic(() => import("@/components/map/AarohMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#08040d] text-fuchsia-300/60 text-sm gap-2">
      <div className="w-6 h-6 border-2 border-[#ff1493] border-t-transparent rounded-full animate-spin" />
      <span>Initializing Dark-Themed MapLibre Engine...</span>
    </div>
  ),
});

/** Returns current local time as "HH:MM" */
function getCurrentLocalTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

const getCoordsFallback = (loc: string): [number, number] => {
  const l = loc.toLowerCase();
  if (l.includes("shaheed") || l.includes("sthal")) return [77.4155, 28.6706];
  if (l.includes("pratap")) return [77.4097, 28.6445];
  if (l.includes("18")) return [77.3235, 28.5705];
  if (l.includes("botanical")) return [77.334, 28.5645];
  if (l.includes("electronic")) return [77.3735, 28.6275];
  return [77.4155, 28.6706];
};

function MapDashboardContent() {
  const searchParams = useSearchParams();

  const originParam = searchParams.get("origin") || "Shaheed Sthal Metro Station, Ghaziabad";
  const destParam = searchParams.get("dest") || "Pratap Vihar, Ghaziabad";
  const timeParam = searchParams.get("time") || null;

  const olatParam = searchParams.get("olat");
  const olngParam = searchParams.get("olng");
  const dlatParam = searchParams.get("dlat");
  const dlngParam = searchParams.get("dlng");

  const [originText, setOriginText] = useState(originParam);
  const [destText, setDestText] = useState(destParam);

  const [originCoords, setOriginCoords] = useState<[number, number]>(() => {
    if (olatParam && olngParam) return [parseFloat(olngParam), parseFloat(olatParam)];
    return getCoordsFallback(originParam);
  });
  const [destCoords, setDestCoords] = useState<[number, number]>(() => {
    if (dlatParam && dlngParam) return [parseFloat(dlngParam), parseFloat(dlatParam)];
    return getCoordsFallback(destParam);
  });

  const [selectedTime, setSelectedTime] = useState<string>(
    timeParam || getCurrentLocalTime()
  );

  const priorityParam = searchParams.get("priority") !== "false";
  const [prioritySafety, setPrioritySafety] = useState(priorityParam);

  // Modal states
  const [showRouteEditModal, setShowRouteEditModal] = useState(false);
  const [showWeightsModal, setShowWeightsModal] = useState(false);

  // Pending edits inside modal
  const [pendingOrigin, setPendingOrigin] = useState(originText);
  const [pendingDest, setPendingDest] = useState(destText);
  const [pendingTime, setPendingTime] = useState(selectedTime);
  const [pendingOriginCoords, setPendingOriginCoords] = useState<[number, number]>(originCoords);
  const [pendingDestCoords, setPendingDestCoords] = useState<[number, number]>(destCoords);
  const [pendingSafety, setPendingSafety] = useState(prioritySafety);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RouteAnalysisResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<SegmentDetail | null>(null);
  const [showObsForm, setShowObsForm] = useState(false);
  const [currentDateTimeStr, setCurrentDateTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      setCurrentDateTimeStr(now.toLocaleDateString("en-US", options));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadRoutes = useCallback(
    async (
      time: string,
      oc: [number, number],
      dc: [number, number],
      oText?: string,
      dText?: string,
      safetyPref?: boolean
    ) => {
      setLoading(true);
      setError(null);
      try {
        let activeOc = oc;
        let activeDc = dc;
        const oAddress = oText !== undefined ? oText : originText;
        const dAddress = dText !== undefined ? dText : destText;
        const activeSafety = safetyPref !== undefined ? safetyPref : prioritySafety;

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
          priority_safety: activeSafety,
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

  useEffect(() => {
    loadRoutes(selectedTime, originCoords, destCoords);
  }, []);

  // Listen for weight updates from custom event
  useEffect(() => {
    const handleWeightsUpdated = () => {
      loadRoutes(selectedTime, originCoords, destCoords, originText, destText, prioritySafety);
    };
    window.addEventListener("aaroh-weights-updated", handleWeightsUpdated);
    return () => window.removeEventListener("aaroh-weights-updated", handleWeightsUpdated);
  }, [selectedTime, originCoords, destCoords, originText, destText, prioritySafety, loadRoutes]);

  const handleReanalyze = () => {
    loadRoutes(selectedTime, originCoords, destCoords, originText, destText, prioritySafety);
  };

  const handleOpenRouteEdit = () => {
    setPendingOrigin(originText);
    setPendingDest(destText);
    setPendingTime(selectedTime);
    setPendingOriginCoords(originCoords);
    setPendingDestCoords(destCoords);
    setPendingSafety(prioritySafety);
    setShowRouteEditModal(true);
  };

  const handleApplyRouteEdit = () => {
    setOriginText(pendingOrigin);
    setDestText(pendingDest);
    setSelectedTime(pendingTime);
    setOriginCoords(pendingOriginCoords);
    setDestCoords(pendingDestCoords);
    setPrioritySafety(pendingSafety);
    setShowRouteEditModal(false);

    loadRoutes(
      pendingTime,
      pendingOriginCoords,
      pendingDestCoords,
      pendingOrigin,
      pendingDest,
      pendingSafety
    );
  };

  const handleSwapLocations = () => {
    setPendingOrigin(pendingDest);
    setPendingDest(pendingOrigin);
    setPendingOriginCoords(pendingDestCoords);
    setPendingDestCoords(pendingOriginCoords);
  };

  const selectedRoute = data?.routes.find((r) => r.id === selectedRouteId) || data?.routes[0];

  return (
    <LandingCanvas
      className="h-screen overflow-hidden flex flex-col bg-[#0b0713]"
      showBackgroundImage={false}
    >
      <LotusLoader isLoading={loading} statusMessage="Evaluating Journey Context Layers..." />

      {/* ── Top Header Nav Bar ── */}
      <header className="h-14 border-b border-fuchsia-500/20 bg-purple-950/40 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-30">
        {/* Top-Left: Logo & Journey Modification Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-xl bg-purple-950/60 border border-fuchsia-500/30 text-fuchsia-300 hover:text-white hover:border-[#ff1493] transition flex items-center gap-1.5 text-xs font-semibold"
            title="Return to Landing"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Landing</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff1493] via-[#d946ef] to-[#a855f7] flex items-center justify-center shadow-fuchsia-glow">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-base tracking-tight text-white flex items-center gap-1">
                AAROH <span className="text-[10px] text-[#ff1493]">🌸</span>
              </span>
              <span className="text-[8px] text-fuchsia-300 font-bold block -mt-1 tracking-widest uppercase">
                Interactive Journey Map
              </span>
            </div>
          </Link>

          {/* 📍 Top-Left Option to Change Destination & Time */}
          <button
            onClick={handleOpenRouteEdit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-fuchsia-500/30 hover:border-[#ff1493] text-fuchsia-200 hover:text-white transition shadow-sm cursor-pointer ml-1"
            title="Change Destination, Origin & Time"
          >
            <Navigation className="w-3.5 h-3.5 text-[#ff1493]" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-left max-w-[130px] sm:max-w-[220px] truncate">
              <span className="text-white truncate">{originText}</span>
              <span className="text-fuchsia-400">→</span>
              <span className="text-white truncate">{destText}</span>
            </div>
            <div className="flex items-center gap-1 pl-1.5 border-l border-fuchsia-500/30 text-[11px] font-semibold text-fuchsia-300">
              <Clock className="w-3 h-3 text-[#d946ef]" />
              <span>{selectedTime}</span>
            </div>
          </button>
        </div>

        {/* Top-Right: Actions (Weights Button, Recalculate) */}
        <div className="flex items-center gap-2">
          {/* Weightage Settings Button with Logic */}
          <button
            onClick={() => setShowWeightsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-fuchsia-500/30 text-fuchsia-200 hover:text-white hover:border-[#ff1493] hover:bg-purple-900/50 transition text-xs font-semibold shadow-sm cursor-pointer"
            title="Configure Context Layer Scoring Weights"
          >
            <Sliders className="w-3.5 h-3.5 text-[#ff1493]" />
            <span className="hidden sm:inline">Weights</span>
          </button>

          <button
            onClick={handleReanalyze}
            disabled={loading}
            className="px-3 py-1.5 bg-gradient-to-r from-[#ff1493] to-[#d946ef] hover:from-[#ff1493]/90 hover:to-[#d946ef]/90 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold disabled:opacity-50 cursor-pointer shadow-fuchsia-glow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Recalculate</span>
          </button>

          <Link
            href="/settings"
            className="p-1.5 rounded-xl bg-purple-950/60 border border-fuchsia-500/30 text-fuchsia-300 hover:text-white hover:border-[#ff1493] transition"
            title="Full Settings Page"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* ── Viewport Structure: Responsive Vertical Split (40% Left Panel | 60% Right Map Shell) ── */}
      <div className="flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden relative bg-[#0b0713]">
        {/* ── LEFT PANEL: Stats & AI Feedback - 40% Desktop, Full Height, Native Smooth Scroll ── */}
        <div className="w-full md:w-[40%] h-[45vh] md:h-full flex flex-col p-4 sm:p-6 overflow-y-auto pointer-events-auto select-text scrollbar-thin scrollbar-thumb-fuchsia-500/20 scrollbar-track-transparent gap-4 border-r border-fuchsia-500/20 bg-[#0b0713]/90 z-20">
          {/* Quick Route Ribbon inside Left Panel */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-purple-950/25 border border-fuchsia-500/25 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#ff1493] via-[#d946ef] to-[#a855f7] flex items-center justify-center shadow-fuchsia-glow shrink-0">
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {originText} → {destText}
                </span>
                <span className="text-[10px] text-fuchsia-300/80">
                  {selectedTime} • {prioritySafety ? "Safety First" : "Fastest"}
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenRouteEdit}
              className="px-2.5 py-1 bg-purple-950/60 hover:bg-[#a855f7]/25 border border-fuchsia-500/30 text-fuchsia-200 hover:text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Modify
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-purple-950/20 rounded-2xl border border-fuchsia-500/20">
              <RefreshCw className="w-8 h-8 text-[#ff1493] animate-spin" />
              <p className="font-bold text-white text-sm">Evaluating Route Context Layers...</p>
              <p className="text-xs text-fuchsia-300/70 max-w-xs">
                Synthesizing lighting, open establishments, surveillance, and transit
              </p>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-3 text-rose-300 bg-purple-950/20 rounded-2xl border border-rose-500/30">
              <AlertTriangle className="w-8 h-8 mx-auto text-rose-400" />
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={handleReanalyze}
                className="px-4 py-2 bg-[#ff1493] text-white text-xs font-bold rounded-xl shadow-fuchsia-glow"
              >
                Retry Route Analysis
              </button>
            </div>
          ) : data ? (
            <>
              {/* Context Explanation Card */}
              {(() => {
                const exp: any = data.explanation;
                const isObj = typeof exp === "object" && exp !== null;
                const isAi =
                  (isObj && exp.status === "ai_generated") ||
                  data.explanation_source === "ai_generated";
                const headline = isObj ? exp.headline || exp.summary : exp;
                const summary: string | undefined = isObj && exp.headline && exp.summary !== exp.headline ? exp.summary : undefined;
                const why: string[] = isObj && Array.isArray(exp.why_recommended) ? exp.why_recommended : [];
                const tradeoffs: string[] = isObj && Array.isArray(exp.tradeoffs) ? exp.tradeoffs : [];
                const rawAttention: string[] = isObj && Array.isArray(exp.attention_summary) ? exp.attention_summary : [];
                const attention = rawAttention.filter((a) => a && !a.includes("No major attention zones detected"));

                const prominentAttention = attention.slice(0, 2);
                const extraAttentionCount = Math.max(0, attention.length - prominentAttention.length);

                return (
                  <div className="bg-purple-950/25 p-4 rounded-2xl border border-fuchsia-500/25 backdrop-blur-md shadow-fuchsia-glow space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-[#ff1493] shrink-0" />
                        <span>Aarohi Context Safety Advisor</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-[#ff1493]/15 text-pink-300 border-[#ff1493]/40 shadow-sm">
                        {isAi ? "Gemini Empathetic AI" : "Deterministic Engine"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white leading-snug">
                        {sweetCoatAIFeedback(headline)}
                      </p>
                      {summary && (
                        <p className="text-xs text-fuchsia-200/80 leading-relaxed">
                          {sweetCoatAIFeedback(summary)}
                        </p>
                      )}
                    </div>

                    {why.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-fuchsia-500/20">
                        <span className="text-[10px] font-bold text-pink-300 uppercase tracking-wider">
                          Comfort Factors:
                        </span>
                        <ul className="space-y-1.5">
                          {why.map((pt, i) => (
                            <li key={i} className="text-xs text-fuchsia-100/90 flex items-start gap-1.5 bg-purple-950/40 p-2 rounded-xl border border-fuchsia-500/15">
                              <span className="text-[#ff1493] font-bold mt-0.5">🌸</span>
                              <span>{sweetCoatAIFeedback(pt)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tradeoffs.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-fuchsia-500/20">
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                          Balanced Notes:
                        </span>
                        <ul className="space-y-1">
                          {tradeoffs.map((to, i) => (
                            <li key={i} className="text-xs text-fuchsia-200/80 flex items-start gap-1.5">
                              <span className="text-[#a855f7] font-bold mt-0.5">→</span>
                              <span>{sweetCoatAIFeedback(to)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {prominentAttention.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-fuchsia-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                            Mindful Stretches:
                          </span>
                          {extraAttentionCount > 0 && (
                            <span className="text-[10px] text-fuchsia-300/60">+{extraAttentionCount} more</span>
                          )}
                        </div>
                        <ul className="space-y-1">
                          {prominentAttention.map((att, i) => (
                            <li key={i} className="text-xs text-amber-200/90 flex items-start gap-1.5">
                              <span className="text-amber-400 font-bold mt-0.5">✨</span>
                              <span>{sweetCoatAIFeedback(att)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Route Alternatives Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>Route Alternatives ({data.routes.length})</span>
                  </h3>
                  <span className="text-xs text-fuchsia-300/70 font-medium">Sorted by Comfort</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {data.routes.map((r) => {
                    const recRoute = data.routes.find((x) => x.id === data.recommended_route_id) || data.routes[0];
                    return (
                      <RouteCard
                        key={r.id}
                        route={r}
                        isSelected={r.id === selectedRouteId}
                        isRecommended={r.id === data.recommended_route_id}
                        recommendedRoute={recRoute}
                        onSelect={() => setSelectedRouteId(r.id)}
                        onMouseEnter={() => setHoveredRouteId(r.id)}
                        onMouseLeave={() => setHoveredRouteId(null)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Selected Route Score Breakdown & Attention */}
              {selectedRoute && (
                <div className="space-y-4">
                  <ScoreBreakdown features={selectedRoute.features} />

                  {selectedRoute.attention_zones.length > 0 && (
                    <div className="bg-purple-950/25 border border-amber-500/40 rounded-2xl p-4 space-y-2 shadow-sm backdrop-blur-md">
                      <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Mindful Attention Zones ({selectedRoute.attention_zones.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {selectedRoute.attention_zones.map((az, idx) => (
                          <div key={idx} className="bg-[#08040d]/60 p-2.5 rounded-xl text-xs space-y-1 border border-fuchsia-500/15">
                            <div className="flex justify-between font-bold text-fuchsia-100">
                              <span>Segments #{az.segment_start_index}–#{az.segment_end_index}</span>
                              <span className="text-amber-400">Score {az.score}/100</span>
                            </div>
                            <p className="text-fuchsia-300/80 text-[11px]">
                              {sweetCoatAIFeedback(az.primary_reasons.join(", "))}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 pb-4">
                    <button
                      onClick={() => setShowObsForm(!showObsForm)}
                      className="w-full py-2.5 bg-purple-950/30 hover:bg-purple-900/40 border border-fuchsia-500/30 text-fuchsia-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-[#ff1493]" />
                      {showObsForm ? "Hide Observation Form" : "Contribute Ground-Truth Observation"}
                    </button>

                    {showObsForm && (
                      <div className="mt-3">
                        <ObservationForm
                          onSuccess={() => {
                            handleReanalyze();
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* ── RIGHT PANEL: Map Section - 60% Desktop, Full Height, Static Lock ── */}
        <div className="w-full md:w-[60%] h-[55vh] md:h-full p-3 sm:p-4 md:p-6 flex flex-col shrink-0">
          {/* OUTER FRAME: Frosted-Glass Shell with p-3 border channel and nested 28px rounding */}
          <div className="relative w-full h-full p-3 rounded-[28px] border border-fuchsia-500/30 bg-purple-950/15 backdrop-blur-md shadow-[0_0_30px_rgba(217,70,239,0.15)] flex items-center justify-center overflow-hidden">
            {/* Live Digital Date & Time Card (Top-Right of Map Shell) */}
            <div className="absolute top-6 right-6 z-10 bg-purple-950/80 backdrop-blur-md border border-fuchsia-500/30 rounded-xl px-3 py-1.5 text-xs text-fuchsia-200 font-mono font-semibold shadow-lg pointer-events-none flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ff1493] animate-ping shrink-0" />
              <span>{currentDateTimeStr || "Live Context Active"}</span>
            </div>

            {/* Top-Left Action on Map Shell: Quick Modify Route & Time */}
            <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
              <button
                onClick={handleOpenRouteEdit}
                className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900/90 backdrop-blur-md border border-fuchsia-500/30 hover:border-[#ff1493] text-fuchsia-200 hover:text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                title="Change Origin, Destination & Time"
              >
                <MapPin className="w-3.5 h-3.5 text-[#ff1493]" />
                <span>Change Route / Time</span>
              </button>
            </div>

            {/* INNER MAP CANVAS: Nested 18px rounded container prevents border clipping */}
            <div className="w-full h-full rounded-[18px] overflow-hidden bg-slate-950 relative">
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
        </div>
      </div>

      {/* ── [MODAL 1]: Change Destination, Origin & Time (Top-Left Option) ── */}
      {showRouteEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowRouteEditModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#140822] border border-fuchsia-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(217,70,239,0.35)] text-[#f5edfc] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-fuchsia-500/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff1493] to-[#a855f7] flex items-center justify-center shadow-fuchsia-glow">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Modify Journey &amp; Time</h3>
                  <p className="text-[11px] text-fuchsia-300/70">
                    Update origin, destination, or departure context
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRouteEditModal(false)}
                className="p-1.5 rounded-xl text-fuchsia-300 hover:text-white hover:bg-fuchsia-500/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3.5">
              {/* Origin */}
              <LocationAutocomplete
                label="Origin Location"
                placeholder="Search origin in India..."
                value={pendingOrigin}
                onChange={(v) => {
                  setPendingOrigin(v);
                }}
                onSelectSuggestion={(s) => {
                  setPendingOrigin(s.display_name);
                  setPendingOriginCoords([s.lng, s.lat]);
                }}
                iconColor="text-[#ff1493]"
              />

              {/* Swap Button */}
              <div className="flex justify-center -my-1">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="p-2 rounded-full bg-purple-950/80 border border-fuchsia-500/30 hover:border-[#ff1493] text-fuchsia-300 hover:text-white transition shadow-sm hover:scale-105 cursor-pointer"
                  title="Swap Origin & Destination"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Destination */}
              <LocationAutocomplete
                label="Destination Location"
                placeholder="Search destination in India..."
                value={pendingDest}
                onChange={(v) => {
                  setPendingDest(v);
                }}
                onSelectSuggestion={(s) => {
                  setPendingDest(s.display_name);
                  setPendingDestCoords([s.lng, s.lat]);
                }}
                iconColor="text-[#d946ef]"
              />

              {/* Travel Time & Safety Symmetrical Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Time Picker */}
                <div className="bg-purple-950/30 border border-fuchsia-500/25 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-fuchsia-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#d946ef]" />
                      Travel Time
                    </label>
                    <button
                      type="button"
                      onClick={() => setPendingTime(getCurrentLocalTime())}
                      className="text-[10px] font-bold text-fuchsia-300 hover:text-white px-2 py-0.5 rounded-full border border-fuchsia-500/30 hover:border-[#ff1493] transition cursor-pointer"
                    >
                      Live
                    </button>
                  </div>
                  <input
                    type="time"
                    value={pendingTime}
                    onChange={(e) => setPendingTime(e.target.value)}
                    className="w-full bg-[#150b26]/90 border border-fuchsia-500/30 rounded-xl px-3 py-1.5 text-fuchsia-50 font-bold text-sm focus:ring-2 focus:ring-[#ff1493]/40 focus:border-[#ff1493] outline-none cursor-pointer"
                  />
                </div>

                {/* Safety Preference */}
                <div className="bg-purple-950/30 border border-fuchsia-500/25 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-fuchsia-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#ff1493]" />
                      Priority
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      pendingSafety
                        ? "bg-[#ff1493]/20 text-pink-300 border-[#ff1493]/40"
                        : "bg-slate-800/40 text-slate-400 border-slate-700/40"
                    }`}>
                      {pendingSafety ? "Safety First" : "Balanced"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingSafety(!pendingSafety)}
                    className="w-full py-1.5 rounded-xl bg-purple-950/60 border border-fuchsia-500/30 hover:border-[#ff1493] text-xs font-semibold text-fuchsia-200 transition text-center cursor-pointer"
                  >
                    Toggle: {pendingSafety ? "Prioritizing Lighting & Activity" : "Balanced ETA & Context"}
                  </button>
                </div>
              </div>

              {/* Quick Route Preset Chips */}
              <div className="pt-1 space-y-1.5">
                <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider block">
                  Quick Route Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingOrigin("Shaheed Sthal Metro Station, Ghaziabad");
                      setPendingDest("Pratap Vihar, Ghaziabad");
                      setPendingOriginCoords([77.4155, 28.6706]);
                      setPendingDestCoords([77.4097, 28.6445]);
                    }}
                    className="text-xs bg-purple-950/60 hover:bg-[#ff1493]/20 text-fuchsia-100 border border-fuchsia-500/30 hover:border-[#ff1493] rounded-xl px-2.5 py-1 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>🏠</span>
                    <span>Home</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingOrigin("Sector 62, Noida");
                      setPendingDest("Sector 18, Noida");
                      setPendingOriginCoords([77.3639, 28.628]);
                      setPendingDestCoords([77.3235, 28.5705]);
                    }}
                    className="text-xs bg-purple-950/60 hover:bg-[#d946ef]/20 text-fuchsia-100 border border-fuchsia-500/30 hover:border-[#d946ef] rounded-xl px-2.5 py-1 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>🏢</span>
                    <span>Work</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingOrigin("Botanical Garden Metro");
                      setPendingDest("Noida Electronic City");
                      setPendingOriginCoords([77.334, 28.5645]);
                      setPendingDestCoords([77.3735, 28.6275]);
                    }}
                    className="text-xs bg-purple-950/60 hover:bg-[#a855f7]/20 text-fuchsia-100 border border-fuchsia-500/30 hover:border-[#a855f7] rounded-xl px-2.5 py-1 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>🚇</span>
                    <span>Transit</span>
                  </button>
                </div>
              </div>

              {/* Quick Time Preset Chips */}
              <div className="pt-1">
                <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider block mb-1.5">
                  Quick Time Presets:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {["07:00", "12:00", "18:00", "22:00"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPendingTime(t)}
                      className={`py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        pendingTime === t
                          ? "bg-[#ff1493]/20 text-pink-300 border-[#ff1493]/50"
                          : "bg-purple-950/40 text-fuchsia-300 border-fuchsia-500/20 hover:border-[#ff1493]/50 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2 border-t border-fuchsia-500/20">
              <button
                type="button"
                onClick={() => setShowRouteEditModal(false)}
                className="px-4 py-2.5 rounded-xl border border-fuchsia-500/30 text-fuchsia-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyRouteEdit}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff1493] via-[#d946ef] to-[#a855f7] text-white text-xs font-bold shadow-fuchsia-glow hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Apply &amp; Recalculate Routes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── [MODAL 2]: Weight Settings Modal with Logic ── */}
      <WeightSettingsModal
        isOpen={showWeightsModal}
        onClose={() => setShowWeightsModal(false)}
        onApply={() => {
          handleReanalyze();
        }}
      />

      {/* ── Companion Avatar Widget ── */}
      <CompanionAvatar
        score={selectedRoute?.score ?? 80}
        statusText={
          selectedRoute?.attention_zones?.length
            ? `Noticed ${selectedRoute.attention_zones.length} quiet stretch(es) along this route. Stay mindful and stick to the lit roads!`
            : "This corridor is glowing with open shops and transit activity! Enjoy your journey! 🌸"
        }
        isEvaluating={loading}
      />

      <SegmentDetails segment={activeSegment} onClose={() => setActiveSegment(null)} />
    </LandingCanvas>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-[#08040d] text-fuchsia-300 text-sm">
          Awakening AAROH Map Experience...
        </div>
      }
    >
      <MapDashboardContent />
    </Suspense>
  );
}
