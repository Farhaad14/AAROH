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
      ? "text-emerald-400 border-emerald-500/50 bg-emerald-950/30"
      : route.score >= 60
      ? "text-sky-400 border-sky-500/50 bg-sky-950/30"
      : "text-amber-400 border-amber-500/50 bg-amber-950/30";

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`cursor-pointer transition-all duration-200 p-4 rounded-xl border ${
        isSelected
          ? "border-sky-500 bg-slate-800/95 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500"
          : "border-slate-800 bg-slate-900/70 hover:bg-slate-800/60 font-sans"
      } relative`}
    >
      {/* ── Top Header Tag ── */}
      {isRecommended ? (
        <span className="absolute -top-2.5 left-4 bg-sky-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
          <Zap className="w-3 h-3 fill-slate-950" /> AI Recommended — Safest Option
        </span>
      ) : (
        <span className="absolute -top-2.5 left-4 bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
          Alternative Route
        </span>
      )}

      {/* ── Main Route Info + Score ── */}
      <div className="flex items-start justify-between gap-3 mt-1.5">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-100 text-base leading-snug">{route.name}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> {durationMin} min
            </span>
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-slate-400" /> {distanceKm} km
            </span>
            <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-800/80 px-1.5 py-0.5 rounded text-[11px] border border-slate-700/40">
              <ShieldCheck className="w-3 h-3 text-sky-400" /> {route.confidence}
            </span>
            {route.validation?.is_valid && (
              <span className="text-[10px] text-emerald-400/80 font-medium">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border ${scoreColor} min-w-[72px] shrink-0`}
        >
          <span className="text-2xl font-extrabold leading-none">{Math.round(route.score)}</span>
          <span className="text-[9px] uppercase font-semibold tracking-wider opacity-80 mt-0.5 text-center">Context</span>
        </div>
      </div>

      {/* ── Differentiated Factor Presentation ── */}
      {isRecommended ? (
        /* Recommended Route: Emphasize Strengths + 1-2 Minor Concerns + Collapsed Rest */
        <div className="mt-3 pt-2.5 border-t border-slate-800/70 space-y-2">
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
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 transition"
              >
                <span>{showMinor ? "Hide additional factors" : `+${comparison.minorConcerns.length} more factors`}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMinor ? "rotate-180" : ""}`} />
              </button>

              {showMinor && (
                <div className="mt-1.5 pl-2.5 border-l-2 border-slate-700/80 space-y-1 animate-fadeIn">
                  {comparison.minorConcerns.map((mc, idx) => (
                    <div key={idx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                      <span className="text-slate-500 mt-0.5">•</span>
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
        <div className="mt-3 pt-2.5 border-t border-slate-800/70 space-y-2">
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
            <div className="text-xs text-slate-400">
              Corridor evaluated with lower overall ambient support.
            </div>
          )}

          {/* Explanation: Why Not Recommended */}
          {comparison.whyNotRecommended && (
            <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-rose-950/25 border border-rose-900/40 text-[11px] text-slate-300 leading-relaxed">
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
                className="text-[11px] text-slate-400 hover:text-slate-300 font-medium inline-flex items-center gap-1 transition"
              >
                <span>{showMinor ? "Hide additional factors" : `+${comparison.minorConcerns.length} more factors`}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMinor ? "rotate-180" : ""}`} />
              </button>

              {showMinor && (
                <div className="mt-1.5 pl-2.5 border-l-2 border-slate-700/80 space-y-1 animate-fadeIn">
                  {comparison.minorConcerns.map((mc, idx) => (
                    <div key={idx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                      <span className="text-slate-500 mt-0.5">•</span>
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
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="text-slate-400 text-[11px]">
          {route.attention_zones.length > 0 ? (
            <span>{route.attention_zones.length} Attention Cluster(s)</span>
          ) : (
            <span className="text-emerald-400/90 font-medium">Uniform context</span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`font-semibold flex items-center gap-1 transition px-2.5 py-1 rounded text-xs ${
            isSelected
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          {isSelected ? "Selected Route ✓" : "Select Route →"}
        </button>
      </div>
    </div>
  );
};
