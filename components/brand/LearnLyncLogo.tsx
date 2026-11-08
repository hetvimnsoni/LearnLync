"use client";

import React from "react";
import Link from "next/link";

interface LearnLyncLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
  href?: string;
}

export function LearnLyncLogo({
  size = "md",
  showWordmark = true,
  className = "",
  href = "/",
}: LearnLyncLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  const logoIcon = (
    <div
      className={`relative ${iconSizes[size]} rounded-2xl flex items-center justify-center bg-gradient-to-tr from-brand-600 via-indigo-600 to-accent-coral p-0.5 shadow-md shadow-brand-500/20 group-hover:shadow-brand-500/35 transition-all duration-300 group-hover:scale-105`}
    >
      <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5"
        >
          <defs>
            <linearGradient id="learnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="lyncGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>

          {/* Connected infinity/exchange ribbons */}
          <path
            d="M8 18C8 12.4772 12.4772 8 18 8C20.5 8 22.8 8.9 24.5 10.5L18 18L11.5 25.5C9.8 23.8 8 21.5 8 18Z"
            fill="url(#learnGrad)"
            opacity="0.9"
          />
          <path
            d="M28 18C28 23.5228 23.5228 28 18 28C15.5 28 13.2 27.1 11.5 25.5L18 18L24.5 10.5C26.2 12.2 28 14.5 28 18Z"
            fill="url(#lyncGrad)"
            opacity="0.9"
          />

          {/* Central Exchange Node Spark */}
          <circle cx="18" cy="18" r="3.2" fill="#ffffff" />
          <circle cx="18" cy="18" r="2.2" fill="#4f46e5" />
        </svg>
      </div>
    </div>
  );

  const content = (
    <div className={`group inline-flex items-center gap-2.5 ${className}`}>
      {logoIcon}
      {showWordmark && (
        <span
          className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${textSizes[size]}`}
        >
          Learn<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-coral">Lync</span>
        </span>
      )}
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

