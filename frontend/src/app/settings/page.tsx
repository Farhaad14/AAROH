"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sliders, Save, RotateCcw, CheckCircle } from "lucide-react";

const WEIGHT_META: Record<string, { label: string; icon: string; desc: string }> = {
  activity:     { label: "Activity & Footfall",  icon: "🚶", desc: "Pedestrian presence and open businesses" },
  businesses:   { label: "Business Density",     icon: "🏪", desc: "Open shops, cafes and public spaces" },
  emergency:    { label: "Emergency Access",      icon: "🚑", desc: "Proximity to hospitals, police stations" },
  time:         { label: "Time Sensitivity",      icon: "🕐", desc: "How much time-of-day affects the route" },
  isolation:    { label: "Isolation Risk",        icon: "🌑", desc: "Deserted or poorly-connected segments" },
  surveillance: { label: "Surveillance Coverage", icon: "📷", desc: "CCTV and monitored zones" },
  network:      { label: "Network Connectivity",  icon: "📡", desc: "Signal strength and emergency comms" },
  transit:      { label: "Transit Access",        icon: "🚌", desc: "Proximity to bus stops and metro" },
  lighting:     { label: "Street Lighting",       icon: "💡", desc: "Ambient light levels along route" },
};

const DEFAULTS = {
  activity: 20,
  emergency: 20,
  businesses: 15,
  isolation: 14,
  transit: 10,
  surveillance: 9,
  network: 6,
  lighting: 4,
  time: 2,
};

export default function SettingsPage() {
  const [weights, setWeights] = useState({ ...DEFAULTS });
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("aaroh_scoring_weights");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null) {
          setWeights((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
  }, []);

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = total === 100;

  const handleChange = (key: string, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleReset = () => {
    setWeights({ ...DEFAULTS });
    setSaved(false);
  };

  const handleSave = () => {
    if (!isValid) return;
    try {
      localStorage.setItem("aaroh_scoring_weights", JSON.stringify(weights));
      window.dispatchEvent(new CustomEvent("aaroh-weights-updated", { detail: weights }));
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0b0713] text-[#f5edfc] flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-fuchsia-500/20 bg-purple-950/40 backdrop-blur-xl px-4 flex items-center gap-3 shrink-0">
        <Link
          href="/map"
          className="p-1.5 rounded-xl bg-purple-950/60 border border-fuchsia-500/30 text-fuchsia-300 hover:text-white hover:border-[#ff1493] transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Map</span>
        </Link>

        <div className="w-px h-5 bg-fuchsia-500/20" />

        <div>
          <h1 className="font-black text-base tracking-tight text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#d946ef]" />
            Engine Settings
          </h1>
          <span className="text-[9px] text-fuchsia-300 font-bold block -mt-0.5 tracking-widest uppercase">
            Context Layer Weights
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Live total badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
            isValid
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
              : "bg-rose-500/15 text-rose-300 border-rose-500/40"
          }`}>
            Total: {total}%{isValid ? " ✓" : " ≠ 100"}
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Info banner */}
          <div className="bg-purple-950/30 border border-fuchsia-500/20 rounded-2xl px-4 py-3 text-xs text-fuchsia-200/80 leading-relaxed">
            Adjust how much each safety signal influences route scoring. The weights must sum to
            exactly <span className="text-white font-bold">100%</span>. Higher weight = stronger influence on the safety score.
          </div>

          {/* Weight sliders */}
          <div className="bg-purple-950/20 border border-fuchsia-500/20 rounded-2xl overflow-hidden">
            {Object.entries(weights).map(([key, val], idx) => {
              const meta = WEIGHT_META[key] || { label: key, icon: "⚙️", desc: "" };
              const pct = Math.min(100, (val / 30) * 100);
              return (
                <div
                  key={key}
                  className={`p-4 space-y-2.5 ${idx !== 0 ? "border-t border-fuchsia-500/10" : ""}`}
                >
                  {/* Label row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{meta.icon}</span>
                      <div>
                        <span className="text-sm font-bold text-white">{meta.label}</span>
                        <span className="block text-[10px] text-fuchsia-300/60 mt-0.5">{meta.desc}</span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-[#ff1493] tabular-nums min-w-[3rem] text-right">
                      {val}%
                    </span>
                  </div>

                  {/* Slider with custom fill */}
                  <div className="relative">
                    {/* Filled track overlay */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-full bg-gradient-to-r from-[#ff1493] to-[#d946ef] pointer-events-none transition-all duration-150"
                      style={{ width: `${pct}%` }}
                    />
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={val}
                      onChange={(e) => handleChange(key, parseInt(e.target.value))}
                      className="relative w-full h-2 bg-purple-950/60 border border-fuchsia-500/20 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,20,147,0.6)]
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-[#ff1493]
                        [&::-webkit-slider-thumb]:cursor-grab
                        [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-white
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-[#ff1493]
                        [&::-moz-range-thumb]:cursor-grab"
                    />
                  </div>

                  {/* Tick marks */}
                  <div className="flex justify-between text-[9px] text-fuchsia-500/40 font-mono px-0.5">
                    {[1, 8, 15, 22, 30].map((t) => <span key={t}>{t}</span>)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total bar */}
          <div className="bg-purple-950/20 border border-fuchsia-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-fuchsia-300">Weight Distribution</span>
              <span className={isValid ? "text-emerald-400" : "text-rose-400"}>{total} / 100%</span>
            </div>
            <div className="h-2.5 w-full bg-purple-950/60 rounded-full overflow-hidden border border-fuchsia-500/20">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  total > 100
                    ? "bg-gradient-to-r from-rose-500 to-red-600"
                    : total === 100
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-[#ff1493] to-[#d946ef]"
                }`}
                style={{ width: `${Math.min(100, total)}%` }}
              />
            </div>
            {!isValid && (
              <p className="text-[11px] text-rose-300/80">
                {total > 100 ? `Over by ${total - 100}% — reduce some weights` : `Under by ${100 - total}% — increase some weights`}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pb-6">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-fuchsia-500/30 text-fuchsia-300 hover:text-white hover:border-[#ff1493] text-xs font-bold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>

            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                saved
                  ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300"
                  : isValid
                  ? "bg-gradient-to-r from-[#ff1493] to-[#d946ef] text-white shadow-[0_0_20px_rgba(255,20,147,0.3)] hover:opacity-90"
                  : "bg-purple-950/40 border border-fuchsia-500/20 text-fuchsia-500/50 cursor-not-allowed"
              }`}
            >
              {saved ? (
                <><CheckCircle className="w-3.5 h-3.5" /> Saved!</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Save Weight Profile</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
