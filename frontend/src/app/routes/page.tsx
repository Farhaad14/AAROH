"use client";

import React from "react";
import Link from "next/link";
import { Compass, MapPin, ArrowLeft } from "lucide-react";

export default function RoutesOverviewPage() {
  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-bold text-2xl">Saved Routes & History</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
        <Compass className="w-12 h-12 text-sky-400 mx-auto opacity-80" />
        <h3 className="font-semibold text-lg text-slate-200">No Saved Custom Routes Yet</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Start by launching an interactive route analysis on the map to evaluate contextual safety factors and save your preferred travel corridors.
        </p>
        <Link
          href="/map"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-sky-400 transition"
        >
          Open Map Analyzer <MapPin className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
