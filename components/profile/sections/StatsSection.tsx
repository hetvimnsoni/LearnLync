"use client";

import { UserProfile, ProfileStatistics } from "@/types/profile";
import {
  BarChart3,
  Sparkles,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  Flame,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

interface StatsSectionProps {
  profile: UserProfile;
  stats: ProfileStatistics;
}

export function StatsSection({ profile, stats }: StatsSectionProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Genuine Platform Statistics</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Computed strictly from verified exchanges, completed sessions, and logged study hours
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Real Activity Connected</span>
        </div>
      </div>

      {/* 2. Core Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Skills Exchanged */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4 hover:border-brand-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Exchanged
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
              {stats.skills_exchanged}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completed reciprocal exchanges</p>
          </div>
        </div>

        {/* People Taught */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4 hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              People Taught
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
              {stats.people_taught}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Unique peers mentored</p>
          </div>
        </div>

        {/* Skills Learned */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4 hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Skills Learned
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
              {stats.skills_learned}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Skills acquired from partners</p>
          </div>
        </div>

        {/* Active Collaborations */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4 hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Collabs
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
              {stats.active_collaborations}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active or in-progress</p>
          </div>
        </div>
      </div>

      {/* 3. Deep Dive Ratios & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Exchange Balance Ratio</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            LearnLync prioritizes reciprocal fairness so members both teach and learn.
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-600 dark:text-emerald-400">Teaching ({profile.skills_offered?.length || 0} skills)</span>
              <span className="text-brand-600 dark:text-brand-400">Learning ({profile.skills_needed?.length || 0} skills)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{
                  width: `${
                    ((profile.skills_offered?.length || 1) /
                      ((profile.skills_offered?.length || 1) +
                        (profile.skills_needed?.length || 1))) *
                    100
                  }%`,
                }}
              />
              <div
                className="bg-brand-500 h-full"
                style={{
                  width: `${
                    ((profile.skills_needed?.length || 1) /
                      ((profile.skills_offered?.length || 1) +
                        (profile.skills_needed?.length || 1))) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Study Consistency</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Streak days and verified learning hours logged on this profile.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <Flame className="w-6 h-6 text-rose-500 animate-pulse" />
              <div>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {stats.learning_streak} Days
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Current Streak</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              <div>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {stats.learning_hours} hrs
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Study Logged</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
