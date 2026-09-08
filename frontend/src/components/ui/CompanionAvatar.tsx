"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, Shield, Heart, X, ChevronUp } from "lucide-react";
import { getCompanionTip, sweetCoatAIFeedback } from "@/lib/sweetCoat";

export type CompanionMood = "happy" | "cautious" | "thinking";

interface CompanionAvatarProps {
  score?: number | null;
  statusText?: string;
  isEvaluating?: boolean;
}

export const CompanionAvatar: React.FC<CompanionAvatarProps> = ({
  score = 80,
  statusText,
  isEvaluating = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // State machine logic
  let mood: CompanionMood = "happy";
  if (isEvaluating) {
    mood = "thinking";
  } else if (score !== null && score !== undefined && score < 60) {
    mood = "cautious";
  } else {
    mood = "happy";
  }

  const moodConfig = {
    happy: {
      glow: "shadow-[0_0_30px_rgba(217,70,239,0.45)]",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      title: "Feeling Great 🌸",
      defaultTip: getCompanionTip(score || 80),
      auraColor: "rgba(168, 85, 247, 0.4)",
    },
    cautious: {
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.45)]",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      title: "Mindful Watch 🚨",
      defaultTip: getCompanionTip(score || 50),
      auraColor: "rgba(245, 158, 11, 0.35)",
    },
    thinking: {
      glow: "shadow-[0_0_30px_rgba(168,85,247,0.5)]",
      badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      title: "Synthesizing... ✨",
      defaultTip: "Carefully inspecting every streetlight and active spot along your path!",
      auraColor: "rgba(217, 70, 239, 0.45)",
    },
  }[mood];

  const displayMessage = statusText ? sweetCoatAIFeedback(statusText) : moodConfig.defaultTip;
  const shouldShowBubble = isOpen || isHovered;

  return (
    <aside
      aria-label="Aarohi AI Safety Companion"
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 font-sans pointer-events-auto select-none"
    >
      {/* ── Interactive Frosted-Glass Speech Bubble ── */}
      {shouldShowBubble && (
        <div
          role="dialog"
          aria-label="Aarohi Safety Advice"
          className="relative max-w-xs sm:max-w-sm w-full p-4 rounded-2xl bg-[#150b26]/90 backdrop-blur-xl border border-fuchsia-500/30 text-white shadow-2xl transition-all duration-300 transform origin-bottom-right"
          style={{
            boxShadow:
              mood === "cautious"
                ? "0 12px 35px rgba(245, 158, 11, 0.25), 0 0 20px rgba(217, 70, 239, 0.25)"
                : "0 12px 35px rgba(255, 20, 147, 0.25), 0 0 25px rgba(168, 85, 247, 0.25)",
          }}
        >
          {/* Close/Minimize button */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Minimize Aarohi advice"
            className="absolute top-3 right-3 text-fuchsia-300/60 hover:text-white p-1 rounded-full transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-2 pr-6">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#ff1493] via-[#d946ef] to-[#a855f7] flex items-center justify-center shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-bold text-white tracking-wide">Aarohi • Companion</span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${moodConfig.badgeBg}`}
            >
              {moodConfig.title}
            </span>
          </div>

          {/* Sweet-Coated Advice Message */}
          <p className="text-xs text-fuchsia-100/90 leading-relaxed break-words">
            {displayMessage}
          </p>

          {/* Footer mini indicator */}
          <div className="mt-2.5 pt-2 border-t border-fuchsia-500/20 flex items-center justify-between text-[10px] text-fuchsia-300/70">
            <span className="flex items-center gap-1 font-medium">
              <Shield className="w-3 h-3 text-[#ff1493]" />
              {score ? `Route Score: ${Math.round(score)}/100` : "Sensors Active"}
            </span>
            <span className="flex items-center gap-1 text-fuchsia-200">
              <Heart className="w-3 h-3 fill-[#ff1493] text-[#ff1493]" /> Always with you
            </span>
          </div>

          {/* Speech bubble arrow pointing toward avatar */}
          <div className="absolute -bottom-2 right-12 w-4 h-4 bg-[#150b26] border-r border-b border-fuchsia-500/30 rotate-45" />
        </div>
      )}

      {/* ── Aarohi Avatar Interactive Trigger & Character ── */}
      <div
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
        title="Aarohi - AI Safety Companion"
      >
        {/* Soft, desaturated neon-purple radial ambient glow behind avatar */}
        <div
          className="absolute -inset-4 rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-80 blur-xl"
          style={{
            background:
              "radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(217, 70, 239, 0.25) 50%, transparent 70%)",
          }}
        />

        {/* Floating & Breathing Avatar Container */}
        <div className="relative animate-avatar-breathe flex flex-col items-center">
          {/* Double-Ring Circular Window Outer Container */}
          <div className="relative p-1 rounded-full border border-purple-500/30 bg-purple-950/20 backdrop-blur-md shadow-[0_0_25px_rgba(217,70,239,0.35)] transition-transform duration-300 group-hover:scale-105 active:scale-95">
            {/* Inner Circular Window */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-fuchsia-500/40 bg-purple-950/40 backdrop-blur-md shadow-[0_0_20px_rgba(217,70,239,0.3)] flex items-center justify-center">
              <Image
                src="/assets/avatar.png?v=2"
                alt="Aarohi Safety Companion"
                fill
                sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                priority
                className="w-full h-full object-cover object-center filter drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              />
            </div>
          </div>

          {/* Mini Interactive Status Pill */}
          <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-[#150b26]/90 border border-fuchsia-500/30 text-[10px] font-semibold text-fuchsia-200 flex items-center gap-1 shadow-lg backdrop-blur-md">
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping"
              style={{
                backgroundColor:
                  mood === "cautious" ? "#f59e0b" : mood === "thinking" ? "#a855f7" : "#ff1493",
              }}
            />
            <span>Aarohi</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CompanionAvatar;

