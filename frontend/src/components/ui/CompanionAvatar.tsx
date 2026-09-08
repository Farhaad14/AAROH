"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, Shield, Heart, X } from "lucide-react";
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
      badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      title: "Feeling Great 🌸",
      defaultTip: getCompanionTip(score || 80),
    },
    cautious: {
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      title: "Mindful Watch 🚨",
      defaultTip: getCompanionTip(score || 50),
    },
    thinking: {
      badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      title: "Synthesizing... ✨",
      defaultTip: "Carefully inspecting every streetlight and active spot along your path!",
    },
  }[mood];

  const displayMessage = statusText ? sweetCoatAIFeedback(statusText) : moodConfig.defaultTip;
  const shouldShowBubble = isOpen || isHovered;

  return (
    <aside
      aria-label="Aarohi AI Safety Companion"
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 font-sans pointer-events-auto select-none"
    >
      {/* ── Frosted-Glass Speech Bubble (Clean & Subtle Shadow) ── */}
      {shouldShowBubble && (
        <div
          role="dialog"
          aria-label="Aarohi Safety Advice"
          className="relative max-w-xs sm:max-w-sm w-full p-4 rounded-2xl bg-[#150b26]/95 backdrop-blur-xl border border-fuchsia-500/25 text-white shadow-lg shadow-black/40 transition-all duration-200 transform origin-bottom-right"
        >
          {/* Close/Minimize button */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Minimize Aarohi advice"
            className="absolute top-3 right-3 text-fuchsia-300/60 hover:text-white p-1 rounded-full transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-2 pr-6">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#ff1493] via-[#d946ef] to-[#a855f7] flex items-center justify-center">
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
          <div className="absolute -bottom-2 right-12 w-4 h-4 bg-[#150b26] border-r border-b border-fuchsia-500/25 rotate-45" />
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
        {/* Floating & Breathing Avatar Container */}
        <div className="relative animate-avatar-breathe flex flex-col items-center">
          {/* Circular Window Outer Container */}
          <div className="relative p-0.5 rounded-full border border-purple-500/30 bg-purple-950/30 backdrop-blur-md transition-transform duration-200 group-hover:scale-105 active:scale-95 shadow-md shadow-black/40">
            {/* Inner Circular Window */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border border-fuchsia-500/30 bg-purple-950/40 backdrop-blur-md flex items-center justify-center">
              <Image
                src="/assets/avatar.png"
                alt="Aarohi Safety Companion"
                fill
                sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
                priority
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* Mini Interactive Status Pill */}
          <div className="absolute -bottom-1 px-2.5 py-0.5 rounded-full bg-[#150b26]/95 border border-fuchsia-500/30 text-[10px] font-semibold text-fuchsia-200 flex items-center gap-1 shadow-sm backdrop-blur-md">
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
