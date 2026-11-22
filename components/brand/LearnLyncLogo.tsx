"use client";

import React from "react";
import Link from "next/link";

interface LearnLyncLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
  href?: string;
}

export function LearnLyncLogo({
  size = "lg",
  showWordmark = true,
  className = "",
  href = "/",
}: LearnLyncLogoProps) {
  const iconSizes = {
    sm: "w-6 h-6 sm:w-8 sm:h-8",
    md: "w-7 h-7 sm:w-10 sm:h-10",
    lg: "w-7 h-7 min-[375px]:w-8 min-[375px]:h-8 min-[410px]:w-[34px] min-[410px]:h-[34px] sm:w-14 sm:h-14 md:w-[56px] md:h-[56px]",
    xl: "w-10 h-10 sm:w-16 sm:h-16 md:w-18 md:h-18",
  };

  const textSizes = {
    sm: "text-xs sm:text-base font-bold",
    md: "text-sm sm:text-xl md:text-2xl font-extrabold",
    lg: "text-[15px] min-[375px]:text-[17px] min-[410px]:text-lg sm:text-[30px] md:text-[33px] font-black",
    xl: "text-xl sm:text-3xl md:text-5xl font-black",
  };

  // Official 3D Emblem with Blue, Violet, and Purple gradients and dimensional specular sheen
  const emblemIcon = (
    <div
      className={`relative ${iconSizes[size]} shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center p-[2px] sm:p-[2.5px] transition-transform duration-300 group-hover:scale-105 shadow-md sm:shadow-lg shadow-brand-500/25`}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md select-none"
      >
        <defs>
          {/* Blue to Indigo 3D Ribbon */}
          <linearGradient id="llEmblemBlue" x1="6" y1="8" x2="32" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="30%" stopColor="#2563EB" />
            <stop offset="70%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>

          {/* Violet to Purple 3D Ribbon */}
          <linearGradient id="llEmblemPurple" x1="42" y1="40" x2="16" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="45%" stopColor="#9333EA" />
            <stop offset="80%" stopColor="#C026D3" />
            <stop offset="100%" stopColor="#E879F9" />
          </linearGradient>

          {/* Specular 3D Ridge Highlight */}
          <linearGradient id="llSpecularRidge" x1="12" y1="8" x2="36" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Ambient depth shadow */}
          <filter id="llEmblemShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#1E1B4B" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 3D Container Background with subtle border glow */}
        <rect x="2" y="2" width="44" height="44" rx="13" fill="#0B0F19" />
        <rect x="2" y="2" width="44" height="44" rx="13" stroke="url(#llEmblemBlue)" strokeWidth="1.2" strokeOpacity="0.4" />

        {/* 3D Interlocking ribbons representing peer knowledge exchange */}
        <g filter="url(#llEmblemShadow)">
          {/* Left Ribbon Loop (Blue/Indigo) */}
          <path
            d="M13 13C17 9 25 9 29 13L33 17C36 20 36 26 33 29L29 33C25 37 17 37 13 33C9 29 9 21 13 17L23 27"
            stroke="url(#llEmblemBlue)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Ribbon Loop (Violet/Purple) */}
          <path
            d="M33 33C29 37 21 37 17 33L13 29C10 26 10 20 13 17L17 13C21 9 29 9 33 13C37 17 37 25 33 29L23 19"
            stroke="url(#llEmblemPurple)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Specular 3D Ridge Highlight */}
        <path
          d="M14 14C17.5 10.5 24.5 10.5 28 14L31.5 17.5"
          stroke="url(#llSpecularRidge)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Central Luminous Exchange Core */}
        <circle cx="24" cy="24" r="3" fill="#FFFFFF" />
        <circle cx="24" cy="24" r="1.6" fill="#7C3AED" />
      </svg>
    </div>
  );

  // Visually prominent, high-contrast blue-to-purple gradient wordmark
  // Stands out vividly against white in light mode and glows against dark navy in dark mode
  const wordmark = showWordmark && (
    <span
      className={`tracking-tight ${textSizes[size]} flex items-center leading-none select-none`}
    >
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1D4ED8] via-[#6366F1] to-[#9333EA] dark:from-[#60A5FA] dark:via-[#A78BFA] dark:to-[#E879F9] drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_2px_10px_rgba(147,51,234,0.35)]">
        LearnLync
      </span>
    </span>
  );

  const content = (
    <div className={`group inline-flex items-center gap-1.5 min-[375px]:gap-2 sm:gap-3.5 md:gap-4 ${className}`}>
      {emblemIcon}
      {wordmark}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block" aria-label="LearnLync Home">
        {content}
      </Link>
    );
  }

  return content;
}
