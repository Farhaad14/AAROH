"use client";

import React, { useState, useEffect } from "react";
import { Sliders, RotateCcw, Save, CheckCircle, X, Sparkles } from "lucide-react";

export const WEIGHT_META: Record<string, { label: string; icon: string; desc: string }> = {
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

export const DEFAULT_WEIGHTS: Record<string, number> = {
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

export const PRESET_PROFILES: Record<string, { name: string; icon: string; weights: Record<string, number> }> = {
  balanced: {
    name: "Standard Balanced",
    icon: "🌸",
    weights: { activity: 20, emergency: 20, businesses: 15, isolation: 14, transit: 10, surveillance: 9, network: 6, lighting: 4, time: 2 }
  },
  night: {
    name: "Night Vigilance",
    icon: "🌙",
    weights: { activity: 16, emergency: 24, businesses: 12, isolation: 18, transit: 8, surveillance: 12, network: 4, lighting: 4, time: 2 }
  },
  commercial: {
    name: "Active Commercial",
    icon: "🏪",
    weights: { activity: 26, emergency: 16, businesses: 22, isolation: 10, transit: 10, surveillance: 8, network: 4, lighting: 3, time: 1 }
  },
  transit_first: {
    name: "Transit Connected",
    icon: "🚌",
    weights: { activity: 18, emergency: 18, businesses: 14, isolation: 12, transit: 18, surveillance: 10, network: 5, lighting: 3, time: 2 }
  }
};

interface WeightSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (newWeights: Record<string, number>) => void;
}

export const WeightSettingsModal: React.FC<WeightSettingsModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [weights, setWeights] = useState<Record<string, number>>({ ...DEFAULT_WEIGHTS });
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("aaroh_scoring_weights");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === "object" && parsed !== null) {
          setWeights((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // fallback to defaults
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = total === 100;

  const handleChange = (key: string, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleReset = () => {
    setWeights({ ...DEFAULT_WEIGHTS });
    setSaved(false);
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = PRESET_PROFILES[presetKey];
    if (preset) {
      setWeights({ ...preset.weights });
      setSaved(false);
    }
  };

  const handleSave = () => {
    if (!isValid) return;
    try {
      localStorage.setItem("aaroh_scoring_weights", JSON.stringify(weights));
      window.dispatchEvent(new CustomEvent("aaroh-weights-updated", { detail: weights }));
    } catch {
      // storage unavailable
    }
    setSaved(true);
    if (onApply) {
      onApply(weights);
    }
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#120822] border border-fuchsia-500/40 rounded-3xl shadow-[0_0_50px_rgba(217,70,239,0.35)] flex flex-col overflow-hidden text-[#f5edfc]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-fuchsia-500/20 bg-purple-950/40 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff1493] via-[#d946ef] to-[#a855f7] flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.4)]">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                Scoring Weight Profile
                <span className="text-xs text-[#ff1493] font-normal">🌸</span>
              </h2>
              <p className="text-[11px] text-fuchsia-300/80 font-medium">
                Tune how each environmental signal influences safety scoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                isValid
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              }`}
            >
              Total: {total}% {isValid ? "✓" : "≠ 100%"}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-fuchsia-300 hover:text-white hover:bg-fuchsia-500/20 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-fuchsia-500/20">
          {/* Preset Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-fuchsia-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff1493]" />
              Quick Tuning Presets:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(PRESET_PROFILES).map(([pKey, pVal]) => (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => handlePresetSelect(pKey)}
                  className="px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-[#a855f7]/25 border border-fuchsia-500/20 hover:border-[#ff1493] text-left transition flex items-center gap-2 cursor-pointer group"
                >
                  <span className="text-sm">{pVal.icon}</span>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white group-hover:text-fuchsia-200 truncate">
                      {pVal.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Weight Sliders List */}
          <div className="bg-purple-950/20 border border-fuchsia-500/20 rounded-2xl overflow-hidden divide-y divide-fuchsia-500/10">
            {Object.entries(weights).map(([key, val]) => {
              const meta = WEIGHT_META[key] || { label: key, icon: "⚙️", desc: "" };
              const pct = Math.min(100, (val / 30) * 100);
              return (
                <div key={key} className="p-3.5 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg leading-none">{meta.icon}</span>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-white block leading-tight">
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-fuchsia-300/60 block mt-0.5">
                          {meta.desc}
                        </span>
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-black text-[#ff1493] tabular-nums min-w-[2.5rem] text-right">
                      {val}%
                    </span>
                  </div>

                  {/* Range Slider */}
                  <div className="relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 left-0 h-2 rounded-full bg-gradient-to-r from-[#ff1493] to-[#d946ef] pointer-events-none transition-all duration-150"
                      style={{ width: `${pct}%` }}
                    />
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={val}
                      onChange={(e) => handleChange(key, parseInt(e.target.value) || 1)}
                      className="relative w-full h-2 bg-purple-950/70 border border-fuchsia-500/20 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,20,147,0.7)]
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
                </div>
              );
            })}
          </div>

          {/* Progress Bar and validation hint */}
          <div className="bg-purple-950/30 border border-fuchsia-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-fuchsia-300">Total Sum Allocation</span>
              <span className={isValid ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {total} / 100%
              </span>
            </div>
            <div className="h-2.5 w-full bg-purple-950/70 rounded-full overflow-hidden border border-fuchsia-500/20">
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
              <p className="text-[11px] text-rose-300">
                {total > 100
                  ? `Over allocation by ${total - 100}% — please reduce some sliders.`
                  : `Under allocation by ${100 - total}% — please increase some sliders.`}
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-fuchsia-500/20 bg-purple-950/40 backdrop-blur-xl flex gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-fuchsia-500/30 text-fuchsia-300 hover:text-white hover:border-[#ff1493] text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              saved
                ? "bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : isValid
                ? "bg-gradient-to-r from-[#ff1493] via-[#d946ef] to-[#a855f7] text-white shadow-[0_0_20px_rgba(255,20,147,0.4)] hover:opacity-95 active:scale-[0.99]"
                : "bg-purple-950/40 border border-fuchsia-500/20 text-fuchsia-500/40 cursor-not-allowed"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Profile Applied &amp; Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save &amp; Apply Weights</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
