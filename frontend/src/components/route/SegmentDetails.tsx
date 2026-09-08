"use client";

import React from "react";
import { SegmentDetail } from "@/types/route";
import { X, AlertCircle, ShieldCheck, MapPin } from "lucide-react";

interface SegmentDetailsProps {
  segment: SegmentDetail | null;
  onClose: () => void;
}

export const SegmentDetails: React.FC<SegmentDetailsProps> = ({ segment, onClose }) => {
  if (!segment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-slate-100 text-lg">Segment #{segment.segment_index}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between bg-slate-800/80 p-3.5 rounded-xl">
          <div>
            <span className="text-xs text-slate-400">Segment Length</span>
            <p className="font-semibold text-slate-200 text-sm">{segment.length_m} meters</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Context Score</span>
            <p
              className={`font-bold text-xl ${
                segment.segment_score >= 70
                  ? "text-emerald-400"
                  : segment.segment_score >= 55
                  ? "text-sky-400"
                  : "text-amber-400"
              }`}
            >
              {Math.round(segment.segment_score)} / 100
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-2">Evaluated Context</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/50 p-2 rounded-lg">
              <span className="text-slate-400">Activity Proxy:</span>{" "}
              <span className="font-bold text-slate-200">{Math.round(segment.scores.activity)}</span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded-lg">
              <span className="text-slate-400">Open Businesses:</span>{" "}
              <span className="font-bold text-slate-200">{Math.round(segment.scores.businesses)}</span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded-lg">
              <span className="text-slate-400">Emergency Support:</span>{" "}
              <span className="font-bold text-slate-200">{Math.round(segment.scores.emergency)}</span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded-lg">
              <span className="text-slate-400">Surveillance Estimate:</span>{" "}
              <span className="font-bold text-slate-200">{Math.round(segment.scores.surveillance)}</span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded-lg">
              <span className="text-slate-400">Transit Operating:</span>{" "}
              <span className="font-bold text-slate-200">{Math.round(segment.scores.transit)}</span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded-lg">
              <span className="text-slate-400">Street Lighting:</span>{" "}
              <span className="font-bold text-slate-200">{Math.round(segment.scores.lighting)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider mb-2">Segment Rationale</h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {segment.reasons.map((r, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {segment.provenance && (
          <div className="border-t border-slate-800 pt-2 space-y-1.5">
            <h4 className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider">Data Provenance</h4>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {Object.entries(segment.provenance).map(([factor, meta]: [string, any]) => (
                <span key={factor} className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700/50">
                  <span className="text-slate-400 capitalize">{factor}:</span>{" "}
                  <span className={meta?.status === "observed" ? "text-emerald-400" : meta?.status === "demo_fallback" ? "text-amber-400" : "text-sky-400"}>
                    {meta?.source || meta?.status || "inferred"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs transition"
        >
          Close Segment Details
        </button>
      </div>
    </div>
  );
};
