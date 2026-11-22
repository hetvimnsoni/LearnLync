"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Premium fluid atmospheric background specifically tuned for LearnLync's Find Peers page.
 *
 * Light mode: Soft lavender, very light violet, pale blue, subtle mint accents, gentle white highlights.
 * Dark mode: Deep midnight cosmic indigo, purple nebula, subtle teal dust.
 */
export function LearnersAtmosphere() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20 select-none">
      {/* 1. Base Gradient Canvas (Smooth lavender-to-white gradient in light mode; deep midnight in dark mode) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f9f8ff] via-[#f2f4fe] via-[#f7f9ff] to-[#fbfcfe] dark:from-[#060814] dark:via-[#090d21] dark:to-[#0c091f] transition-colors duration-500" />

      {/* 2. Soft Ambient Atmospheric Glow centered around the Earth location (Upper Right / Center) */}
      <div className="absolute top-4 right-0 lg:right-8 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.12),rgba(99,102,241,0.08),rgba(56,189,248,0.05),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.22),rgba(99,102,241,0.14),transparent_70%)] blur-[95px]" />

      {/* 3. Subtle Mint Accent Glow (Requirement 3: Subtle mint accents) */}
      <motion.div
        animate={{
          x: [0, 45, -35, 0],
          y: [0, -35, 45, 0],
          scale: [1, 1.12, 0.94, 1],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ willChange: "transform", transform: "translateZ(0)" }}
        className="absolute bottom-16 left-8 w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-emerald-400/12 via-teal-300/10 to-transparent blur-[115px] dark:from-emerald-500/10 dark:via-teal-600/8 dark:to-transparent transform-gpu"
      />

      {/* 4. Soft Lavender & Violet Fluid Gradient Orb (Upper Left) */}
      <motion.div
        animate={{
          x: [0, 65, -55, 0],
          y: [0, -65, 55, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ willChange: "transform", transform: "translateZ(0)" }}
        className="absolute -top-20 -left-20 w-[620px] h-[620px] rounded-full bg-gradient-to-br from-purple-400/15 via-indigo-300/12 to-pink-200/10 blur-[125px] dark:from-purple-600/20 dark:via-indigo-600/15 dark:to-transparent transform-gpu"
      />

      {/* 5. Pale Blue & Gentle White Highlights Fluid Gradient Orb (Center/Right) */}
      <motion.div
        animate={{
          x: [0, -75, 55, 0],
          y: [0, 65, -65, 0],
          scale: [1, 1.16, 0.93, 1],
        }}
        transition={{
          duration: 29,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.5,
        }}
        style={{ willChange: "transform", transform: "translateZ(0)" }}
        className="absolute top-1/3 right-1/4 w-[660px] h-[660px] rounded-full bg-gradient-to-bl from-sky-400/12 via-indigo-200/14 to-white/50 blur-[130px] dark:from-brand-600/15 dark:via-indigo-500/12 dark:to-transparent transform-gpu"
      />

      {/* 6. Subtle organic grid mesh pattern overlay matching LearnLync design language */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 dark:opacity-15 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
    </div>
  );
}
