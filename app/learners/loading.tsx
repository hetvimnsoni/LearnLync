import React from "react";

export default function LearnersLoading() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      {/* Header Bar Skeleton */}
      <div className="flex items-center justify-between">
        <div className="w-36 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="w-48 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* 3D Earth Globe Viewport Skeleton */}
      <div className="h-[460px] sm:h-[520px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-40 h-40 sm:w-56 sm:h-56 rounded-full border-4 border-dashed border-brand-500/40 animate-spin-slow opacity-60" />
        <div className="space-y-1">
          <div className="w-48 h-4 rounded bg-slate-800 mx-auto" />
          <div className="w-32 h-3 rounded bg-slate-800/60 mx-auto" />
        </div>
      </div>

      {/* Peer Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-56 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1 flex-1">
                <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="w-16 h-3 rounded bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
            </div>
            <div className="w-full h-8 rounded bg-slate-200/50 dark:bg-slate-800/50" />
            <div className="flex gap-2">
              <div className="w-16 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="w-20 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
