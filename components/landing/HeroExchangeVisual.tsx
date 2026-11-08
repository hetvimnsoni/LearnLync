"use client";

import { useState } from "react";
import {
  Code,
  Palette,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Repeat,
} from "lucide-react";

export function HeroExchangeVisual() {
  const [activePartner, setActivePartner] = useState<"maya" | "liam" | null>(null);

  return (
    <div className="relative w-full max-w-4xl mx-auto py-4 select-none">
      {/* Decorative Ambient Glow behind the composition */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 via-indigo-500/15 to-purple-500/10 rounded-full blur-3xl -z-10 transform scale-110" />

      {/* Floating Orbiting Skill Tags */}
      <div className="hidden sm:block absolute -top-4 left-6 animate-float z-20">
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-md text-slate-700 dark:text-slate-300 flex items-center gap-1.5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>TypeScript &amp; React</span>
        </div>
      </div>

      <div className="hidden sm:block absolute -top-2 right-10 animate-float-delayed z-20">
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-md text-slate-700 dark:text-slate-300 flex items-center gap-1.5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Conversational Spanish</span>
        </div>
      </div>

      <div className="hidden sm:block absolute -bottom-3 left-14 animate-float-delayed z-20">
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-md text-slate-700 dark:text-slate-300 flex items-center gap-1.5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Acoustic Guitar</span>
        </div>
      </div>

      <div className="hidden sm:block absolute -bottom-4 right-12 animate-float z-20">
        <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-md text-slate-700 dark:text-slate-300 flex items-center gap-1.5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span>Cloud &amp; DevOps</span>
        </div>
      </div>

      {/* Main Exchange Canvas */}
      <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white/90 to-slate-50/70 dark:from-slate-900/90 dark:to-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-brand-500/10">
        
        {/* Top Status Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Live Exchange Match
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
            <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
            <span>100% Reciprocal Match</span>
          </div>
        </div>

        {/* The Two Peer Cards & Central Bridge */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
          
          {/* Card Left: Maya */}
          <div
            onMouseEnter={() => setActivePartner("maya")}
            onMouseLeave={() => setActivePartner(null)}
            className={`md:col-span-5 rounded-2xl border p-5 transition-all duration-300 bg-white dark:bg-slate-800/90 ${
              activePartner === "maya"
                ? "border-brand-500 shadow-xl shadow-brand-500/15 scale-[1.02]"
                : "border-slate-200/90 dark:border-slate-700/80 shadow-md shadow-slate-900/5"
            }`}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  MC
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Maya Chen</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Data Science &amp; AI</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Offers */}
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" />
                    CAN TEACH
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-200/70 dark:bg-emerald-900/70 font-mono text-[10px]">
                    OFFER
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Python &amp; Machine Learning
                </p>
              </div>

              {/* Wants */}
              <div className="p-3 rounded-xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200/70 dark:border-brand-800/50">
                <div className="flex items-center justify-between text-[11px] font-bold text-brand-700 dark:text-brand-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5" />
                    WANTS TO LEARN
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-brand-200/70 dark:bg-brand-900/70 font-mono text-[10px]">
                    LOOKING
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                  UI/UX &amp; Product Design
                </p>
              </div>
            </div>
          </div>

          {/* Center Exchange Bridge */}
          <div className="md:col-span-1 flex flex-col items-center justify-center my-2 md:my-0">
            <div className="relative flex flex-col items-center justify-center">
              {/* Pulsing exchange ring */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 transform hover:rotate-180 transition-transform duration-500 cursor-pointer">
                <Repeat className="w-6 h-6 animate-spin-slow" />
              </div>

              {/* Bidirectional indicators on desktop */}
              <div className="hidden md:flex flex-col items-center gap-1 mt-3">
                <div className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 gap-0.5">
                  <span>Python</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div className="flex items-center text-[10px] font-bold text-brand-600 dark:text-brand-400 gap-0.5">
                  <ArrowLeft className="w-3 h-3" />
                  <span>UI/UX</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Right: Liam */}
          <div
            onMouseEnter={() => setActivePartner("liam")}
            onMouseLeave={() => setActivePartner(null)}
            className={`md:col-span-5 rounded-2xl border p-5 transition-all duration-300 bg-white dark:bg-slate-800/90 ${
              activePartner === "liam"
                ? "border-indigo-500 shadow-xl shadow-indigo-500/15 scale-[1.02]"
                : "border-slate-200/90 dark:border-slate-700/80 shadow-md shadow-slate-900/5"
            }`}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  LP
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Liam Patel</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Senior Product Designer</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Offers */}
              <div className="p-3 rounded-xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200/70 dark:border-brand-800/50">
                <div className="flex items-center justify-between text-[11px] font-bold text-brand-700 dark:text-brand-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5" />
                    CAN TEACH
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-brand-200/70 dark:bg-brand-900/70 font-mono text-[10px]">
                    OFFER
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                  UI/UX &amp; Product Design
                </p>
              </div>

              {/* Wants */}
              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" />
                    WANTS TO LEARN
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-200/70 dark:bg-emerald-900/70 font-mono text-[10px]">
                    LOOKING
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Python &amp; Machine Learning
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Banner inside Card */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Exchange request accepted • Real-time Nexconn chat unlocked</span>
          </div>
          <span className="font-semibold text-brand-600 dark:text-brand-400">
            Session 1 scheduled for Saturday
          </span>
        </div>
      </div>
    </div>
  );
}

