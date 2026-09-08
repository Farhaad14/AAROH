"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sliders, Shield, Database, Cpu } from "lucide-react";

export default function SettingsPage() {
  const [weights, setWeights] = useState({
    activity: 18,
    businesses: 12,
    emergency: 15,
    time: 8,
    isolation: 15,
    surveillance: 7,
    network: 10,
    transit: 7,
    lighting: 8,
  });

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/map" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-bold text-2xl">AAROH Engine Settings</h1>
          <p className="text-xs text-slate-400">Configure Context Layer Weights & Spatial API Parameters</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-base text-slate-200">Context Weight Matrix</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total: 100%</span>
        </div>

        <div className="space-y-4">
          {Object.entries(weights).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs capitalize font-medium text-slate-300">
                <span>{key.replace("_", " ")}</span>
                <span className="text-sky-400 font-bold">{val}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={val}
                onChange={(e) => setWeights({ ...weights, [key]: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button className="px-4 py-2 bg-sky-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-sky-400 transition">
            Save Weight Profile
          </button>
        </div>
      </div>
    </div>
  );
}
