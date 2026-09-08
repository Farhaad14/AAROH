"use client";

import React from "react";
import { RouteDetail } from "@/types/route";
import { Clock, Navigation, AlertTriangle, ShieldCheck, Zap } from "lucide-react";

interface RouteCardProps {
  route: RouteDetail;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  isRecommended,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}) => {
  const durationMin = Math.round(route.duration_seconds / 60);
  const distanceKm = (route.distance_m / 1000).toFixed(1);

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
          ? "border-sky-500 bg-slate-800/90 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500"
          : "border-slate-700/70 bg-slate-900/60 hover:bg-slate-800/60 font-sans"
      } relative`}
    >
      {isRecommended && (
        <span className="absolute -top-2.5 left-4 bg-sky-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
          <Zap className="w-3 h-3 fill-slate-950" /> Recommended Context Route
        </span>
      )}

      <div className="flex items-start justify-between gap-3 mt-1">
        <div>
          <h3 className="font-semibold text-slate-100 text-base">{route.name}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> {durationMin} min
            </span>
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-slate-400" /> {distanceKm} km
            </span>
            <span className="flex items-center gap-1 text-slate-300 font-medium bg-slate-800/80 px-1.5 py-0.5 rounded text-[11px] border border-slate-700/40">
              <ShieldCheck className="w-3 h-3 text-sky-400" /> {route.confidence}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
              route.source === "demo_fallback"
                ? "bg-amber-950/40 text-amber-400 border-amber-800/50"
                : "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
            }`}>
              {route.source === "demo_fallback" ? "Demo Corridor" : "Live OSRM Geometry"}
            </span>
            {route.validation?.is_valid && (
              <span className="text-[10px] text-slate-400">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border ${scoreColor} min-w-[72px]`}
        >
          <span className="text-2xl font-extrabold leading-none">{Math.round(route.score)}</span>
          <span className="text-[9px] uppercase font-semibold tracking-wider opacity-80 mt-0.5 text-center">Context</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {route.attention_zones.length > 0 ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> {route.attention_zones.length} Attention Zone(s)
            </span>
          ) : (
            <span className="text-emerald-400 font-medium">✓ Strong contextual corridor</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition"
        >
          {isSelected ? "Selected" : "Select Route →"}
        </button>
      </div>
    </div>
  );
};
