"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, ShieldCheck, MapPin, ArrowRight, Activity, Eye, Sun, Bus } from "lucide-react";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { TimeContextPicker } from "@/components/search/TimeContextPicker";
import { LocationSuggestion } from "@/lib/api";

/** Returns the current local time as "HH:MM" */
function getCurrentLocalTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function HomePage() {
  const router = useRouter();

  // Location text state
  const [origin, setOrigin] = useState("Noida Sector 62");
  const [destination, setDestination] = useState("Noida Sector 18");

  // Coordinate state — populated when user selects a Nominatim suggestion
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Time — default to live local time
  const [travelTime, setTravelTime] = useState<string>(getCurrentLocalTime());
  const [prioritySafety, setPrioritySafety] = useState(true);

  // Keep live time refreshed every minute so default is always current
  useEffect(() => {
    const interval = setInterval(() => {
      // Only update if user hasn't manually picked a different time
      // (TimeContextPicker handles this internally; here we just seed the initial value)
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const buildMapUrl = (
    originText: string,
    destText: string,
    oc: { lat: number; lng: number } | null,
    dc: { lat: number; lng: number } | null,
    time: string,
    priority: boolean
  ) => {
    const params = new URLSearchParams({
      origin: originText,
      dest: destText,
      time,
      priority: String(priority),
    });
    if (oc) {
      params.set("olat", String(oc.lat));
      params.set("olng", String(oc.lng));
    }
    if (dc) {
      params.set("dlat", String(dc.lat));
      params.set("dlng", String(dc.lng));
    }
    return `/map?${params.toString()}`;
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildMapUrl(origin, destination, originCoords, destCoords, travelTime, prioritySafety));
  };

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
    router.push(buildMapUrl(presetOrigin, presetDest, oc, dc, travelTime, prioritySafety));
  };

  const handleOriginSelect = (suggestion: LocationSuggestion) => {
    setOriginCoords({ lat: suggestion.lat, lng: suggestion.lng });
  };

  const handleDestSelect = (suggestion: LocationSuggestion) => {
    setDestCoords({ lat: suggestion.lat, lng: suggestion.lng });
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-950 text-slate-100">
      {/* Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Compass className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">AAROH</span>
              <span className="text-[10px] text-sky-400 font-semibold block -mt-1 tracking-widest uppercase">Context Navigation</span>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/map" className="hover:text-sky-400 transition">Interactive Map</Link>
            <Link href="/settings" className="hover:text-sky-400 transition">Settings</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-800/60 text-sky-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" /> Contextual Safety &amp; Environmental Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            Navigate with context, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400">
              not just directions.
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Understand how a route changes with time, open businesses, public activity, support availability, lighting, and mobile connectivity.
          </p>
        </div>

        {/* Route Analyzer Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-2xl mx-auto w-full">
          <form onSubmit={handleAnalyze} className="space-y-5">
            {/* Origin + Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LocationAutocomplete
                label="Origin Location"
                placeholder="Search any city, landmark, or street in India..."
                value={origin}
                onChange={(v) => {
                  setOrigin(v);
                  // Clear coords if user types manually (coordinates become stale)
                  setOriginCoords(null);
                }}
                onSelectSuggestion={handleOriginSelect}
                iconColor="text-emerald-400"
              />

              <LocationAutocomplete
                label="Destination"
                placeholder="Search destination anywhere in India..."
                value={destination}
                onChange={(v) => {
                  setDestination(v);
                  setDestCoords(null);
                }}
                onSelectSuggestion={handleDestSelect}
                iconColor="text-rose-400"
              />
            </div>

            {/* Time Context + Safety Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* TimeContextPicker — live time default + any-time input */}
              <TimeContextPicker
                value={travelTime}
                onChange={setTravelTime}
              />

              <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/60 rounded-xl px-4 py-3 mt-auto">
                <span className="text-xs font-medium text-slate-300">Prioritize Contextual Safety</span>
                <input
                  type="checkbox"
                  checked={prioritySafety}
                  onChange={(e) => setPrioritySafety(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-500 accent-sky-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Coordinate confirmation hint */}
            {(originCoords || destCoords) && (
              <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
                <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                <span>
                  {originCoords && destCoords
                    ? "Both locations pinned from map data"
                    : originCoords
                    ? "Origin pinned — select a destination suggestion to pin"
                    : "Destination pinned — select an origin suggestion to pin"}
                </span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-base rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 mt-2"
            >
              Analyze Route Context <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Presets */}
          <div className="pt-4 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-2">Quick Noida Demo Presets:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  handleQuickPreset(
                    "Sector 62, Noida",
                    "Sector 18, Noida",
                    { lat: 28.628, lng: 77.3639 },
                    { lat: 28.5705, lng: 77.3235 }
                  )
                }
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                Sector 62 → Sector 18
              </button>
              <button
                onClick={() =>
                  handleQuickPreset(
                    "Botanical Garden Metro",
                    "Noida Electronic City",
                    { lat: 28.5645, lng: 77.334 },
                    { lat: 28.6275, lng: 77.3735 }
                  )
                }
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                Botanical Garden → Electronic City
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto w-full pt-6">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <h4 className="font-bold text-slate-200 text-sm">Public Activity</h4>
            <p className="text-xs text-slate-400">Evaluates active POI density and transit corridor movement.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
            <Eye className="w-6 h-6 text-sky-400" />
            <h4 className="font-bold text-slate-200 text-sm">Estimated Surveillance</h4>
            <p className="text-xs text-slate-400">Infrastructure proxies including banks, ATMs, and police posts.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
            <Sun className="w-6 h-6 text-amber-400" />
            <h4 className="font-bold text-slate-200 text-sm">Street Lighting</h4>
            <p className="text-xs text-slate-400">Verified lighting density and user observation reports.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
            <Bus className="w-6 h-6 text-indigo-400" />
            <h4 className="font-bold text-slate-200 text-sm">Public Transport</h4>
            <p className="text-xs text-slate-400">GTFS transit stop schedule integration at travel hour.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-400 bg-slate-950">
        AAROH &copy; 2026. Environmental &amp; Contextual Navigation Platform.
      </footer>
    </div>
  );
}
