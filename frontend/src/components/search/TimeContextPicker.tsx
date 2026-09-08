"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, Radio } from "lucide-react";

interface TimeContextPickerProps {
  /** Current selected time in "HH:MM" format */
  value: string;
  /** Called when user changes time */
  onChange: (time: string) => void;
  /** Optional compact mode for top-bar usage */
  compact?: boolean;
}

/** Returns the current local time as "HH:MM" */
function getCurrentLocalTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Returns a friendly label for a given HH:MM string */
function getTimeLabel(timeStr: string): string {
  const [h] = timeStr.split(":").map(Number);
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  if (h >= 21 || h < 2) return "Night";
  return "Late Night";
}

export const TimeContextPicker: React.FC<TimeContextPickerProps> = ({
  value,
  onChange,
  compact = false,
}) => {
  const [liveTime, setLiveTime] = useState(getCurrentLocalTime());
  const [isLive, setIsLive] = useState(false);

  // Refresh live time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const t = getCurrentLocalTime();
      setLiveTime(t);
      // If live mode is on, auto-sync
      if (isLive) {
        onChange(t);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [isLive, onChange]);

  const handleUseLive = useCallback(() => {
    const t = getCurrentLocalTime();
    setLiveTime(t);
    setIsLive(true);
    onChange(t);
  }, [onChange]);

  const handleManualChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsLive(false);
      onChange(e.target.value);
    },
    [onChange]
  );

  if (compact) {
    // Compact version for top header bar
    return (
      <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5">
        <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <input
          type="time"
          value={value}
          onChange={handleManualChange}
          className="bg-transparent text-slate-100 text-xs font-semibold w-[72px] focus:outline-none cursor-pointer"
          title="Change travel time context"
        />
        <button
          onClick={handleUseLive}
          title={`Snap to your current time (${liveTime})`}
          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition border ${
            isLive
              ? "bg-sky-500/20 text-sky-300 border-sky-500/50"
              : "text-slate-400 border-slate-600 hover:text-sky-300 hover:border-sky-500/50"
          }`}
        >
          <Radio className="w-2.5 h-2.5" />
          {isLive ? "Live" : "Use Live"}
        </button>
      </div>
    );
  }

  // Full version for homepage / sidebar
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-sky-400" />
        Travel Time Context
      </label>

      <div className="flex items-center gap-2">
        {/* Native time input */}
        <div className="relative flex-1">
          <input
            type="time"
            value={value}
            onChange={handleManualChange}
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-semibold text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition cursor-pointer appearance-none"
          />
          {/* Time label overlay */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 pointer-events-none">
            {getTimeLabel(value)}
          </span>
        </div>

        {/* Live Time button */}
        <button
          onClick={handleUseLive}
          title={`Use your current device time: ${liveTime}`}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition shrink-0 ${
            isLive
              ? "bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-inner"
              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-sky-300 hover:border-sky-500/50 hover:bg-slate-800"
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isLive ? "animate-pulse" : ""}`} />
          {isLive ? (
            <span className="flex flex-col leading-none items-start">
              <span>Live</span>
              <span className="text-[9px] font-normal text-sky-400/70 mt-0.5">{liveTime}</span>
            </span>
          ) : (
            <span>Live Time</span>
          )}
        </button>
      </div>

      {/* Context hint */}
      <p className="text-[11px] text-slate-500 pl-0.5">
        {isLive
          ? `Using your current local time · Updates automatically`
          : `Manual override · Live time is ${liveTime}`}
      </p>
    </div>
  );
};
