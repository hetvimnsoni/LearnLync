import React from "react";

export default function CertificatesLoading() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="w-40 h-6 rounded-full bg-amber-500/20" />
        <div className="w-64 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="w-96 h-4 rounded bg-slate-200/70 dark:bg-slate-800/70" />
      </div>

      {/* Certificate Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-80 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="h-44 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
            <div className="space-y-2">
              <div className="w-36 h-5 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="w-24 h-4 rounded bg-slate-200/60 dark:bg-slate-800/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
