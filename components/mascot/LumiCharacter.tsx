"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { LumiAnimationMode } from "./LumiContext";

interface LumiCharacterProps {
  mode?: LumiAnimationMode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
  onHover?: () => void;
  onClick?: () => void;
  showSpeechBubble?: boolean;
  speechText?: string;
  className?: string;
}

export function LumiCharacter({
  mode = "idle",
  size = "md",
  interactive = true,
  onHover,
  onClick,
  showSpeechBubble = false,
  speechText,
  className = "",
}: LumiCharacterProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Periodic natural blinking in idle mode
  useEffect(() => {
    if (mode !== "idle" && mode !== "reading") return;

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(blinkInterval);
  }, [mode]);

  // Dimensions based on size
  const sizeMap = {
    xs: { width: 44, height: 47, container: "w-11 h-12" },
    sm: { width: 72, height: 77, container: "w-[72px] h-[77px]" },
    md: { width: 130, height: 138, container: "w-[130px] h-[138px]" },
    lg: { width: 220, height: 234, container: "w-[220px] h-[234px]" },
    xl: { width: 320, height: 341, container: "w-[320px] h-[341px]" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Active animation mode (if hovered in idle, give a friendly greeting tilt)
  const effectiveMode = isHovered && mode === "idle" ? "greeting" : mode;

  // Mode-based physics and transform classes
  const getPhysicsClasses = () => {
    switch (effectiveMode) {
      case "greeting":
        return "animate-lumi-wave scale-105";
      case "thinking":
        return "animate-lumi-think -rotate-3 translate-y-[-4px]";
      case "explaining":
        return "animate-lumi-explain";
      case "listening":
        return "animate-lumi-listen scale-105";
      case "celebration":
        return "animate-lumi-jump scale-110";
      case "encouragement":
        return "animate-lumi-reassure rotate-3";
      case "reading":
        return "animate-lumi-read translate-y-[2px]";
      case "analysis":
        return "animate-lumi-scan";
      case "goodbye":
        return "animate-lumi-wave translate-y-[8px] opacity-80";
      case "idle":
      default:
        return "animate-lumi-float";
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${currentSize.container} ${className}`}
      onMouseEnter={() => {
        setIsHovered(true);
        if (onHover) onHover();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        cursor: interactive ? "pointer" : "default",
      }}
    >
      {/* 1. Ambient Lavender Rim Glow Aura */}
      <div
        className={`absolute inset-0 rounded-full blur-xl pointer-events-none transition-all duration-700 ${
          effectiveMode === "celebration"
            ? "bg-gradient-to-tr from-amber-400/40 via-purple-500/40 to-indigo-500/40 scale-125"
            : effectiveMode === "listening"
            ? "bg-purple-500/35 scale-120 animate-pulse"
            : effectiveMode === "thinking"
            ? "bg-indigo-500/30 scale-110"
            : "bg-purple-500/20 scale-100"
        }`}
      />

      {/* 2. Concentric Sound Wave Rings (Listening Mode) */}
      {effectiveMode === "listening" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="absolute w-[120%] h-[120%] rounded-full border border-purple-400/60 animate-ping opacity-75" />
          <span className="absolute w-[140%] h-[140%] rounded-full border border-indigo-400/40 animate-ping [animation-delay:200ms] opacity-50" />
          <span className="absolute w-[160%] h-[160%] rounded-full border border-purple-300/30 animate-ping [animation-delay:400ms] opacity-30" />
        </div>
      )}

      {/* 3. Floating Thinking Dots (Thinking Mode) */}
      {effectiveMode === "thinking" && (
        <div className="absolute -top-3 right-6 flex items-center gap-1.5 pointer-events-none z-20">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms] shadow-sm shadow-purple-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:150ms] shadow-sm shadow-indigo-300/80" />
          <span className="w-3 h-3 rounded-full bg-purple-200 animate-bounce [animation-delay:300ms] shadow-sm shadow-purple-200/80" />
        </div>
      )}

      {/* 4. Celebration Confetti & Gold Sparkles (Celebration Mode) */}
      {effectiveMode === "celebration" && (
        <div className="absolute inset-0 -top-6 pointer-events-none z-20 overflow-visible flex items-center justify-center">
          <span className="absolute -top-4 -left-2 text-amber-400 text-xs animate-ping font-bold">✦</span>
          <span className="absolute -top-6 right-2 text-purple-300 text-sm animate-bounce font-bold">★</span>
          <span className="absolute -bottom-2 -left-3 text-indigo-400 text-xs animate-pulse font-bold">✦</span>
          <span className="absolute top-2 -right-4 text-amber-300 text-xs animate-ping font-bold">✨</span>
          <span className="absolute w-2 h-2 bg-purple-400 rounded-full -top-3 left-4 animate-ping" />
          <span className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full top-4 -left-4 animate-bounce" />
          <span className="absolute w-2 h-2 bg-indigo-400 rounded-full -top-2 -right-2 animate-pulse" />
        </div>
      )}

      {/* 5. Holographic Progress Chart (Analysis Mode) */}
      {effectiveMode === "analysis" && (
        <div className="absolute -top-4 -right-12 z-20 pointer-events-none bg-slate-950/80 backdrop-blur-md border border-purple-500/80 rounded-xl p-1.5 shadow-lg shadow-purple-500/30 animate-in fade-in zoom-in-75">
          <div className="flex items-end gap-1 h-6 px-1">
            <span className="w-1.5 h-3 bg-purple-400 rounded-xs animate-pulse" />
            <span className="w-1.5 h-5 bg-indigo-400 rounded-xs animate-pulse [animation-delay:100ms]" />
            <span className="w-1.5 h-4 bg-emerald-400 rounded-xs animate-pulse [animation-delay:200ms]" />
            <span className="w-1.5 h-6 bg-amber-400 rounded-xs animate-pulse [animation-delay:300ms]" />
          </div>
          <span className="text-[7px] font-mono text-purple-200 font-bold uppercase tracking-wider block text-center mt-0.5">
            Analysis
          </span>
        </div>
      )}

      {/* 6. Master Character 3D Body (Preserved 100% across all states) */}
      <div
        className={`relative w-full h-full transition-transform duration-500 ease-out will-change-transform ${getPhysicsClasses()}`}
      >
        <Image
          src="/images/lumi/lumi-master.png"
          alt="Lumi - LearnLync AI Companion"
          width={currentSize.width}
          height={currentSize.height}
          priority
          className="w-full h-full object-contain drop-shadow-md select-none"
        />

        {/* 7. Dynamic Digital Screen Facial Expressions Overlay */}
        {/* Screen coordinates: positioned exactly over Lumi's digital visor */}
        <div
          className="absolute pointer-events-none flex items-center justify-center transition-opacity duration-300"
          style={{
            top: "16%",
            left: "38%",
            width: "42%",
            height: "26%",
          }}
        >
          {/* Eyes & Mouth Vector Expression */}
          <svg
            viewBox="0 0 100 65"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="lumiGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {isBlinking ? (
              // Blink Expression (thin horizontal glow lines)
              <g filter="url(#lumiGlow)" stroke="#e9d5ff" strokeWidth="4.5" strokeLinecap="round">
                <line x1="20" y1="28" x2="42" y2="28" />
                <line x1="58" y1="28" x2="80" y2="28" />
              </g>
            ) : effectiveMode === "celebration" ? (
              // Celebration Expression (> < joyful arcs + blush)
              <g filter="url(#lumiGlow)">
                <path
                  d="M18 20L34 28L18 36"
                  stroke="#fbbf24"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M82 20L66 28L82 36"
                  stroke="#fbbf24"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="50" cy="46" r="6" fill="#e9d5ff" />
              </g>
            ) : effectiveMode === "thinking" ? (
              // Thinking Expression (upward slanted curious eyes)
              <g filter="url(#lumiGlow)">
                <ellipse cx="28" cy="22" rx="7" ry="9" fill="#c084fc" />
                <ellipse cx="68" cy="22" rx="7" ry="9" fill="#c084fc" />
                <ellipse cx="30" cy="20" rx="3" ry="4" fill="#ffffff" />
                <ellipse cx="70" cy="20" rx="3" ry="4" fill="#ffffff" />
                <path
                  d="M45 44Q50 40 55 44"
                  stroke="#e9d5ff"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </g>
            ) : effectiveMode === "listening" ? (
              // Listening Expression (wide attentive eyes with cyan/lavender glow)
              <g filter="url(#lumiGlow)">
                <ellipse cx="28" cy="28" rx="9" ry="11" fill="#c084fc" />
                <ellipse cx="72" cy="28" rx="9" ry="11" fill="#c084fc" />
                <circle cx="28" cy="27" r="4" fill="#ffffff" />
                <circle cx="72" cy="27" r="4" fill="#ffffff" />
                <ellipse cx="50" cy="48" rx="4" ry="3" fill="#e9d5ff" />
              </g>
            ) : effectiveMode === "encouragement" ? (
              // Encouragement Expression (gentle caring eyes and reassuring smile)
              <g filter="url(#lumiGlow)">
                <path
                  d="M18 24Q30 16 42 24"
                  stroke="#c084fc"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M58 24Q70 16 82 24"
                  stroke="#c084fc"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M44 42Q50 49 56 42"
                  stroke="#e9d5ff"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            ) : effectiveMode === "analysis" ? (
              // Analysis Expression (tech HUD reticle eyes)
              <g filter="url(#lumiGlow)">
                <circle cx="28" cy="26" r="8" stroke="#a855f7" strokeWidth="2.5" />
                <circle cx="28" cy="26" r="3.5" fill="#38bdf8" />
                <circle cx="72" cy="26" r="8" stroke="#a855f7" strokeWidth="2.5" />
                <circle cx="72" cy="26" r="3.5" fill="#38bdf8" />
                <line x1="16" y1="26" x2="84" y2="26" stroke="#c084fc" strokeWidth="1" strokeDasharray="3 2" />
                <rect x="44" y="44" width="12" height="3" rx="1.5" fill="#e9d5ff" />
              </g>
            ) : effectiveMode === "reading" ? (
              // Reading Expression (downward directed focus)
              <g filter="url(#lumiGlow)">
                <path
                  d="M20 30Q30 38 40 30"
                  stroke="#c084fc"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <path
                  d="M60 30Q70 38 80 30"
                  stroke="#c084fc"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="46" r="3" fill="#e9d5ff" />
              </g>
            ) : (
              // Default Greeting & Idle Expression (Happy curved eyes with blush + smile)
              <g filter="url(#lumiGlow)">
                <path
                  d="M18 26Q30 14 42 26"
                  stroke="#c084fc"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                <path
                  d="M58 26Q70 14 82 26"
                  stroke="#c084fc"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                {/* Glowing Blush Marks */}
                <line x1="12" y1="36" x2="16" y2="42" stroke="#e879f9" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="18" y1="36" x2="22" y2="42" stroke="#e879f9" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="78" y1="36" x2="82" y2="42" stroke="#e879f9" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="84" y1="36" x2="88" y2="42" stroke="#e879f9" strokeWidth="2.5" strokeLinecap="round" />
                {/* Smiling Open Mouth */}
                <path
                  d="M42 42Q50 54 58 42Z"
                  fill="#e9d5ff"
                />
              </g>
            )}
          </svg>
        </div>

        {/* 8. Pulsing Chest Light Glow (Synchronized with State) */}
        <div
          className={`absolute pointer-events-none rounded-full blur-xs transition-opacity duration-500 ${
            effectiveMode === "thinking"
              ? "opacity-90 animate-pulse bg-indigo-400"
              : effectiveMode === "listening"
              ? "opacity-95 animate-pulse bg-purple-400"
              : effectiveMode === "celebration"
              ? "opacity-100 bg-amber-400"
              : "opacity-40 bg-purple-400"
          }`}
          style={{
            top: "60%",
            left: "54%",
            width: "12%",
            height: "8%",
          }}
        />
      </div>

      {/* 9. Speech Bubble */}
      {showSpeechBubble && speechText && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-bold px-3 py-1.5 rounded-2xl border border-purple-200 dark:border-purple-800/80 shadow-lg shadow-purple-500/10 pointer-events-none animate-in fade-in slide-in-from-bottom-2 z-30">
          <span>{speechText}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-b border-r border-purple-200 dark:border-purple-800/80 rotate-45" />
        </div>
      )}
    </div>
  );
}
