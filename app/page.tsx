import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LearnLyncLogo } from "@/components/brand/LearnLyncLogo";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { Hero3DScene } from "@/components/3d/Hero3DScene";
import { HowItWorksJourney } from "@/components/landing/HowItWorksJourney";
import { SkillsUniverse } from "@/components/landing/SkillsUniverse";
import { WhyLearnLyncStory } from "@/components/landing/WhyLearnLyncStory";
import { FinalExchangeNexus } from "@/components/landing/FinalExchangeNexus";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  MessageSquare,
  ShieldCheck,
  Compass,
  ArrowLeftRight,
  GraduationCap,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden">
      {/* 1. Fluid Ambient Background Mesh & Moving Orbs */}
      <FluidAtmosphere />

      {/* ======================================================== */}
      {/* HERO SECTION WITH 3D WEBGL EXCHANGE SCENE                */}
      {/* ======================================================== */}
      <section className="relative pt-6 pb-16 md:pt-12 md:pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Typography */}
          <div className="text-center space-y-6 max-w-4xl mx-auto mb-6">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-white/80 dark:bg-slate-900/80 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80 backdrop-blur-md shadow-md">
              <Sparkles className="w-4 h-4 text-accent-amber animate-spin-slow" />
              <span>Share what you know. Discover what you don&apos;t.</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
              Your next skill starts with{" "}
              <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 dark:from-brand-400 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">
                someone you haven&apos;t met yet.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Meet people who have the skills you want — and share the knowledge only you have. Powered by real human conversations and live 1-on-1 Nexconn chat.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 shadow-xl shadow-brand-500/25 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/learners"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md transition shadow-sm"
                  >
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>Browse Peers</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 shadow-xl shadow-brand-500/25 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Start Exchanging Skills</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md transition shadow-sm"
                  >
                    <span>See How It Works</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Interactive 3D WebGL Scene */}
          <div className="w-full">
            <Hero3DScene />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION B: HOW IT WORKS (DIMENSIONAL JOURNEY)            */}
      {/* ======================================================== */}
      <section id="how-it-works" className="py-20 md:py-28 relative scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
              <Zap className="w-3.5 h-3.5" />
              <span>The Reciprocal Flow</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How LearnLync Works
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Experience the 3-stage journey from curating your skills to live peer collaboration.
            </p>
          </div>

          <HowItWorksJourney />
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION C: DISCOVER SKILLS (THE SKILLS UNIVERSE)         */}
      {/* ======================================================== */}
      <section id="skills" className="py-20 md:py-28 relative scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              <Compass className="w-3.5 h-3.5" />
              <span>Explore The Universe</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              The Skills Universe
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Explore 8 specialized celestial domains. Discover in-demand crafts and reciprocal pairings.
            </p>
          </div>

          <SkillsUniverse isAuthenticated={Boolean(user)} />
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION D: WHY LEARNLYNC (VISUAL STORYTELLING)           */}
      {/* ======================================================== */}
      <section id="why-learnlync" className="py-20 md:py-28 relative scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Philosophy</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why Reciprocal Learning Works
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              The science of learning by teaching, zero fees, and built-in human accountability.
            </p>
          </div>

          <WhyLearnLyncStory />
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION E: FINAL 3D EXCHANGE NEXUS                       */}
      {/* ======================================================== */}
      <section className="relative">
        <FinalExchangeNexus isAuthenticated={Boolean(user)} />
      </section>

      {/* ======================================================== */}
      {/* FOOTER                                                   */}
      {/* ======================================================== */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2 space-y-4">
              <LearnLyncLogo size="md" />
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                LearnLync is an immersive peer-to-peer skill exchange platform where people teach what they know and discover what they don&apos;t through 1-on-1 real-time collaboration.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase Auth &amp; Nexconn Real-time Active</span>
              </div>
            </div>

            {/* Platform Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Platform
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <Link href="#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#skills" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                    Skills Universe
                  </Link>
                </li>
                <li>
                  <Link href="#why-learnlync" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                    Why LearnLync
                  </Link>
                </li>
                <li>
                  <Link href={user ? "/learners" : "/login"} className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                    Find Peers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Technologies */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Technologies
              </h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <span className="hover:text-slate-900 dark:hover:text-slate-200">Three.js WebGL Engine</span>
                </li>
                <li>
                  <span className="hover:text-slate-900 dark:hover:text-slate-200">Framer Motion Physics</span>
                </li>
                <li>
                  <span className="hover:text-slate-900 dark:hover:text-slate-200">Next.js 14 App Router</span>
                </li>
                <li>
                  <span className="hover:text-slate-900 dark:hover:text-slate-200">Nexconn Real-time SDK</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 LearnLync. All rights reserved. Peer-to-peer skill exchange platform.</p>
            <div className="flex items-center gap-4">
              <span>Share what you know. Discover what you don&apos;t.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
