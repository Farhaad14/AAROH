"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Compass,
  Users,
  Video,
  Lightbulb,
  Bus,
  ArrowRight,
  MapPin,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  SlidersHorizontal,
  Shield,
  Layers,
  Clock,
} from "lucide-react";
import { LandingCanvas } from "@/components/layout/LandingCanvas";
import { LotusLoader } from "@/components/ui/LotusLoader";
import { CompanionAvatar } from "@/components/ui/CompanionAvatar";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { TimeContextPicker } from "@/components/search/TimeContextPicker";
import { RouteCard } from "@/components/route/RouteCard";
import { ScoreBreakdown } from "@/components/route/ScoreBreakdown";
import { SegmentDetails } from "@/components/route/SegmentDetails";
import { ObservationForm } from "@/components/observations/ObservationForm";
import {
  fetchRouteAnalysis,
  fetchLocationSuggestions,
  LocationSuggestion,
} from "@/lib/api";
import { RouteAnalysisResponse, SegmentDetail } from "@/types/route";
import { sweetCoatAIFeedback } from "@/lib/sweetCoat";

// Dynamically import MapLibre map to avoid SSR issues
const AarohMap = dynamic(() => import("@/components/map/AarohMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#08040d] text-fuchsia-300/60 text-sm gap-2">
      <div className="w-6 h-6 border-2 border-[#ff1493] border-t-transparent rounded-full animate-spin" />
      <span>Initializing Dark-Themed MapLibre Engine...</span>
    </div>
  ),
});

/** Returns the current local time as "HH:MM" */
function getCurrentLocalTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

