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
      {isRecommended && (
        <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-[#ff1493] to-[#d946ef] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-fuchsia-glow">
          <Zap className="w-3 h-3 fill-white" /> Recommended Context Route
        </span>
      )}

      <div className="flex items-start justify-between gap-3 mt-1">
        <div>
          <h3 className="font-bold text-white text-base">{route.name}</h3>
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
              <span className="text-[10px] text-fuchsia-300/80">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border ${scoreColor} min-w-[72px]`}
        >
          <span className="text-2xl font-black leading-none">{Math.round(route.score)}</span>
          <span className="text-[9px] uppercase font-semibold tracking-wider opacity-80 mt-0.5 text-center">Score</span>
        </div>
      </div>

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
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="text-[#d946ef] hover:text-[#ff1493] font-bold flex items-center gap-1 transition"
        >
          {isSelected ? "Selected" : "Select Route →"}
        </button>
      </div>
    </div>
  );
};
