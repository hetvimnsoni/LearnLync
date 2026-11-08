"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Palette,
  Globe2,
  TrendingUp,
  Music2,
  Camera,
  MessageSquare,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";

interface Sector {
  id: string;
  name: string;
  icon: typeof Code2;
  color: string;
  glow: string;
  border: string;
  tagline: string;
  skills: string[];
  pairings: { offer: string; receive: string }[];
}

const SECTORS: Sector[] = [
  {
    id: "tech",
    name: "Technology",
    icon: Code2,
    color: "from-cyan-500 to-blue-600",
    glow: "rgba(6, 182, 212, 0.35)",
    border: "border-cyan-500/40",
    tagline: "Algorithms, distributed systems, modern web & machine learning",
    skills: ["Python", "Machine Learning", "TypeScript", "React & Next.js", "Rust", "PostgreSQL", "DevOps"],
    pairings: [
      { offer: "Python & PyTorch", receive: "UI/UX & Design Systems" },
      { offer: "Backend Go/Node APIs", receive: "Conversational Spanish" },
    ],
  },
  {
    id: "design",
    name: "Design",
    icon: Palette,
    color: "from-violet-500 to-fuchsia-600",
    glow: "rgba(168, 85, 247, 0.35)",
    border: "border-violet-500/40",
    tagline: "Design systems, product wireframes, 3D blender & brand typography",
    skills: ["Figma Systems", "UI/UX Research", "Motion Graphics", "3D Blender", "Brand Design", "Visual Hierarchy"],
    pairings: [
      { offer: "Figma Component Architecture", receive: "Frontend React Development" },
      { offer: "Product Prototyping", receive: "Technical Writing & Docs" },
    ],
  },
  {
    id: "languages",
    name: "Languages",
    icon: Globe2,
    color: "from-emerald-500 to-teal-600",
    glow: "rgba(16, 185, 129, 0.35)",
    border: "border-emerald-500/40",
    tagline: "Fluency, native pronunciation, accent mastery & conversational flow",
    skills: ["Conversational Spanish", "Japanese (JLPT)", "French Grammar", "German Basics", "Business English", "Mandarin"],
    pairings: [
      { offer: "Native Spanish Fluency", receive: "Acoustic Guitar Lessons" },
      { offer: "Japanese Conversation", receive: "Web Development 101" },
    ],
  },
  {
    id: "business",
    name: "Business",
    icon: TrendingUp,
    color: "from-amber-500 to-orange-600",
    glow: "rgba(245, 158, 11, 0.35)",
    border: "border-amber-500/40",
    tagline: "Product roadmaps, growth hacking, financial modeling & unit economics",
    skills: ["Product Strategy", "Growth Marketing", "Financial Models", "SEO Strategy", "Notion Architecture"],
    pairings: [
      { offer: "Product Discovery Frameworks", receive: "Data Visualization & SQL" },
      { offer: "Growth Funnels & Analytics", receive: "Graphic & Social Design" },
    ],
  },
  {
    id: "music",
    name: "Music",
    icon: Music2,
    color: "from-rose-500 to-pink-600",
    glow: "rgba(244, 63, 94, 0.35)",
    border: "border-rose-500/40",
    tagline: "Acoustic instruments, chord progressions, digital audio & vocal coaching",
    skills: ["Acoustic Guitar", "Music Theory", "Ableton & Logic Pro", "Vocal Training", "Piano Keys", "Audio Mixing"],
    pairings: [
      { offer: "Guitar Fingerstyle", receive: "Digital Photography" },
      { offer: "Electronic Music Production", receive: "Python Automation Scripts" },
    ],
  },
  {
    id: "creative-arts",
    name: "Creative Arts",
    icon: Camera,
    color: "from-purple-600 to-indigo-700",
    glow: "rgba(147, 51, 234, 0.35)",
    border: "border-purple-600/40",
    tagline: "Digital photography, color grading, illustration & video editing",
    skills: ["Photography & Lighting", "DaVinci Resolve / Premiere", "Digital Illustration", "Visual Storytelling"],
    pairings: [
      { offer: "Cinema Color Grading", receive: "Brand Strategy & Copy" },
      { offer: "Portrait Photography", receive: "Conversational French" },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    icon: MessageSquare,
    color: "from-sky-500 to-indigo-500",
    glow: "rgba(14, 165, 233, 0.35)",
    border: "border-sky-500/40",
    tagline: "Stage presence, keynote pitch decks, negotiation & executive presence",
    skills: ["Public Speaking", "Pitch Deck Delivery", "Executive Storytelling", "Interview Prep", "Negotiation"],
    pairings: [
      { offer: "Pitch Storytelling Mastery", receive: "Financial Projections" },
      { offer: "Stage Confidence", receive: "Guitar Basics" },
    ],
  },
  {
    id: "academics",
    name: "Academics",
    icon: GraduationCap,
    color: "from-yellow-600 to-amber-700",
    glow: "rgba(202, 138, 4, 0.35)",
    border: "border-yellow-600/40",
    tagline: "Calculus, organic chemistry, discrete math, statistics & research methods",
    skills: ["Calculus & Linear Algebra", "Discrete Mathematics", "Statistics & Probability", "Academic Research"],
    pairings: [
      { offer: "Linear Algebra & Calculus", receive: "Python Machine Learning" },
      { offer: "Statistical Research", receive: "UI Wireframing" },
    ],
  },
];

export function SkillsUniverse({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [selectedId, setSelectedId] = useState<string>("tech");

  const activeSector = SECTORS.find((s) => s.id === selectedId) || SECTORS[0];
  const Icon = activeSector.icon;

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      {/* Interactive Constellation Sector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-10">
        {SECTORS.map((sector) => {
          const SectorIcon = sector.icon;
          const isSelected = sector.id === selectedId;
          return (
            <button
              key={sector.id}
              onClick={() => setSelectedId(sector.id)}
              className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 border ${
                isSelected
                  ? `bg-white dark:bg-slate-900 ${sector.border} shadow-lg scale-105`
                  : "bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800"
              }`}
              style={{
                boxShadow: isSelected ? `0 10px 30px -10px ${sector.glow}` : undefined,
              }}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr ${sector.color} shadow-sm`}
              >
                <SectorIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 text-center truncate w-full">
                {sector.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dimensional Celestial Showcase Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSector.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
          className={`relative rounded-3xl border ${activeSector.border} bg-gradient-to-b from-white/90 to-slate-50/70 dark:from-slate-900/90 dark:to-slate-950/70 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl overflow-hidden`}
          style={{
            boxShadow: `0 25px 60px -20px ${activeSector.glow}`,
          }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-start sm:items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-tr ${activeSector.color} shadow-lg shrink-0`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {activeSector.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Domain
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {activeSector.tagline}
                </p>
              </div>
            </div>

            <Link
              href={isAuthenticated ? "/learners" : "/register"}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r ${activeSector.color} shadow-md hover:opacity-95 transition group shrink-0`}
            >
              <span>{isAuthenticated ? "Find Peers in " + activeSector.name : "Join to Exchange " + activeSector.name}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Floating Skill Constellations */}
          <div className="mt-8 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Orbiting Skills
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {activeSector.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:border-brand-500 transition cursor-default"
                >
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Reciprocal Energy Pairings */}
          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Real Reciprocal Exchange Examples
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeSector.pairings.map((pair, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      TEACH
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {pair.offer}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 shrink-0">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider block">
                      RECEIVE
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {pair.receive}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

