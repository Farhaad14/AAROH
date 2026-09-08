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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08040d]/80 backdrop-blur-md">
      <div className="bg-[#150b26]/95 border border-[#d946ef]/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans shadow-fuchsia-glow">
        <div className="flex items-center justify-between border-b border-[#d946ef]/20 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#ff1493]" />
            <h3 className="font-bold text-white text-lg">Segment #{segment.segment_index}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-fuchsia-300 hover:text-white rounded-lg hover:bg-[#a855f7]/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between bg-[#08040d]/60 border border-[#d946ef]/20 p-3.5 rounded-2xl">
          <div>
            <span className="text-xs text-fuchsia-300/70">Segment Length</span>
            <p className="font-bold text-white text-sm">{segment.length_m} meters</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-fuchsia-300/70">Context Score</span>
            <p
              className={`font-black text-xl ${
                segment.segment_score >= 75
                  ? "text-[#ff1493]"
                  : segment.segment_score >= 60
                  ? "text-fuchsia-300"
                  : "text-slate-400"
              }`}
            >
              {Math.round(segment.segment_score)} / 100
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-xs text-fuchsia-200 uppercase tracking-wider mb-2">Evaluated Context</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#08040d]/50 border border-[#d946ef]/15 p-2 rounded-xl">
              <span className="text-fuchsia-300/70">Activity Proxy:</span>{" "}
              <span className="font-bold text-white">{Math.round(segment.scores.activity)}</span>
            </div>
            <div className="bg-[#08040d]/50 border border-[#d946ef]/15 p-2 rounded-xl">
              <span className="text-fuchsia-300/70">Open Businesses:</span>{" "}
              <span className="font-bold text-white">{Math.round(segment.scores.businesses)}</span>
            </div>
            <div className="bg-[#08040d]/50 border border-[#d946ef]/15 p-2 rounded-xl">
              <span className="text-fuchsia-300/70">Emergency Support:</span>{" "}
              <span className="font-bold text-white">{Math.round(segment.scores.emergency)}</span>
            </div>
            <div className="bg-[#08040d]/50 border border-[#d946ef]/15 p-2 rounded-xl">
              <span className="text-fuchsia-300/70">Surveillance:</span>{" "}
              <span className="font-bold text-white">{Math.round(segment.scores.surveillance)}</span>
            </div>
            <div className="bg-[#08040d]/50 border border-[#d946ef]/15 p-2 rounded-xl">
              <span className="text-fuchsia-300/70">Transit Active:</span>{" "}
              <span className="font-bold text-white">{Math.round(segment.scores.transit)}</span>
            </div>
            <div className="bg-[#08040d]/50 border border-[#d946ef]/15 p-2 rounded-xl">
              <span className="text-fuchsia-300/70">Street Lighting:</span>{" "}
              <span className="font-bold text-white">{Math.round(segment.scores.lighting)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-xs text-fuchsia-200 uppercase tracking-wider mb-2">Segment Rationale</h4>
          <ul className="space-y-1.5 text-xs text-fuchsia-100/90">
            {segment.reasons.map((r, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#d946ef] shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-[#ff1493] to-[#d946ef] hover:from-[#ff1493]/90 hover:to-[#d946ef]/90 text-white rounded-xl font-bold text-xs transition shadow-pink-glow-strong"
        >
          Close Segment Details
        </button>
      </div>
    </div>
  );
};
