"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Compass,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Code,
  Palette,
  Send,
  Zap,
} from "lucide-react";

interface Step {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof BookOpen;
  accent: string;
  glow: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    badge: "Step 01 • The Skill Core",
    title: "Curate What You Know & What You Seek",
    subtitle: "Define your unique learning equation",
    description:
      "Every learner has mastery in something others desire. Add your offered skills — whether it's Python, Figma, Spanish, or Acoustic Guitar — and list the skills you want to discover next.",
    icon: BookOpen,
    accent: "from-brand-600 to-indigo-600",
    glow: "rgba(99, 102, 241, 0.25)",
  },
  {
    id: 2,
    badge: "Step 02 • Reciprocal Resonance",
    title: "Discover Complementary Partners",
    subtitle: "Zero search guesswork — mutual match discovery",
    description:
      "Our reciprocal discovery highlights peers whose wishlist directly mirrors your offerings. Filter by domain, inspect bio profiles, and send an intentional 1-click exchange request.",
    icon: Compass,
    accent: "from-purple-600 to-pink-600",
    glow: "rgba(168, 85, 247, 0.25)",
  },
  {
    id: 3,
    badge: "Step 03 • Realtime Fusion",
    title: "Connect & Learn 1-on-1 via Nexconn",
    subtitle: "Built-in chat, live collaboration, shared growth",
    description:
      "Once accepted, unlock your dedicated 1-on-1 Nexconn real-time chat room. Share code snippets, critique design proofs, schedule video syncs, and learn side by side.",
    icon: MessageSquare,
    accent: "from-emerald-500 to-teal-600",
    glow: "rgba(16, 185, 129, 0.25)",
  },
];

export function HowItWorksJourney() {
  const [activeStep, setActiveStep] = useState<number>(1);

  return (
    <div className="w-full max-w-6xl mx-auto py-12">
      {/* Step Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`relative text-left p-6 rounded-3xl border transition-all duration-300 ${
                isActive
                  ? "bg-white dark:bg-slate-900 border-brand-500 shadow-2xl scale-[1.02]"
                  : "bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800/60"
              }`}
              style={{
                boxShadow: isActive ? `0 20px 40px -15px ${step.glow}` : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-tr ${step.accent}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  0{step.id} / 03
                </span>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
                {step.badge}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {step.title}
              </h3>
            </button>
          );
        })}
      </div>

      {/* Dimensional Interactive Stage Showcase */}
      <div className="relative rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white/90 to-slate-50/60 dark:from-slate-900/90 dark:to-slate-950/60 backdrop-blur-xl p-8 sm:p-12 shadow-2xl shadow-slate-900/10 overflow-hidden">
        
        {/* Animated Connecting Energy Line Background */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-500" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Descriptive Story */}
          <div className="lg:col-span-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/50">
                  <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
                  <span>{STEPS[activeStep - 1].subtitle}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {STEPS[activeStep - 1].title}
                </h2>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  {STEPS[activeStep - 1].description}
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setActiveStep((prev) => (prev % 3) + 1)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 transition shadow-md group"
                  >
                    <span>Next Stage</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <span className="text-xs text-slate-400">
                    Step {activeStep} of 3
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Interactive 3D Mockup Visual */}
          <div className="lg:col-span-6">
            <AnimatePresence mode="wait">
              {activeStep === 1 && (
                <motion.div
                  key="step-1-visual"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-3xl border border-brand-500/30 bg-slate-50 dark:bg-slate-800/80 p-6 sm:p-8 space-y-5 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Live Skill Core Matrix
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Active Profile
                    </span>
                  </div>

                  {/* Skills I Offer */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5" />
                      <span>SKILLS YOU OFFER TO TEACH</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Python & Algorithms", "Data Science", "Machine Learning"].map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 shadow-sm"
                        >
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Skills I Seek */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      <span>SKILLS YOU WANT TO MASTER</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["UI/UX Design", "Figma Components", "Design Systems"].map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-800 dark:text-brand-200 border border-brand-300 dark:border-brand-800 shadow-sm"
                        >
                          ✦ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div
                  key="step-2-visual"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-3xl border border-purple-500/30 bg-slate-50 dark:bg-slate-800/80 p-6 sm:p-8 space-y-5 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Mutual Resonance Match
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-accent-amber" />
                      100% Reciprocal
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                        LP
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          Liam Patel
                        </div>
                        <div className="text-xs text-slate-500">Teaches UI/UX • Wants Python</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 text-xs text-purple-900 dark:text-purple-200">
                      &ldquo;Looking for a Python mentor to build data visualizers. Can teach Figma design systems and UX research in exchange!&rdquo;
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Ready to initiate exchange</span>
                      <span className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-sm">
                        Request Exchange →
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 3 && (
                <motion.div
                  key="step-3-visual"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-3xl border border-emerald-500/30 bg-slate-50 dark:bg-slate-800/80 p-6 sm:p-8 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Nexconn 1-on-1 Chat Session
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      LIVE • ENCRYPTED
                    </span>
                  </div>

                  {/* Simulated Realtime Messages */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        LP
                      </div>
                      <div className="p-3 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm">
                        Hey Maya! Excited to exchange. I reviewed your Figma drafts. Let&apos;s trade our first 45-min session this Saturday!
                      </div>
                    </div>

                    <div className="flex items-start gap-2 max-w-[85%] ml-auto flex-row-reverse">
                      <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        MC
                      </div>
                      <div className="p-3 rounded-2xl rounded-tr-sm bg-brand-600 text-white shadow-sm">
                        Awesome Liam! I have a PyTorch notebook ready to walk through. Saturday at 3 PM works perfectly.
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <div className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                      Type your message...
                    </div>
                    <div className="p-2 rounded-xl bg-brand-600 text-white">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

