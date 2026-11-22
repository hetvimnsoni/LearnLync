import React from "react";

export default function RequestsLoading() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="w-32 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="w-56 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="w-80 h-4 rounded bg-slate-200/70 dark:bg-slate-800/70" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="w-28 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="w-28 h-9 rounded-xl bg-slate-200/60 dark:bg-slate-800/60" />
        <div className="w-28 h-9 rounded-xl bg-slate-200/60 dark:bg-slate-800/60" />
      </div>

      {/* Requests List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2">
                <div className="w-32 h-4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="w-64 h-3 rounded bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-20 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="w-20 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
