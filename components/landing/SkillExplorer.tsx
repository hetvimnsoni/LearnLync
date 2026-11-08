"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Palette,
  Globe2,
  Music2,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Sparkles,
  ArrowLeftRight,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: typeof Code2;
  description: string;
  popularSkills: string[];
  exchangePairings: { teach: string; learn: string }[];
  accentColor: string;
}

const CATEGORIES: Category[] = [
  {
    id: "tech",
    name: "Programming & Tech",
    icon: Code2,
    description: "From systems programming to modern full-stack web and artificial intelligence.",
    popularSkills: ["Python", "React & Next.js", "Machine Learning", "TypeScript", "Rust", "PostgreSQL", "Docker", "DevOps"],
    exchangePairings: [
      { teach: "Python for Data Science", learn: "UI/UX & Product Design" },
      { teach: "React & Frontend Architecture", learn: "Cloud & DevOps" },
      { teach: "Backend API Design (Node/Go)", learn: "Mobile Development (Flutter)" },
    ],
    accentColor: "from-blue-500 to-indigo-600",
  },
  {
    id: "design",
    name: "Design & Creativity",
    icon: Palette,
    description: "Visual systems, user experience, typography, 3D modeling, and branding.",
    popularSkills: ["Figma Design Systems", "UI/UX Research", "Motion Design", "3D Blender", "Brand Identity", "Design Tokens"],
    exchangePairings: [
      { teach: "Figma Component Systems", learn: "Frontend React Development" },
      { teach: "User Journey & Wireframing", learn: "Conversational Spanish" },
      { teach: "3D Animation & Blender", learn: "Music Production & Sound Design" },
    ],
    accentColor: "from-violet-500 to-purple-600",
  },
  {
    id: "languages",
    name: "Languages & Linguistics",
    icon: Globe2,
    description: "Fluency, conversational practice, pronunciation, and cultural immersion.",
    popularSkills: ["Conversational Spanish", "Japanese (JLPT)", "French Pronunciation", "German", "Business English", "Mandarin"],
    exchangePairings: [
      { teach: "Native Spanish Practice", learn: "Web Development Basics" },
      { teach: "Conversational Japanese", learn: "Creative Writing & Storytelling" },
      { teach: "French Language & Grammar", learn: "Acoustic Guitar Basics" },
    ],
    accentColor: "from-emerald-500 to-teal-600",
  },
  {
    id: "music",
    name: "Music & Audio",
    icon: Music2,
    description: "Acoustic instruments, music theory, mixing, recording, and digital audio.",
    popularSkills: ["Acoustic Guitar", "Music Theory", "Logic Pro / Ableton", "Vocal Training", "Piano Keys", "Audio Mastering"],
    exchangePairings: [
      { teach: "Acoustic Guitar Fingerpicking", learn: "Digital Photography & Lightroom" },
      { teach: "Electronic Music Synthesis", learn: "Python for Automation" },
      { teach: "Music Theory & Chord Progressions", learn: "Public Speaking & Stage Presence" },
    ],
    accentColor: "from-amber-500 to-orange-600",
  },
  {
    id: "communication",
    name: "Communication & Leadership",
    icon: MessageSquare,
    description: "Public speaking, pitch delivery, conflict resolution, and storytelling.",
    popularSkills: ["Public Speaking", "Startup Pitch Decks", "Executive Storytelling", "Negotiation", "Technical Writing"],
    exchangePairings: [
      { teach: "Pitch Deck Storytelling", learn: "Financial Modeling & Spreadsheets" },
      { teach: "Conference Presentation Skills", learn: "Advanced TypeScript" },
      { teach: "Technical Documentation Writing", learn: "System Architecture" },
    ],
    accentColor: "from-rose-500 to-pink-600",
  },
  {
    id: "business",
    name: "Business & Productivity",
    icon: TrendingUp,
    description: "Product discovery, personal systems, financial literacy, and marketing.",
    popularSkills: ["Product Management", "Growth Marketing", "Notion Systems", "Financial Literacy", "SEO & Copywriting"],
    exchangePairings: [
      { teach: "Product Roadmap Frameworks", learn: "Data Visualization & SQL" },
      { teach: "Search Engine Optimization", learn: "Graphic Design Basics" },
      { teach: "Personal Productivity Systems", learn: "Conversational French" },
    ],
    accentColor: "from-cyan-500 to-blue-600",
  },
];

export function SkillExplorer({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [activeCategory, setActiveCategory] = useState<string>("tech");

  const current = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  const IconComponent = current.icon;

  return (
    <div className="w-full">
      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md shadow-slate-900/10 scale-105"
                  : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700/60"
              }`}
            >
              <CatIcon className={`w-4 h-4 ${isActive ? "text-accent-amber" : "text-slate-400"}`} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Category Showcase Card */}
      <div className="mt-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-slate-900/5">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-center justify-between pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/50 dark:border-brand-800/50">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Domain</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${current.accentColor} text-white shadow-md`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {current.name}
              </h3>
            </div>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              {current.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={isAuthenticated ? "/learners" : "/register"}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 transition shadow-md shadow-slate-900/10 group"
            >
              <span>{isAuthenticated ? "Browse Peers in this Domain" : "Join to Exchange Skills"}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Popular Skills in this Category */}
        <div className="mt-8 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            High-Demand Skills in {current.name}
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {current.popularSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 hover:border-brand-400 dark:hover:border-brand-500 transition cursor-default"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Real Sample Exchange Pairings */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-4">
            Example Reciprocal Pairings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {current.exchangePairings.map((pair, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 flex flex-col justify-between hover:border-brand-300 dark:hover:border-brand-700 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>You Teach:</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 font-mono">
                      OFFER
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {pair.teach}
                  </div>
                </div>

                <div className="my-3 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                    <span>You Learn:</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950/80 font-mono">
                      DESIRED
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {pair.learn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

