"use client";

import React, { useState, useMemo } from "react";
import { RouteDetail } from "@/types/route";
import { Clock, Navigation, AlertTriangle, ShieldCheck, Zap, CheckCircle2, ChevronDown } from "lucide-react";
import { analyzeRouteFactors } from "@/lib/routeFactors";

interface RouteCardProps {
  route: RouteDetail;
  isSelected: boolean;
  isRecommended: boolean;
  recommendedRoute?: RouteDetail;
  onSelect: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  isRecommended,
  recommendedRoute,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [showMinor, setShowMinor] = useState(false);

  const durationMin = Math.round(route.duration_seconds / 60);
  const distanceKm = (route.distance_m / 1000).toFixed(1);

  const comparison = useMemo(
    () => analyzeRouteFactors(route, isRecommended, recommendedRoute),
    [route, isRecommended, recommendedRoute]
  );

  const scoreColor =
    route.score >= 75
      ? "text-[#ff1493] border-[#ff1493]/50 bg-[#ff1493]/10 shadow-[0_0_12px_rgba(255,20,147,0.25)]"
      : route.score >= 60
      ? "text-[#d946ef] border-[#d946ef]/50 bg-[#d946ef]/10 shadow-fuchsia-glow"
      : "text-slate-400 border-slate-600/50 bg-slate-800/40";

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`cursor-pointer transition-all duration-200 p-4 rounded-2xl border ${
        isSelected
          ? "border-[#ff1493] bg-[#150b26]/90 shadow-[0_0_25px_rgba(255,20,147,0.2)] ring-1 ring-[#ff1493]/50"
          : "border-[#d946ef]/20 bg-[#150b26]/50 hover:bg-[#150b26]/80 hover:border-[#d946ef]/40 font-sans"
      } relative`}
    >
      {/* ── Top Header Tag ── */}
      {isRecommended ? (
        <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-[#ff1493] to-[#d946ef] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-fuchsia-glow">
          <Zap className="w-3 h-3 fill-white" /> Recommended Context Route
        </span>
      ) : (
        <span className="absolute -top-2.5 left-4 bg-[#1e1136] text-fuchsia-300/80 border border-[#d946ef]/30 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
          Alternative Route
        </span>
      )}

      {/* ── Main Route Info + Score ── */}
      <div className="flex items-start justify-between gap-3 mt-1.5">
        <div>
          <h3 className="font-bold text-white text-base leading-snug">{route.name}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-fuchsia-200/70 mt-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-fuchsia-400" /> {durationMin} min
            </span>
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-fuchsia-400" /> {distanceKm} km
            </span>
            <span className="flex items-center gap-1 text-fuchsia-200 font-medium bg-[#1e1136] px-2 py-0.5 rounded-md border border-[#d946ef]/30 text-[11px]">
              <ShieldCheck className="w-3 h-3 text-[#ff1493]" /> {route.confidence}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
              route.source === "demo_fallback"
                ? "bg-purple-950/40 text-fuchsia-300 border-fuchsia-800/40"
                : "bg-pink-950/40 text-pink-300 border-pink-800/40"
            }`}>
              {route.source === "demo_fallback" ? "Demo Corridor" : "Live OSRM Geometry"}
            </span>
            {route.validation?.is_valid && (
              <span className="text-[10px] text-fuchsia-300/80 font-medium">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border ${scoreColor} min-w-[72px] shrink-0`}
        >
          <span className="text-2xl font-black leading-none">{Math.round(route.score)}</span>
          <span className="text-[9px] uppercase font-semibold tracking-wider opacity-80 mt-0.5 text-center">Score</span>
        </div>
      </div>

      {/* ── Differentiated Factor Presentation ── */}
      {isRecommended ? (
        /* Recommended Route: Emphasize Strengths + 1-2 Minor Concerns + Collapsed Rest */
        <div className="mt-3 pt-2.5 border-t border-[#d946ef]/15 space-y-2">
          {/* Key Strengths */}
          {comparison.strengths.length > 0 && (
            <div className="space-y-1">
              {comparison.strengths.map((s, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* 1-2 Prominent Attention Points (Compromise) */}
          {comparison.prominentConcerns.length > 0 && (
            <div className="space-y-1 pt-1">
              {comparison.prominentConcerns.map((c, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-amber-300/95 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Attention: {c.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Collapsible Minor Factors */}
          {comparison.minorConcerns.length > 0 && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMinor(!showMinor);
                }}
                className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 font-medium inline-flex items-center gap-1 transition"
              >
                <span>{showMinor ? "Hide additional factors" : `+${comparison.minorConcerns.length} more factors`}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMinor ? "rotate-180" : ""}`} />
              </button>

              {showMinor && (
                <div className="mt-1.5 pl-2.5 border-l-2 border-fuchsia-800/40 space-y-1 animate-fadeIn">
                  {comparison.minorConcerns.map((mc, idx) => (
                    <div key={idx} className="text-[11px] text-fuchsia-200/70 flex items-start gap-1.5">
                      <span className="text-fuchsia-400 mt-0.5">•</span>
                      <span>{mc.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Alternative Route: Expose 2-3 Drawbacks Immediately + Explain Why Not Recommended */
        <div className="mt-3 pt-2.5 border-t border-[#d946ef]/15 space-y-2">
          {/* Prominent Drawbacks (Always visible without selection) */}
          {comparison.prominentConcerns.length > 0 ? (
            <div className="space-y-1.5">
              {comparison.prominentConcerns.map((c, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-rose-300/90 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-fuchsia-200/60">
              Corridor evaluated with lower overall ambient support.
            </div>
          )}

          {/* Explanation: Why Not Recommended */}
          {comparison.whyNotRecommended && (
            <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-[11px] text-fuchsia-100 leading-relaxed">
              <span className="font-semibold text-rose-400">Why not recommended: </span>
              <span>{comparison.whyNotRecommended}</span>
            </div>
          )}

          {/* Collapsible Minor Factors for Alternatives */}
          {comparison.minorConcerns.length > 0 && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMinor(!showMinor);
                }}
                className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 font-medium inline-flex items-center gap-1 transition"
              >
                <span>{showMinor ? "Hide additional factors" : `+${comparison.minorConcerns.length} more factors`}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMinor ? "rotate-180" : ""}`} />
              </button>

              {showMinor && (
                <div className="mt-1.5 pl-2.5 border-l-2 border-fuchsia-800/40 space-y-1 animate-fadeIn">
                  {comparison.minorConcerns.map((mc, idx) => (
                    <div key={idx} className="text-[11px] text-fuchsia-200/70 flex items-start gap-1.5">
                      <span className="text-fuchsia-400 mt-0.5">•</span>
                      <span>{mc.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Footer / Selection ── */}
      <div className="mt-3 pt-3 border-t border-[#d946ef]/15 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {route.attention_zones.length > 0 ? (
            <span className="flex items-center gap-1 text-amber-300 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> {route.attention_zones.length} Attention Zone(s)
            </span>
          ) : (
            <span className="text-[#ff1493] font-medium flex items-center gap-1">
              🌸 Strong contextual corridor
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="text-[#d946ef] hover:text-[#ff1493] font-bold flex items-center gap-1 transition"
        >
          {isSelected ? "Selected Route ✓" : "Select Route →"}
        </button>
      </div>
    </div>
  );
};
