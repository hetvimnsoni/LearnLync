import React from "react";

export default function AILoading() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="w-36 h-6 rounded-full bg-brand-500/20" />
        <div className="w-64 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="w-96 h-4 rounded bg-slate-200/70 dark:bg-slate-800/70" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-24 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>

      {/* Chat Area Skeleton */}
      <div className="h-[520px] rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20" />
            <div className="w-72 h-16 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
          </div>
          <div className="flex gap-3 justify-end">
            <div className="w-60 h-12 rounded-2xl bg-brand-600/20" />
          </div>
        </div>
        <div className="w-full h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
