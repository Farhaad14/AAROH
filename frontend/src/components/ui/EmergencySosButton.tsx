"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Radio,
  PhoneCall,
  MapPin,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Clock,
  Send,
  Users,
} from "lucide-react";

interface EmergencySosButtonProps {
  currentLocationName?: string;
  coords?: { lat: number; lng: number } | null;
}

export const EmergencySosButton: React.FC<EmergencySosButtonProps> = ({
  currentLocationName = "Shaheed Sthal, Ghaziabad",
  coords = { lat: 28.6706, lng: 77.4155 },
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const [dispatchCountdown, setDispatchCountdown] = useState(3);
  const [isMuted, setIsMuted] = useState(false);

  // Play simulated sound beacon when SOS is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && isDispatched && !isMuted && typeof window !== "undefined") {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const playBeep = () => {
            if (ctx.state === "suspended") ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.26);
          };
          playBeep();
          interval = setInterval(playBeep, 2000);
        }
      } catch {
        // audio context blocked or unsupported
      }
    }
    return () => clearInterval(interval);
  }, [isOpen, isDispatched, isMuted]);

  const handleTriggerSOS = () => {
    setIsOpen(true);
    setIsDispatched(false);
    setDispatchCountdown(3);

    const timer = setInterval(() => {
      setDispatchCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDispatched(true);
          return 0;
        }
        return prev - 1;
      });
    }, 800);
  };

  const handleCancelSOS = () => {
    setIsOpen(false);
    setIsDispatched(false);
  };

  return (
    <>
      {/* ── Floating SOS Emergency Corner Trigger (Refined Clean Shadow) ── */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center">
        <button
          type="button"
          onClick={handleTriggerSOS}
          className="relative flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-red-600 via-[#e11d48] to-[#ff1493] text-white font-bold text-xs sm:text-xs tracking-wider uppercase shadow-md shadow-black/50 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-150 border border-white/25 cursor-pointer"
          title="Emergency SOS Broadcast"
        >
          <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
          <span>SOS Emergency</span>
        </button>
      </div>

      {/* ── SOS Emergency Modal / Pop-Up Message ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={handleCancelSOS}
        >
          <div
            className="relative w-full max-w-lg bg-[#14081e] border border-red-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black text-[#f5edfc] space-y-5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-[#ff1493] flex items-center justify-center shadow-md">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                      AAROH Emergency SOS
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                      Live Beacon
                    </span>
                  </div>
                  <p className="text-xs text-rose-300/80">
                    Direct GPS telemetry broadcast to responders &amp; guardians
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-xl bg-purple-950/60 border border-fuchsia-500/30 text-fuchsia-300 hover:text-white transition cursor-pointer"
                  title={isMuted ? "Unmute beacon" : "Mute beacon"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-red-400" />}
                </button>
                <button
                  onClick={handleCancelSOS}
                  className="p-1.5 rounded-xl bg-purple-950/60 border border-fuchsia-500/30 text-fuchsia-300 hover:text-white transition cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status Broadcast Screen */}
            <div className="relative z-10 space-y-4">
              {!isDispatched ? (
                /* Connecting handshake phase */
                <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/30 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Dispatching Emergency Signal in {dispatchCountdown}s...
                    </h3>
                    <p className="text-xs text-rose-300/70 mt-1">
                      Locking nearest PCR patrol unit and broadcasting GPS coordinates
                    </p>
                  </div>
                  <button
                    onClick={handleCancelSOS}
                    className="px-4 py-1.5 rounded-xl bg-purple-950/60 border border-fuchsia-500/30 text-xs font-bold text-fuchsia-200 hover:text-white hover:border-red-400 transition"
                  >
                    Cancel Alert
                  </button>
                </div>
              ) : (
                /* Dispatched and Active confirmation */
                <div className="space-y-3.5">
                  {/* Big Confirmation Card */}
                  <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>SOS Alert Sent! Help is on the way.</span>
                    </div>
                    <p className="text-xs text-fuchsia-100/90 leading-relaxed">
                      Emergency response units and your pre-configured safety circle have been
                      dispatched with your exact live tracking corridor.
                    </p>
                  </div>

                  {/* Telemetry Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-purple-950/40 border border-fuchsia-500/20 space-y-1">
                      <span className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#ff1493]" />
                        Live Pinned Location
                      </span>
                      <p className="font-semibold text-white truncate">{currentLocationName}</p>
                      <p className="text-[10px] font-mono text-fuchsia-400/80">
                        {coords ? `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E` : "GPS Locked"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-950/40 border border-fuchsia-500/20 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Response Unit Status
                      </span>
                      <p className="font-semibold text-white">PCR Patrol Assigned</p>
                      <p className="text-[10px] font-semibold text-emerald-300">
                        En route • ETA ~3 to 5 mins
                      </p>
                    </div>
                  </div>

                  {/* Trusted contacts broadcast banner */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-fuchsia-500/20 text-xs">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#d946ef]" />
                      <span className="text-fuchsia-200">
                        Guardian SMS &amp; Live Map: <strong className="text-white">Broadcasted (3 Contacts)</strong>
                      </span>
                    </div>
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              )}

              {/* Direct Emergency Call Shortcuts */}
              <div className="pt-2 border-t border-fuchsia-500/20 space-y-2">
                <span className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider block">
                  Immediate Emergency Hotlines:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="tel:112"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 hover:border-red-400 text-center transition group cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-xs font-black text-white">112</span>
                    <span className="text-[9px] text-red-200/80">National SOS</span>
                  </a>

                  <a
                    href="tel:1091"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-fuchsia-500/30 hover:border-[#ff1493] text-center transition group cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#ff1493] group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-xs font-black text-white">1091</span>
                    <span className="text-[9px] text-fuchsia-200/80">Women Helpline</span>
                  </a>

                  <a
                    href="tel:100"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 hover:border-blue-400 text-center transition group cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform mb-0.5" />
                    <span className="text-xs font-black text-white">100</span>
                    <span className="text-[9px] text-blue-200/80">Police PCR</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-1 border-t border-fuchsia-500/20 relative z-10">
              <button
                type="button"
                onClick={handleCancelSOS}
                className="flex-1 py-2 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-fuchsia-500/30 text-xs font-bold text-fuchsia-200 hover:text-white transition cursor-pointer"
              >
                Dismiss / False Alarm
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-600 via-[#e11d48] to-[#ff1493] text-white text-xs font-black hover:opacity-95 transition cursor-pointer"
              >
                Keep Active Beacon
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
