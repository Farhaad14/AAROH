"use client";

import React, { useState } from "react";
import { submitObservation } from "@/lib/api";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

interface ObservationFormProps {
  segmentId?: string;
  onSuccess?: () => void;
}

export const ObservationForm: React.FC<ObservationFormProps> = ({ segmentId, onSuccess }) => {
  const [type, setType] = useState<string>("lighting");
  const [value, setValue] = useState<string>("poor");
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await submitObservation({
        segment_id: segmentId,
        type,
        value,
      });
      setMsg(res.message);
      if (onSuccess) onSuccess();
    } catch (err) {
      setMsg("Failed to record observation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#150b26]/80 border border-[#d946ef]/25 p-4 rounded-2xl space-y-3 font-sans shadow-fuchsia-glow">
      <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
        <span>🌸 Submit Ground-Truth Observation</span>
      </h4>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-fuchsia-300/80 mb-1 font-medium text-[11px]">Observation Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-[#08040d]/80 border border-[#d946ef]/30 text-fuchsia-100 rounded-xl p-2 focus:ring-1 focus:ring-[#ff1493] outline-none"
          >
            <option value="lighting">Street Lighting</option>
            <option value="activity">Public Activity</option>
            <option value="surveillance">Observed Surveillance</option>
            <option value="road_condition">Road Condition</option>
          </select>
        </div>

        <div>
          <label className="block text-fuchsia-300/80 mb-1 font-medium text-[11px]">Observation Status</label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-[#08040d]/80 border border-[#d946ef]/30 text-fuchsia-100 rounded-xl p-2 focus:ring-1 focus:ring-[#ff1493] outline-none"
          >
            {type === "lighting" && (
              <>
                <option value="good">Good Lighting</option>
                <option value="poor">Poor Lighting</option>
                <option value="not_working">Light Outage</option>
              </>
            )}
            {type === "activity" && (
              <>
                <option value="busy">Busy / High Footfall</option>
                <option value="moderate">Moderate Activity</option>
                <option value="quiet">Quiet / Isolated</option>
              </>
            )}
            {type === "surveillance" && (
              <>
                <option value="observed">Observed Camera / Security</option>
              </>
            )}
            {type === "road_condition" && (
              <>
                <option value="clear">Clear Road</option>
                <option value="blocked">Road Blocked</option>
                <option value="construction">Under Construction</option>
              </>
            )}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-gradient-to-r from-[#ff1493] to-[#d946ef] hover:from-[#ff1493]/90 hover:to-[#d946ef]/90 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-fuchsia-glow flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Send className="w-3.5 h-3.5" />
        {loading ? "Submitting..." : "Submit Observation"}
      </button>

      {msg && (
        <div className="flex items-center gap-1.5 text-xs text-pink-300 mt-2 bg-[#ff1493]/15 p-2 rounded-xl border border-[#ff1493]/40">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#ff1493]" />
          <span>{msg}</span>
        </div>
      )}
    </form>
  );
};
