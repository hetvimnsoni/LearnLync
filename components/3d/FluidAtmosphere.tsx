"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function FluidAtmosphere() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20 select-none">
      {/* Dynamic Fluid Gradient Orbs */}
      <motion.div
        animate={{
          x: [0, 80, -60, 0],
          y: [0, -100, 60, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-brand-600/15 via-indigo-500/12 to-purple-500/10 blur-[120px] dark:from-brand-500/20 dark:via-indigo-500/15 dark:to-purple-600/10"
      />

      <motion.div
        animate={{
          x: [0, -90, 70, 0],
          y: [0, 80, -90, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-1/3 -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-amber-500/10 blur-[130px] dark:from-purple-600/20 dark:via-pink-500/15 dark:to-amber-500/12"
      />

      <motion.div
        animate={{
          x: [0, 100, -80, 0],
          y: [0, 60, -80, 0],
          scale: [1, 1.1, 0.92, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-emerald-500/12 via-teal-500/10 to-brand-500/15 blur-[140px] dark:from-emerald-600/15 dark:via-teal-600/12 dark:to-brand-600/18"
      />

      {/* Subtle organic geometric mesh overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 dark:opacity-20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
    </div>
  );
}

