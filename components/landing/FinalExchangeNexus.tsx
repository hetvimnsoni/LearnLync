"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Repeat, Users, MessageSquare } from "lucide-react";

export function FinalExchangeNexus({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="relative w-full max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      {/* 3D Radiant Nexus Card */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-brand-700 via-indigo-800 to-purple-900 p-8 sm:p-14 lg:p-20 text-white shadow-2xl shadow-brand-500/25 border border-white/20">
        
        {/* Animated Radial Plasma Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-24 -right-24 w-96 h-96 bg-accent-amber/30 rounded-full blur-3xl pointer-events-none"
        />

        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"
        />

        {/* Content Container */}
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-md">
            <Sparkles className="w-4 h-4 text-accent-amber animate-spin-slow" />
            <span>The Reciprocal Skill Exchange</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Share what you know. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-200 via-white to-indigo-200 bg-clip-text text-transparent">
              Discover what you don&apos;t.
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed">
            Join a vibrant network of peer learners trading real-world crafts. Your knowledge is your currency — start collaborating 1-on-1 today.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-slate-900 bg-white hover:bg-slate-100 shadow-xl transition-all hover:scale-105 active:scale-95 group"
                >
                  <span>Open Your Dashboard</span>
                  <ArrowRight className="w-5 h-5 text-brand-600 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/learners"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold text-base text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition shadow-sm"
                >
                  <Users className="w-5 h-5 text-indigo-200" />
                  <span>Discover Peers</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-slate-900 bg-white hover:bg-slate-100 shadow-xl transition-all hover:scale-105 active:scale-95 group"
                >
                  <span>Start Exchanging Skills</span>
                  <ArrowRight className="w-5 h-5 text-brand-600 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold text-base text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition shadow-sm"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

