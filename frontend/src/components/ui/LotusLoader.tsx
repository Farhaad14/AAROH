"use client";

import React, { useEffect, useState } from "react";

interface LotusLoaderProps {
  isLoading: boolean;
  statusMessage?: string;
}

const DEFAULT_MESSAGES = [
  "Awakening environmental intelligence...",
  "Scanning street lighting & corridor density...",
  "Evaluating commercial footfall & open stores...",
  "Synthesizing safe, context-rich pathways...",
  "Blooming your mindful journey...",
];

/**
 * LotusLoader:
 * Full-screen loading overlay masking API latency with a blooming lotus SVG.
 * Scaled from 0.3 to 1.0, gently rotated 15 degrees, pulsing with a soft neon pink glow.
 */
export const LotusLoader: React.FC<LotusLoaderProps> = ({
  isLoading,
  statusMessage,
}) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#08040d]/85 backdrop-blur-xl transition-all duration-500 animate-fadeIn"
    >
      {/* Radiant ambient aura */}
      <div className="absolute w-72 h-72 rounded-full bg-[#ff1493]/20 blur-[90px] animate-pulse-glow pointer-events-none" />

      {/* ── Blooming Lotus Flower SVG ── */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 240 240"
          className="w-44 h-44 sm:w-56 sm:h-56 animate-lotus-bloom"
          style={{ willChange: "transform, filter, opacity" }}
        >
          <defs>
            <linearGradient id="lotusCenter" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ff1493" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#d946ef" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="lotusPetalOuter" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#3b0764" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f472b6" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="lotusPetalInner" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#701a75" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#fbcfe8" stopOpacity="1" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Underlay Pad */}
          <ellipse
            cx="120"
            cy="195"
            rx="65"
            ry="14"
            fill="#1e1136"
            stroke="#a855f7"
            strokeWidth="1"
            opacity="0.6"
          />

          {/* Outer Layer Left Petal 2 */}
          <path
            d="M 120 185 C 60 170 30 140 38 100 C 55 125 90 160 120 185 Z"
            fill="url(#lotusPetalOuter)"
            opacity="0.75"
          />
          {/* Outer Layer Right Petal 2 */}
          <path
            d="M 120 185 C 180 170 210 140 202 100 C 185 125 150 160 120 185 Z"
            fill="url(#lotusPetalOuter)"
            opacity="0.75"
          />

          {/* Outer Mid Left Petal */}
          <path
            d="M 120 185 C 75 160 55 110 70 70 C 85 105 105 150 120 185 Z"
            fill="url(#lotusPetalOuter)"
            opacity="0.85"
          />
          {/* Outer Mid Right Petal */}
          <path
            d="M 120 185 C 165 160 185 110 170 70 C 155 105 135 150 120 185 Z"
            fill="url(#lotusPetalOuter)"
            opacity="0.85"
          />

          {/* Inner Left Petal */}
          <path
            d="M 120 185 C 90 150 75 90 98 50 C 108 85 115 140 120 185 Z"
            fill="url(#lotusPetalInner)"
          />
          {/* Inner Right Petal */}
          <path
            d="M 120 185 C 150 150 165 90 142 50 C 132 85 125 140 120 185 Z"
            fill="url(#lotusPetalInner)"
          />

          {/* Center Upright Petal (Core Heart) */}
          <path
            d="M 120 185 C 102 135 104 70 120 35 C 136 70 138 135 120 185 Z"
            fill="url(#lotusCenter)"
            filter="url(#neonGlow)"
          />

          {/* Pistil Stamen Sparks */}
          <circle cx="120" cy="115" r="3.5" fill="#fef08a" />
          <circle cx="112" cy="122" r="2.5" fill="#fef08a" opacity="0.9" />
          <circle cx="128" cy="122" r="2.5" fill="#fef08a" opacity="0.9" />
          <circle cx="106" cy="132" r="2" fill="#fef08a" opacity="0.8" />
          <circle cx="134" cy="132" r="2" fill="#fef08a" opacity="0.8" />
        </svg>
      </div>

      {/* Status messaging with glowing text */}
      <div className="mt-8 text-center space-y-2 max-w-sm px-6">
        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#ff1493] via-[#d946ef] to-[#a855f7] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(217,70,239,0.5)]">
          AAROH Context Engine
        </h3>
        <p className="text-xs sm:text-sm text-fuchsia-200/80 font-medium tracking-wide transition-all duration-300">
          {statusMessage || DEFAULT_MESSAGES[msgIndex]}
        </p>
      </div>

      {/* Pulsing safe corridor indicator */}
      <div className="mt-6 flex items-center gap-2 px-3 py-1 rounded-full bg-[#150b26]/70 border border-[#d946ef]/30 shadow-fuchsia-glow">
        <span className="w-2 h-2 rounded-full bg-[#ff1493] animate-ping" />
        <span className="text-[11px] font-semibold text-fuchsia-300 uppercase tracking-wider">
          Harmonizing Context Layers
        </span>
      </div>
    </div>
  );
};

export default LotusLoader;
