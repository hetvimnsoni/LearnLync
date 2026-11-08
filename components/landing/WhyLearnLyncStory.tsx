"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
  Zap,
  Repeat,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const PILLARS = [
  {
    id: "protege",
    title: "The Protégé Effect",
    subtitle: "We learn best when we teach others",
    description:
      "Cognitive research confirms that articulating a concept to another human forces your brain to clarify mental models, expose hidden flaws, and crystallize true mastery. Solitary video-watching tops out at 10% retention; peer teaching achieves 90%.",
    metric: "90% Retention Rate",
    metricLabel: "vs 10% for passive video consumption",
    icon: GraduationCap,
    accent: "from-blue-600 via-indigo-600 to-purple-600",
    glow: "rgba(99, 102, 241, 0.2)",
  },
  {
    id: "zero-gatekeeping",
    title: "Zero Financial Gatekeeping",
    subtitle: "Your existing talent is the only currency",
    description:
      "World-class skills shouldn't be reserved for those who can pay \$2,000 upfront. LearnLync operates on an egalitarian 1-to-1 exchange system: trade an hour of Python mentorship for an hour of UI/UX design. Knowledge flows freely.",
    metric: "100% Free",
    metricLabel: "No paywalls, subscriptions or locked modules",
    icon: HeartHandshake,
    accent: "from-emerald-500 to-teal-600",
    glow: "rgba(16, 185, 129, 0.2)",
  },
  {
    id: "nexconn-mesh",
    title: "Integrated Nexconn Live Chat",
    subtitle: "Real-time communication built right in",
    description:
      "Never juggle disparate third-party apps, social handles, or phone numbers. LearnLync features native real-time messaging powered by the Nexconn Chat SDK — complete with unread notifications, live receipts, and persistent message history.",
    metric: "Real-time 1:1",
    metricLabel: "Native messaging infrastructure with live presence",
    icon: MessageSquare,
    accent: "from-purple-600 to-pink-600",
    glow: "rgba(168, 85, 247, 0.2)",
  },
  {
    id: "accountability",
    title: "Mutual Accountability",
    subtitle: "A real human partner keeping you consistent",
    description:
      "The primary reason online courses are abandoned is lack of accountability. When another real person is waiting for your Saturday sync session to learn their half of the craft, showing up is effortless.",
    metric: "Dual Commitment",
    metricLabel: "Both partners actively invest in mutual elevation",
    icon: Repeat,
    accent: "from-amber-500 to-orange-600",
    glow: "rgba(245, 158, 11, 0.2)",
  },
];

export function WhyLearnLyncStory() {
  const [activePillar, setActivePillar] = useState<string>("protege");

  return (
    <div className="w-full max-w-6xl mx-auto py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {PILLARS.map((pillar) => {
          const Icon = pillar.icon;
          const isActive = pillar.id === activePillar;

          return (
            <motion.div
              key={pillar.id}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => setActivePillar(pillar.id)}
              className={`relative rounded-3xl border p-8 transition-all duration-300 cursor-pointer overflow-hidden ${
                isActive
                  ? "bg-white dark:bg-slate-900 border-brand-500 shadow-2xl scale-[1.01]"
                  : "bg-white/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-850"
              }`}
              style={{
                boxShadow: isActive ? `0 20px 45px -15px ${pillar.glow}` : undefined,
              }}
            >
              {/* Subtle accent gradient bar on top */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${pillar.accent}`}
              />

              <div className="flex items-start justify-between gap-4 mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-tr ${pillar.accent} shadow-md shrink-0`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                <div className="text-right">
                  <span className="block text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {pillar.metric}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {pillar.metricLabel}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  {pillar.subtitle}
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {pillar.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              {/* Bottom active badge */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-semibold text-brand-600 dark:text-brand-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Reciprocal Standard</span>
                </span>
                <span className="font-mono text-[11px]">LearnLync Principle</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

