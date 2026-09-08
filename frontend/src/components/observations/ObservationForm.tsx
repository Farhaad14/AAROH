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
    <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
      <h4 className="font-semibold text-slate-200 text-sm">Submit Field Observation</h4>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Observation Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 outline-none"
          >
            <option value="lighting">Street Lighting</option>
            <option value="activity">Public Activity</option>
            <option value="surveillance">Observed Surveillance</option>
            <option value="road_condition">Road Condition</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-medium">Observation Status</label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 outline-none"
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
        className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5"
      >
        <Send className="w-3.5 h-3.5" />
        {loading ? "Submitting..." : "Submit Observation"}
      </button>

      {msg && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/50">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}
    </form>
  );
};
