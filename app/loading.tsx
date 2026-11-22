import React from "react";

export default function GlobalLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 select-none">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        {/* Animated glowing spinner */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-brand-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 border-r-purple-500 animate-spin" />
          <div className="absolute inset-3 rounded-full bg-brand-500/10 backdrop-blur-sm" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide">
            Loading LearnLync...
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Preparing your peer learning experience
          </p>
        </div>
      </div>
    </div>
  );
}
