"use client";

import React from "react";
import { FeatureScores } from "@/types/route";
import { Users, Store, ShieldAlert, Clock, Eye, Signal, Bus, Sun, Lock } from "lucide-react";

interface ScoreBreakdownProps {
  features: FeatureScores;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ features }) => {
  const factors = [
    { key: "activity", label: "Public Activity Proxy", sourceTag: "Estimated Proxy", score: features.activity, icon: Users, desc: "Derived from open POIs, transit stops, commercial activity." },
    { key: "businesses", label: "Open Businesses", sourceTag: "OSM Hours", score: features.businesses, icon: Store, desc: "Operating commercial establishments at travel hour." },
    { key: "emergency", label: "Emergency Access", sourceTag: "Live OSM", score: features.emergency, icon: ShieldAlert, desc: "Proximity to police stations, hospitals, fire stations." },
    { key: "time", label: "Time Context", sourceTag: "Temporal Curve", score: features.time, icon: Clock, desc: "Ambient context modifier for requested hour." },
    { key: "isolation", label: "Isolation Index", sourceTag: "Calculated", score: 100 - features.isolation, icon: Lock, desc: "Connectivity & support density (100 - isolation index)." },
    { key: "surveillance", label: "Surveillance Indicator", sourceTag: "OSM + Proxies", score: features.surveillance, icon: Eye, desc: "Verified cameras and commercial surveillance proxies." },
    { key: "network", label: "Mobile Network", sourceTag: "Signal Model", score: features.network, icon: Signal, desc: "Estimated voice/connectivity coverage." },
    { key: "transit", label: "Public Transport", sourceTag: "Live Transit", score: features.transit, icon: Bus, desc: "Nearby bus & metro stops active at travel time." },
    { key: "lighting", label: "Street Lighting", sourceTag: "OSM Lit Tags", score: features.lighting, icon: Sun, desc: "Streetlight density & verified lit highway tags." },
  ];

  return (
    <div className="bg-[#150b26]/70 rounded-2xl p-4 border border-[#d946ef]/25 space-y-3 font-sans shadow-fuchsia-glow">
      <div className="flex items-center justify-between border-b border-[#d946ef]/20 pb-2">
        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
          <span>🌸 Context Factors Breakdown</span>
        </h4>
        <span className="text-[10px] text-fuchsia-300/60 font-normal">Scale 0 - 100</span>
      </div>

      <div className="space-y-2.5">
        {factors.map((item) => {
          const Icon = item.icon;
          const val = Math.round(item.score);
          const barColor =
            val >= 75
              ? "bg-gradient-to-r from-[#ff1493] to-[#d946ef]"
              : val >= 55
              ? "bg-gradient-to-r from-[#d946ef] to-[#a855f7]"
              : "bg-slate-600";

          return (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-fuchsia-100">
                  <Icon className="w-3.5 h-3.5 text-[#ff1493] shrink-0" />
                  <span>{item.label}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#08040d]/60 text-fuchsia-300/80 border border-[#d946ef]/25 font-mono">
                    {item.sourceTag}
                  </span>
                </span>
                <span className={`font-bold font-mono ${val >= 75 ? "text-[#ff1493]" : val >= 55 ? "text-fuchsia-300" : "text-slate-400"}`}>
                  {val}/100
                </span>
              </div>
              <div className="w-full bg-[#08040d]/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-fuchsia-300/50 italic pt-1 leading-relaxed border-t border-[#d946ef]/15">
        * Environmental context intelligence evaluated client-side from OpenStreetMap & geospatial indicators.
      </p>
    </div>
  );
};
