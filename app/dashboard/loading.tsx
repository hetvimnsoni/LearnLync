import React from "react";

export default function DashboardLoading() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-44 sm:h-52 rounded-3xl bg-slate-200/70 dark:bg-slate-800/60 border border-slate-300/40 dark:border-slate-700/50" />

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/40 p-4 space-y-2"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-300/70 dark:bg-slate-700/60" />
            <div className="w-20 h-4 rounded bg-slate-300/60 dark:bg-slate-700/50" />
            <div className="w-12 h-6 rounded bg-slate-300/80 dark:bg-slate-700/70" />
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-72 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/40" />
          <div className="h-80 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/40" />
        </div>
        <div className="space-y-6">
          <div className="h-80 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/40" />
          <div className="h-72 rounded-3xl bg-slate-200/60 dark:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/40" />
        </div>
      </div>
    </div>
  );
}
