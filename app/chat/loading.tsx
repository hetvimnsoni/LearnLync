import React from "react";

export default function ChatLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 p-4 space-y-4 hidden md:block">
        <div className="w-32 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="w-full h-10 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1.5 flex-1">
                <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="w-36 h-3 rounded bg-slate-200/60 dark:bg-slate-800/60" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Room Area Skeleton */}
      <div className="flex-1 flex flex-col justify-between p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="w-32 h-5 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="w-full h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
