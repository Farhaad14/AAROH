"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Navigation, ShieldCheck } from "lucide-react";

export default function SingleRoutePage() {
  const params = useParams();
  const routeId = params.id as string;

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/map" className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-bold text-2xl">Route Detail Inspector</h1>
          <p className="text-xs text-slate-400">Route ID: {routeId}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-lg">Main Highway Corridor</h3>
          </div>
          <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold text-xs rounded-lg">
            High Confidence
          </span>
        </div>

        <p className="text-sm text-slate-300">
          This route exhibits strong ambient lighting, active open commercial establishments, and close proximity to emergency support facilities.
        </p>

        <Link
          href="/map"
          className="inline-block py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-xs rounded-xl transition"
        >
          View Full Interactive Map
        </Link>
      </div>
    </div>
  );
}
