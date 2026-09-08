"use client";

import React from "react";

interface LandingCanvasProps {
  children: React.ReactNode;
  className?: string;
  showBackgroundImage?: boolean;
}

/**
 * LandingCanvas:
 * Atmospheric viewport container featuring:
 * 1. Solid deep-plum background canvas (#0b0713)
 * 2. Background image '/assets/bg.png' stretched to fill viewport at 40% opacity (subtle, faded)
 * 3. Retro CRT TV filter: fine horizontal scanlines, analog phosphor glow, and moody color grading
 * 4. Classic curved monitor tube dark vignette around screen edges
 * 5. Three high-contrast ambient neon glow orbs (pink, amethyst, purple)
 */
export const LandingCanvas: React.FC<LandingCanvasProps> = ({
  children,
  className = "",
  showBackgroundImage = true,
}) => {
  return (
    <div
      className={`relative min-h-screen w-full bg-[#0b0713] text-[#f5edfc] overflow-hidden flex flex-col ${className}`}
    >
      {/* ── Layer 1: Background Image '/assets/bg.png' stretched to fill viewport at 40% opacity (optional) ── */}
      {showBackgroundImage && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
          <img
            src="/assets/bg.png"
            alt=""
            className="w-full h-full object-cover opacity-40 filter brightness-[0.85] contrast-[1.1] saturate-[0.75]"
            style={{ willChange: "transform" }}
          />
          {/* Subtle color grading tint over image */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0713]/40 via-transparent to-[#0b0713]/70 mix-blend-multiply" />
        </div>
      )}

      {/* ── Layer 2: Glowing Radial Gradient Orbs (Ambient Depth) ── */}
      {/* Top-Left: Neon Pink Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-[#ff1493]/20 blur-[120px] animate-pulse-glow z-1"
        style={{ willChange: "transform, opacity" }}
      />

      {/* Center: Electric Amethyst Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full bg-[#a855f7]/18 blur-[150px] animate-float-slow z-1"
        style={{ willChange: "transform, opacity" }}
      />

      {/* Bottom-Right: Deep Plum Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 w-[540px] h-[540px] rounded-full bg-[#7928ca]/25 blur-[140px] animate-pulse-glow z-1"
        style={{ animationDelay: "1.2s", willChange: "transform, opacity" }}
      />

      {/* ── Layer 3: Retro CRT TV Analog Phosphor Glow ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-2 crt-phosphor"
      />

      {/* ── Layer 4: Retro CRT Fine Horizontal Scanlines ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-3 crt-scanlines opacity-75"
      />

      {/* ── Layer 5: Dark Vignette simulating classic curved monitor tube ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-4 crt-vignette"
      />

      {/* ── Layer 6: Interactive Content Wrapper ── */}
      <div className="relative z-10 flex-1 flex flex-col w-full">{children}</div>
    </div>
  );
};

export default LandingCanvas;
