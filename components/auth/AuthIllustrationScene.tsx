"use client";

import { useState, useEffect } from "react";
import { Sparkles, Code2, Palette, Music, CheckCircle2, Laptop } from "lucide-react";

export function AuthIllustrationScene() {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 16;
      const y = (e.clientY / innerHeight - 0.5) * 16;
      setMouseOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[580px] lg:min-h-[820px] bg-gradient-to-br from-[#E9DEFF]/80 via-[#F3EDFF]/90 to-[#E3D6FF] dark:from-[#191538] dark:via-[#211a4e] dark:to-[#161234] overflow-hidden flex items-center justify-center p-6 sm:p-10 select-none">
      {/* 1. Ambient Lighting & Soft Gradient Orbs */}
      <div className="absolute top-10 right-12 w-80 h-80 bg-[#B99BFA]/40 dark:bg-[#7046E8]/25 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-12 left-10 w-96 h-96 bg-[#A9E9D0]/35 dark:bg-[#10b981]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-[#FFC36D]/20 dark:bg-[#f59e0b]/10 rounded-full blur-3xl pointer-events-none" />

      {/* 2. Curved Knowledge Exchange Orbital Paths (SVG) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7046E8" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#B99BFA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFC36D" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="orbitGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#A9E9D0" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#7046E8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#E9DEFF" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Primary elliptical orbital path connecting learners */}
        <path
          d="M 120 480 C 150 200, 650 140, 680 320 C 700 460, 480 680, 260 620"
          stroke="url(#orbitGrad1)"
          strokeWidth="2.5"
          strokeDasharray="6 8"
          className="opacity-70"
        />

        {/* Secondary counter-orbital glow arc */}
        <path
          d="M 220 280 C 450 120, 720 380, 520 660"
          stroke="url(#orbitGrad2)"
          strokeWidth="2"
          className="opacity-50"
        />

        {/* Floating animated glowing particles on paths */}
        <circle cx="280" cy="240" r="4.5" fill="#FFC36D" className="animate-ping opacity-80" />
        <circle cx="280" cy="240" r="3.5" fill="#FFC36D" />
        <circle cx="640" cy="260" r="4" fill="#A9E9D0" className="animate-pulse" />
        <circle cx="480" cy="620" r="3" fill="#B99BFA" />
      </svg>

      {/* 3. Secondary Learner Panel (Upper Right - Peer to Peer concept) */}
      <div
        style={{
          transform: `translate(${mouseOffset.x * -0.6}px, ${mouseOffset.y * -0.6}px)`,
        }}
        className="absolute top-8 sm:top-12 right-6 sm:right-12 z-20 backdrop-blur-xl bg-white/85 dark:bg-[#20194a]/85 border border-white/80 dark:border-white/10 rounded-3xl p-3 sm:p-4 shadow-xl shadow-[#7046E8]/10 hover:shadow-2xl hover:scale-105 transition-all duration-300 max-w-[240px] sm:max-w-[270px]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7046E8] to-[#B99BFA] flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-[#7046E8]/30">
              <span className="text-xl">👨‍💻</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10b981] border-2 border-white dark:border-[#20194a] shadow-xs flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-[#252052] dark:text-white text-xs">
                Marcus Chen
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#A9E9D0]/40 text-[#1b7352] dark:text-[#A9E9D0]">
                Peer
              </span>
            </div>
            <p className="text-[11px] text-[#77718F] dark:text-[#B99BFA]/90 font-medium">
              Teaches React & UI/UX
            </p>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#E9DEFF] dark:border-white/10 flex items-center justify-between text-[10px] text-[#252052] dark:text-white font-semibold">
          <span className="flex items-center gap-1 text-[#7046E8] dark:text-[#B99BFA]">
            <Sparkles className="w-3 h-3 text-[#FFC36D]" />
            Wants: Python & AI
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            Match: 98%
          </span>
        </div>
      </div>

      {/* 4. Main Character (3D Clay Girl in Mint Sweater & Purple Trousers) */}
      <div
        style={{
          transform: `translate(${mouseOffset.x * 0.4}px, ${mouseOffset.y * 0.4}px)`,
        }}
        className="relative z-10 flex flex-col items-center justify-center max-w-[560px] w-full transition-transform duration-200"
      >
        {/* Soft 3D Floating Platform Glow & Shadow */}
        <div className="absolute -bottom-8 w-80 sm:w-96 h-20 bg-[#7046E8]/20 dark:bg-[#7046E8]/35 rounded-[100%] blur-2xl pointer-events-none" />

        {/* Character Image */}
        <div className="relative group">
          <img
            src="/illustrations/learnlync-hero-girl.png"
            alt="LearnLync Learner - 3D Character Illustration"
            className="w-full max-w-[480px] sm:max-w-[540px] h-auto object-contain drop-shadow-[0_20px_35px_rgba(37,32,82,0.18)] dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] animate-float transition-transform duration-500 group-hover:scale-102"
          />

          {/* Soft floating platform base overlay */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-72 sm:w-88 h-10 bg-gradient-to-r from-[#E9DEFF]/60 via-[#F3EDFF]/80 to-[#E9DEFF]/60 dark:from-[#20194a]/60 dark:via-[#2b2164]/80 dark:to-[#20194a]/60 rounded-full blur-md -z-10" />
        </div>
      </div>

      {/* 5. Floating 3D Skill Cards */}

      {/* Skill Card 1: Python (Top-Left of character) */}
      <div
        style={{
          transform: `translate(${mouseOffset.x * -0.9}px, ${mouseOffset.y * -0.9}px)`,
        }}
        className="absolute top-24 sm:top-32 left-4 sm:left-12 z-20 backdrop-blur-xl bg-white/90 dark:bg-[#20194a]/90 border border-white/80 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-xl shadow-[#7046E8]/12 hover:scale-105 transition-all duration-300 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#eab308] p-0.5 shadow-md flex items-center justify-center text-white">
          <Code2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#252052] dark:text-white text-xs">
              Python
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#3b82f6]/15 text-[#2563eb] dark:text-[#93c5fd]">
              AI / ML
            </span>
          </div>
          <p className="text-[10px] text-[#77718F] dark:text-[#B99BFA]/80 font-medium">
            Ready to exchange
          </p>
        </div>
      </div>

      {/* Skill Card 2: UI/UX (Middle-Right of character) */}
      <div
        style={{
          transform: `translate(${mouseOffset.x * 0.8}px, ${mouseOffset.y * 0.8}px)`,
        }}
        className="absolute top-1/2 right-2 sm:right-10 -translate-y-8 z-20 backdrop-blur-xl bg-white/90 dark:bg-[#20194a]/90 border border-white/80 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-xl shadow-[#7046E8]/12 hover:scale-105 transition-all duration-300 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7046E8] to-[#A9E9D0] p-0.5 shadow-md flex items-center justify-center text-white">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#252052] dark:text-white text-xs">
              UI/UX Design
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#7046E8]/15 text-[#7046E8] dark:text-[#B99BFA]">
              Design
            </span>
          </div>
          <p className="text-[10px] text-[#77718F] dark:text-[#B99BFA]/80 font-medium">
            Figma & Systems
          </p>
        </div>
      </div>

      {/* Skill Card 3: Music (Bottom-Left of character) */}
      <div
        style={{
          transform: `translate(${mouseOffset.x * -0.5}px, ${mouseOffset.y * -0.5}px)`,
        }}
        className="absolute bottom-12 sm:bottom-20 left-6 sm:left-16 z-20 backdrop-blur-xl bg-white/90 dark:bg-[#20194a]/90 border border-white/80 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 shadow-xl shadow-[#7046E8]/12 hover:scale-105 transition-all duration-300 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ec4899] to-[#FFC36D] p-0.5 shadow-md flex items-center justify-center text-white">
          <Music className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#252052] dark:text-white text-xs">
              Music Production
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#ec4899]/15 text-[#db2777] dark:text-[#f472b6]">
              Creative
            </span>
          </div>
          <p className="text-[10px] text-[#77718F] dark:text-[#B99BFA]/80 font-medium">
            Synthesis & Audio
          </p>
        </div>
      </div>

      {/* 6. Supporting Decorative Details (Books & Potted Plant & Stars) */}
      {/* Amber Glowing Stars & Sparkles */}
      <div className="absolute top-28 right-1/3 text-[#FFC36D] animate-bounce duration-1000">
        <Sparkles className="w-6 h-6 fill-[#FFC36D]" />
      </div>
      <div className="absolute bottom-32 right-1/4 text-[#B99BFA] animate-pulse">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="absolute top-1/3 left-1/5 text-[#A9E9D0] animate-pulse duration-700">
        <Sparkles className="w-5 h-5" />
      </div>

      {/* Lower Right Book Stack Tag */}
      <div className="absolute bottom-6 right-8 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-[11px] font-semibold text-[#77718F] dark:text-[#B99BFA]">
        <span>📚 1,200+ Active Skills Exchanged</span>
      </div>
    </div>
  );
}