export default function AarohLandingDashboard() {
  // ── Pre-Search & Input States ──
  const [origin, setOrigin] = useState("Noida Sector 62");
  const [destination, setDestination] = useState("Noida Sector 18");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 28.628,
    lng: 77.3639,
  });
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 28.5705,
    lng: 77.3235,
  });
  const [travelTime, setTravelTime] = useState<string>(getCurrentLocalTime());
  const [prioritySafety, setPrioritySafety] = useState(true);

  // ── After-Search Interactive Journey Map States ──
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Awakening context layers...");
  const [routeData, setRouteData] = useState<RouteAnalysisResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<SegmentDetail | null>(null);
  const [showObsForm, setShowObsForm] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentDateTimeStr, setCurrentDateTimeStr] = useState<string>("");

  // Keep live digital date & time updated
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

  // Main Route Analysis Execution
  const executeRouteAnalysis = useCallback(
    async (
      oText: string,
      dText: string,
      oc: { lat: number; lng: number } | null,
      dc: { lat: number; lng: number } | null,
      timeVal: string
    ) => {
      setIsLoading(true);
      setSearchError(null);
      setLoadingMsg("Evaluating environmental context factors...");

      try {
        let activeOc = oc ? [oc.lng, oc.lat] : [77.3639, 28.628];
        let activeDc = dc ? [dc.lng, dc.lat] : [77.3235, 28.5705];

        // Resolve geocoding if coords missing
        if (!oc && oText.trim().length > 1) {
          const suggestions = await fetchLocationSuggestions(oText);
          if (suggestions && suggestions.length > 0) {
            activeOc = [suggestions[0].lng, suggestions[0].lat];
            setOriginCoords({ lat: suggestions[0].lat, lng: suggestions[0].lng });
          }
        }

        if (!dc && dText.trim().length > 1) {
          const suggestions = await fetchLocationSuggestions(dText);
          if (suggestions && suggestions.length > 0) {
            activeDc = [suggestions[0].lng, suggestions[0].lat];
            setDestCoords({ lat: suggestions[0].lat, lng: suggestions[0].lng });
          }
        }

        const todayISO = new Date().toISOString().split("T")[0];
        const isoDateTime = `${todayISO}T${timeVal}:00`;

        const result = await fetchRouteAnalysis({
          origin_lat: activeOc[1],
          origin_lng: activeOc[0],
          destination_lat: activeDc[1],
          destination_lng: activeDc[0],
          origin_address: oText,
          destination_address: dText,
          travel_datetime: isoDateTime,
          priority_safety: prioritySafety,
        });

        setRouteData(result);
        setSelectedRouteId(result.recommended_route_id);
      } catch (err: any) {
        setSearchError(err.message || "Failed to analyze routes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [prioritySafety]
  );

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    executeRouteAnalysis(origin, destination, originCoords, destCoords, travelTime);
  };

  // Quick preset trigger
  const handleQuickPreset = (
    presetOrigin: string,
    presetDest: string,
    oc: { lat: number; lng: number },
    dc: { lat: number; lng: number }
  ) => {
    setOrigin(presetOrigin);
    setDestination(presetDest);
    setOriginCoords(oc);
    setDestCoords(dc);
    executeRouteAnalysis(presetOrigin, presetDest, oc, dc, travelTime);
  };

  const handleOriginSelect = (suggestion: LocationSuggestion) => {
    setOriginCoords({ lat: suggestion.lat, lng: suggestion.lng });
  };

  const handleDestSelect = (suggestion: LocationSuggestion) => {
    setDestCoords({ lat: suggestion.lat, lng: suggestion.lng });
  };

  const selectedRoute =
    routeData?.routes.find((r) => r.id === selectedRouteId) || routeData?.routes[0];

  const hasActiveRoute = Boolean(routeData && selectedRoute);

  return (
    <LandingCanvas
      className={hasActiveRoute ? "h-screen overflow-hidden flex flex-col bg-[#0b0713]" : ""}
      showBackgroundImage={!hasActiveRoute}
    >
      {/* ── Step 2.1: Full-Screen Lotus Opening Transition ── */}
      <LotusLoader isLoading={isLoading} statusMessage={loadingMsg} />

      {/* ── [1. STICKY DEEP PLUM NAV BAR] ── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[rgba(15,7,25,0.5)] border-b border-fuchsia-500/20 transition-colors">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left-aligned 'AAROH' text logo in glowing pink-to-purple gradient */}
          <div className="flex items-center gap-3">
            {hasActiveRoute && (
              <button
                onClick={() => setRouteData(null)}
                className="p-1.5 rounded-xl bg-purple-950/40 border border-fuchsia-500/30 text-fuchsia-300 hover:text-white hover:border-[#ff1493] transition flex items-center gap-1.5 text-xs font-semibold"
                title="Return to Landing"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Landing</span>
              </button>
            )}

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff1493] via-[#d946ef] to-[#a855f7] flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.4)] group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-[#ff1493] via-[#d946ef] to-[#a855f7] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(217,70,239,0.5)]">
                  AAROH
                </span>
                <span className="text-[9px] text-fuchsia-300/80 font-bold tracking-widest uppercase -mt-1">
                  Context Navigation
                </span>
              </div>
            </Link>
          </div>

          {/* Right-aligned low-profile navigational items with fuchsia hover effects */}
          <nav className="flex items-center gap-5 sm:gap-7 text-xs font-semibold text-fuchsia-200/80">
            <Link
              href="/"
              className="hover:text-fuchsia-300 hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.6)] transition-all"
            >
              Overview
            </Link>
            <Link
              href="/map"
              className="hover:text-fuchsia-300 hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.6)] transition-all"
            >
              Interactive Map
            </Link>
            <span className="hidden md:inline hover:text-fuchsia-300 hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.6)] transition-all cursor-default">
              Safety Radar
            </span>
            <div className="flex items-center gap-2 pl-2 border-l border-fuchsia-500/20">
              <span className="px-2.5 py-1 rounded-full bg-purple-950/40 border border-fuchsia-500/30 text-fuchsia-200 text-[11px] font-medium flex items-center gap-1.5 shadow-[0_0_10px_rgba(217,70,239,0.15)]">
                <Shield className="w-3 h-3 text-[#ff1493]" />
                <span className="hidden sm:inline">Context Engine</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff1493] animate-pulse" />
              </span>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Main Workspace Body (Morphs between Pre-Search and Dual-Panel After-Search) ── */}
      <main className="flex-1 flex flex-col w-full relative overflow-hidden">
        {!routeData || !selectedRoute ? (
          /* ═══════════════════════════════════════════════════════════════════
             🌸 MILESTONE 1: Pre-Search Landing Dashboard
             ═══════════════════════════════════════════════════════════════════ */
          <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12 max-w-5xl mx-auto w-full space-y-8 animate-fadeIn my-auto">
            {/* Header: Glowing pink-to-purple text gradient */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-fuchsia-500/30 text-fuchsia-200 text-xs font-semibold shadow-[0_0_15px_rgba(217,70,239,0.15)]">
                <Sparkles className="w-3.5 h-3.5 text-[#ff1493]" />
                Luminous Environmental &amp; Safety Intelligence
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Navigate with context, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#ff1493] via-[#d946ef] to-[#a855f7] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(217,70,239,0.45)]">
                  not just directions.
                </span>
              </h1>

              <p className="text-fuchsia-200/75 text-sm sm:text-base max-w-xl mx-auto">
                Explore how streets shift across travel hours with open shops, active crowds, reliable lighting, and protective support.
              </p>
            </div>

            {/* ── [2. RICH DARK-VIOLET FROSTED GLASS CENTRAL CARD] ── */}
            <div className="w-full max-w-xl mx-auto rounded-3xl p-[1px] bg-gradient-to-r from-fuchsia-500/40 via-purple-500/30 to-fuchsia-500/40 shadow-[0_0_25px_rgba(217,70,239,0.2)]">
              <div className="w-full rounded-[23px] p-6 sm:p-8 bg-purple-950/20 border border-fuchsia-500/25 backdrop-blur-lg space-y-6 shadow-[0_0_20px_rgba(217,70,239,0.15)]">
                <form onSubmit={handleAnalyze} className="space-y-4">
                  {/* Origin + Destination with styled glowing input focus states */}
                  <div className="space-y-3.5">
                    <LocationAutocomplete
                      label="Origin Location"
                      placeholder="Search origin landmark or street in India..."
                      value={origin}
                      onChange={(v) => {
                        setOrigin(v);
                        setOriginCoords(null);
                      }}
                      onSelectSuggestion={handleOriginSelect}
                      iconColor="text-[#ff1493]"
                    />

                    <LocationAutocomplete
                      label="Destination"
                      placeholder="Search destination in India..."
                      value={destination}
                      onChange={(v) => {
                        setDestination(v);
                        setDestCoords(null);
                      }}
                      onSelectSuggestion={handleDestSelect}
                      iconColor="text-[#d946ef]"
                    />
                  </div>

                  {/* ── [3. SYMMETRICAL SEARCH INPUTS: Travel Time & Prioritize Safety] ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Container 1: Travel Time */}
                    <div className="bg-purple-950/30 border border-fuchsia-500/25 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between h-[104px] shadow-[0_0_12px_rgba(217,70,239,0.08)]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-fuchsia-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#d946ef]" />
                          Travel Time
                        </label>
                        <button
                          type="button"
                          onClick={() => setTravelTime(getCurrentLocalTime())}
                          className="text-[10px] font-bold text-fuchsia-300/80 hover:text-white px-2 py-0.5 rounded-full border border-fuchsia-500/30 hover:border-[#ff1493] transition cursor-pointer"
                          title="Snap to device current time"
                        >
                          Use Live
                        </button>
                      </div>
                      <div className="relative mt-1">
                        <input
                          type="time"
                          value={travelTime}
                          onChange={(e) => setTravelTime(e.target.value)}
                          className="w-full bg-[#150b26]/80 border border-fuchsia-500/30 rounded-xl px-3.5 py-2 text-fuchsia-50 font-semibold text-sm focus:ring-2 focus:ring-[#ff1493]/40 focus:border-[#ff1493] outline-none transition cursor-pointer appearance-none shadow-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-fuchsia-300/70 pointer-events-none uppercase">
                          {(() => {
                            const h = parseInt(travelTime.split(":")[0], 10);
                            if (h >= 5 && h < 12) return "Morning";
                            if (h >= 12 && h < 17) return "Afternoon";
                            if (h >= 17 && h < 21) return "Evening";
                            return "Night";
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Container 2: Prioritize Safety (Identical height, padding, rounded corners, and background) */}
                    <div className="bg-purple-950/30 border border-fuchsia-500/25 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between h-[104px] shadow-[0_0_12px_rgba(217,70,239,0.08)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-fuchsia-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-[#ff1493]" />
                          Prioritize Safety
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          prioritySafety
                            ? "bg-[#ff1493]/20 text-pink-300 border-[#ff1493]/40"
                            : "bg-slate-800/40 text-slate-400 border-slate-700/40"
                        }`}>
                          {prioritySafety ? "Active" : "Standard"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-0.5">
                        <span className="text-[11px] text-fuchsia-300/70 leading-tight pr-2">
                          Favor active corridors &amp; verified street lighting
                        </span>
                        <button
                          type="button"
                          onClick={() => setPrioritySafety(!prioritySafety)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            prioritySafety
                              ? "bg-gradient-to-r from-[#ff1493] to-[#d946ef] shadow-[0_0_10px_rgba(255,20,147,0.5)]"
                              : "bg-purple-950/80 border border-fuchsia-500/30"
                          }`}
                          role="switch"
                          aria-checked={prioritySafety}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              prioritySafety ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coordinate confirmation hint */}
                  {(originCoords || destCoords) && (
                    <div className="flex items-center gap-2 text-[11px] text-fuchsia-300/70 px-1">
                      <MapPin className="w-3 h-3 text-[#ff1493] shrink-0" />
                      <span>
                        {originCoords && destCoords
                          ? "Both locations pinned from OpenStreetMap"
                          : "Select suggestion to pin coordinate location"}
                      </span>
                    </div>
                  )}

                  {/* Primary CTA Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 mt-2 bg-gradient-to-r from-[#ff1493] via-[#d946ef] to-[#a855f7] hover:from-[#ff1493] hover:to-[#8b5cf6] text-white font-extrabold text-base rounded-2xl transition-all duration-300 shadow-pink-glow-strong hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Analyze Route Context</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>

                {/* Quick-Select Chips for Demo Route Presets */}
                <div className="pt-4 border-t border-fuchsia-500/20">
                  <span className="text-xs font-bold text-fuchsia-300 block mb-2.5 uppercase tracking-wider">
                    Demo Route Presets:
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickPreset(
                          "Sector 62, Noida",
                          "Sector 18, Noida",
                          { lat: 28.628, lng: 77.3639 },
                          { lat: 28.5705, lng: 77.3235 }
                        )
                      }
                      className="text-xs bg-purple-950/40 hover:bg-[#a855f7]/25 text-fuchsia-200 border border-fuchsia-500/30 hover:border-[#ff1493] hover:shadow-[0_0_15px_rgba(217,70,239,0.25)] rounded-full px-4 py-2 font-medium transition cursor-pointer"
                    >
                      🌸 Sector 62 → Sector 18
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleQuickPreset(
                          "Botanical Garden Metro",
                          "Noida Electronic City",
                          { lat: 28.5645, lng: 77.334 },
                          { lat: 28.6275, lng: 77.3735 }
                        )
                      }
                      className="text-xs bg-purple-950/40 hover:bg-[#a855f7]/25 text-fuchsia-200 border border-fuchsia-500/30 hover:border-[#ff1493] hover:shadow-[0_0_15px_rgba(217,70,239,0.25)] rounded-full px-4 py-2 font-medium transition cursor-pointer"
                    >
                      🌸 Botanical Garden → Electronic City
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── [2. RICH DARK-VIOLET FROSTED GLASS FEATURE HIGHLIGHT GRID] ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto w-full pt-2">
              {/* 1. Public Activity */}
              <div className="bg-purple-950/20 border border-fuchsia-500/25 backdrop-blur-lg p-4 rounded-2xl space-y-2.5 shadow-[0_0_20px_rgba(217,70,239,0.15)] hover:border-fuchsia-400/40 hover:shadow-[0_0_25px_rgba(217,70,239,0.25)] transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.35)]">
                  <Users className="w-5 h-5 text-cyan-300" />
                </div>
                <h4 className="font-bold text-white text-sm">Public Activity</h4>
                <p className="text-xs text-fuchsia-200/70 leading-relaxed">
                  Evaluates active POI footfall and commercial corridor vitality.
                </p>
              </div>

              {/* 2. Estimated Surveillance */}
              <div className="bg-purple-950/20 border border-fuchsia-500/25 backdrop-blur-lg p-4 rounded-2xl space-y-2.5 shadow-[0_0_20px_rgba(217,70,239,0.15)] hover:border-fuchsia-400/40 hover:shadow-[0_0_25px_rgba(217,70,239,0.25)] transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-[#a855f7]/40 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.35)]">
                  <Video className="w-5 h-5 text-[#d946ef]" />
                </div>
                <h4 className="font-bold text-white text-sm">Estimated Surveillance</h4>
                <p className="text-xs text-fuchsia-200/70 leading-relaxed">
                  Calculates support infrastructure, banks, ATMs, and police posts.
                </p>
              </div>

              {/* 3. Street Lighting */}
              <div className="bg-purple-950/20 border border-fuchsia-500/25 backdrop-blur-lg p-4 rounded-2xl space-y-2.5 shadow-[0_0_20px_rgba(217,70,239,0.15)] hover:border-fuchsia-400/40 hover:shadow-[0_0_25px_rgba(217,70,239,0.25)] transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-amber-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.35)]">
                  <Lightbulb className="w-5 h-5 text-amber-300" />
                </div>
                <h4 className="font-bold text-white text-sm">Street Lighting</h4>
                <p className="text-xs text-fuchsia-200/70 leading-relaxed">
                  Verifies streetlight density and lit highway tags along pathways.
                </p>
              </div>

              {/* 4. Public Transport */}
              <div className="bg-purple-950/20 border border-fuchsia-500/25 backdrop-blur-lg p-4 rounded-2xl space-y-2.5 shadow-[0_0_20px_rgba(217,70,239,0.15)] hover:border-fuchsia-400/40 hover:shadow-[0_0_25px_rgba(217,70,239,0.25)] transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-rose-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.35)]">
                  <Bus className="w-5 h-5 text-rose-300" />
                </div>
                <h4 className="font-bold text-white text-sm">Public Transport</h4>
                <p className="text-xs text-fuchsia-200/70 leading-relaxed">
                  Syncs nearby metro and bus frequency at your specific travel time.
                </p>
              </div>
            </div>

            {searchError && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 max-w-md mx-auto">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             🌺 MILESTONE 2: The Vertical Split After-Search Screen (40% Details | 60% Map)
             ═══════════════════════════════════════════════════════════════════ */
          <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-[#0b0713]">
            {/* ── [1. LEFT PANEL: Stats & AI Feedback - 40% Desktop, Full Height, Native Smooth Scroll] ── */}
            <div className="w-full md:w-[40%] h-[45vh] md:h-full flex flex-col p-6 overflow-y-auto pointer-events-auto select-text scrollbar-thin scrollbar-thumb-fuchsia-500/20 scrollbar-track-transparent gap-4 border-r border-fuchsia-500/20 bg-[#0b0713]/90 z-20">
              {/* Quick Journey Navigation Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-purple-950/25 border border-fuchsia-500/25 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff1493] via-[#d946ef] to-[#a855f7] flex items-center justify-center shadow-fuchsia-glow shrink-0">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {origin} → {destination}
                    </span>
                    <span className="text-[10px] text-fuchsia-300/80">
                      Departure: {travelTime} • {prioritySafety ? "Safety First" : "Fastest"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#ff1493] to-[#d946ef] hover:from-[#ff1493]/90 hover:to-[#d946ef]/90 text-white rounded-xl text-xs font-bold shadow-fuchsia-glow flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                    <span>Recalculate</span>
                  </button>
                  <button
                    onClick={() => setRouteData(null)}
                    className="px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/50 border border-fuchsia-500/30 text-fuchsia-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Edit Route
                  </button>
                </div>
              </div>

              {/* AI Safety Companion & Context Explanation */}
              {(() => {
                const exp: any = routeData?.explanation;
                const isObj = typeof exp === "object" && exp !== null;
                const isAi =
                  (isObj && exp.status === "ai_generated") ||
                  routeData?.explanation_source === "ai_generated";

                const rawHeadline = isObj ? exp.headline || exp.summary : exp;
                const rawSummary = isObj && exp.headline ? exp.summary : null;
                const why: string[] =
                  isObj && Array.isArray(exp.why_recommended) ? exp.why_recommended : [];
                const tradeoffs: string[] =
                  isObj && Array.isArray(exp.tradeoffs) ? exp.tradeoffs : [];
                const attention: string[] =
                  isObj && Array.isArray(exp.attention_summary)
                    ? exp.attention_summary
                    : [];

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
                        {sweetCoatAIFeedback(rawHeadline)}
                      </p>
                      {rawSummary && (
                        <p className="text-xs text-fuchsia-200/80 leading-relaxed">
                          {sweetCoatAIFeedback(rawSummary)}
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

                    {attention.length > 0 &&
                      attention[0] !== "No major attention zones detected along this route." && (
                        <div className="space-y-1 pt-2 border-t border-fuchsia-500/20">
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                            Mindful Stretches:
                          </span>
                          <ul className="space-y-1">
                            {attention.map((att, i) => (
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
                    <span>Route Alternatives ({routeData.routes.length})</span>
                  </h3>
                  <span className="text-xs text-fuchsia-300/70 font-medium">Sorted by Comfort</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {routeData.routes.map((r) => (
                    <RouteCard
                      key={r.id}
                      route={r}
                      isSelected={r.id === selectedRouteId}
                      isRecommended={r.id === routeData.recommended_route_id}
                      onSelect={() => setSelectedRouteId(r.id)}
                      onMouseEnter={() => setHoveredRouteId(r.id)}
                      onMouseLeave={() => setHoveredRouteId(null)}
                    />
                  ))}
                </div>
              </div>

              {/* Selected Route Factor Ratings & Attention Zones */}
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

                  {/* Ground Truth Observation Toggle */}
                  <div className="pt-2 pb-6">
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
                            handleAnalyze({ preventDefault: () => {} } as any);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── [2. RIGHT PANEL: Map Section - 60% Desktop, Full Height, Static Lock] ── */}
            <div className="w-full md:w-[60%] h-[55vh] md:h-full p-4 md:p-6 flex flex-col shrink-0">
              {/* OUTER FRAME: Frosted-Glass Shell with p-3 border channel and nested 28px rounding */}
              <div className="relative w-full h-full p-3 rounded-[28px] border border-fuchsia-500/30 bg-purple-950/15 backdrop-blur-md shadow-[0_0_30px_rgba(217,70,239,0.15)] flex items-center justify-center overflow-hidden">
                {/* Live Digital Date & Time Card (Top-Right of Map Shell) */}
                <div className="absolute top-6 right-6 z-10 bg-purple-950/70 backdrop-blur-md border border-fuchsia-500/30 rounded-xl px-3 py-1.5 text-xs text-fuchsia-200 font-mono font-semibold shadow-lg pointer-events-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff1493] animate-ping shrink-0" />
                  <span>{currentDateTimeStr || "Live Context Active"}</span>
                </div>

                {/* Return/Edit Search Action (Top-Left of Map Shell) */}
                <div className="absolute top-6 left-6 z-10">
                  <button
                    onClick={() => setRouteData(null)}
                    className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900/80 backdrop-blur-md border border-fuchsia-500/30 text-fuchsia-200 hover:text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Search</span>
                  </button>
                </div>

                {/* INNER MAP CANVAS: Nested 18px rounded container prevents border clipping */}
                <div className="w-full h-full rounded-[18px] overflow-hidden bg-slate-950 relative">
                  <AarohMap
                    routes={routeData.routes}
                    selectedRouteId={selectedRouteId}
                    hoveredRouteId={hoveredRouteId}
                    onSelectRoute={(id) => setSelectedRouteId(id)}
                    onSelectSegment={(seg) => setActiveSegment(seg)}
                    originCoords={
                      originCoords ? [originCoords.lng, originCoords.lat] : [77.3639, 28.628]
                    }
                    destCoords={
                      destCoords ? [destCoords.lng, destCoords.lat] : [77.3235, 28.5705]
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Step 2.4: Companion Avatar Widget ── */}
      <CompanionAvatar
        score={selectedRoute?.score ?? 80}
        statusText={
          selectedRoute?.attention_zones?.length
            ? `Noticed ${selectedRoute.attention_zones.length} quiet stretch(es) along this route. Stay mindful and stick to the lit roads!`
            : "This corridor is glowing with open shops and transit activity! Enjoy your journey! 🌸"
        }
        isEvaluating={isLoading}
      />

      {/* ── Segment Detail Modal ── */}
      <SegmentDetails segment={activeSegment} onClose={() => setActiveSegment(null)} />
    </LandingCanvas>
  );
}
