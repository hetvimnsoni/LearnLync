"use client";

import { useState } from "react";
import { UserProfile, Interest } from "@/types/profile";
import { Sparkles, Plus, X, Check, Save, CheckCircle2 } from "lucide-react";
import { saveInterests } from "@/app/profile/actions";

interface InterestsSectionProps {
  profile: UserProfile;
  isOwner: boolean;
}

const CATEGORIES = [
  "Technology",
  "Artificial Intelligence",
  "Cybersecurity",
  "Programming",
  "Entrepreneurship",
  "Business",
  "Designing",
  "Photography",
  "Music",
  "Gaming",
  "Sports",
  "Reading",
  "Travel",
  "Fashion",
  "Psychology",
  "Science",
  "Creative Arts",
];

const PRESET_INTERESTS: Record<string, string[]> = {
  Technology: ["Cloud Computing", "Distributed Systems", "IoT", "Quantum Computing", "Open Source Tech"],
  "Artificial Intelligence": ["LLMs", "Deep Learning", "PyTorch", "Computer Vision", "Prompt Engineering"],
  Cybersecurity: ["Ethical Hacking", "Cryptography", "Network Security", "Application Security", "Pen Testing"],
  Programming: ["Rust", "TypeScript", "Python", "Go", "C++", "Next.js", "Docker"],
  Entrepreneurship: ["SaaS Startups", "Bootstrapping", "Product Strategy", "Growth Marketing", "Fundraising"],
  Business: ["Economics", "Agile Leadership", "Product Management", "Data Analytics"],
  Designing: ["UI/UX Design", "Design Systems", "Figma", "Micro-interactions", "3D WebGL"],
  Photography: ["Street Photography", "Analog Film", "Portraiture", "Lightroom Editing"],
  Music: ["Electronic Synthesis", "Audio Engineering", "Guitar", "Music Production"],
  Gaming: ["Game Development", "Unreal Engine", "Pixel Art", "Indie Games", "eSports"],
  Sports: ["Bouldering", "Marathon Running", "Badminton", "Weightlifting", "Cycling"],
  Reading: ["Sci-Fi Literature", "Philosophy", "Engineering Biographies", "Non-Fiction"],
  Travel: ["Solo Backpacking", "Digital Nomad Lifestyle", "Cultural Exchange", "Language Immersion"],
  Fashion: ["Sustainable Streetwear", "Textile Design", "Minimalist Aesthetics"],
  Psychology: ["Cognitive Science", "Behavioral Economics", "Habit Formation", "User Psychology"],
  Science: ["Astrophysics", "Neuroscience", "Computational Biology", "Renewable Energy"],
  "Creative Arts": ["Creative Writing", "Digital Illustration", "Motion Graphics", "Ceramics"],
};

export function InterestsSection({ profile, isOwner }: InterestsSectionProps) {
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>(
    profile.interests || []
  );
  const [activeCategory, setActiveCategory] = useState<string>("Technology");
  const [customInterestName, setCustomInterestName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const isSelected = (name: string) => {
    return selectedInterests.some((i) => i.name.toLowerCase() === name.toLowerCase());
  };

  const handleTogglePreset = (name: string, category: string) => {
    if (!isOwner) return;
    if (isSelected(name)) {
      setSelectedInterests(
        selectedInterests.filter((i) => i.name.toLowerCase() !== name.toLowerCase())
      );
    } else {
      setSelectedInterests([
        ...selectedInterests,
        {
          id: "int_" + Math.random().toString(36).substring(2, 9),
          name,
          category,
          isCustom: false,
        },
      ]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInterestName.trim() || !isOwner) return;
    const name = customInterestName.trim();
    if (!isSelected(name)) {
      setSelectedInterests([
        ...selectedInterests,
        {
          id: "custom_" + Math.random().toString(36).substring(2, 9),
          name,
          category: activeCategory,
          isCustom: true,
        },
      ]);
    }
    setCustomInterestName("");
  };

  const handleRemove = (id: string) => {
    if (!isOwner) return;
    setSelectedInterests(selectedInterests.filter((i) => i.id !== id));
  };

  const handleSave = async () => {
    if (!isOwner) return;
    setSaving(true);
    setSuccess(null);
    const res = await saveInterests(selectedInterests);
    setSaving(false);
    if (!res.error) {
      setSuccess("Interests updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Header & Active Interests Cloud */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Active Interests & Passions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedInterests.length} selected interests
              </p>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Interests"}</span>
            </button>
          )}
        </div>

        {/* Selected Badges Flow */}
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedInterests.map((interest) => (
            <span
              key={interest.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-gradient-to-r dark:from-brand-950/90 dark:to-indigo-950/90 text-brand-700 dark:text-brand-200 border border-brand-200 dark:border-brand-700/60 shadow-xs"
            >
              <span>{interest.name}</span>
              <span className="text-[10px] text-brand-600/80 dark:text-brand-400/80 font-mono">
                ({interest.category})
              </span>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemove(interest.id)}
                  className="hover:text-brand-900 dark:hover:text-white transition ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))}

          {selectedInterests.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
              No interests selected yet. Choose categories below to add some!
            </p>
          )}
        </div>
      </div>

      {/* Categories & Preset Selector (Available in Edit / Owner Mode) */}
      {isOwner && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-6">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Browse & Add from Categories</h3>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeCategory === cat
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Preset Chips in Selected Category */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Popular in {activeCategory}
            </p>
            <div className="flex flex-wrap gap-2">
              {(PRESET_INTERESTS[activeCategory] || []).map((preset) => {
                const active = isSelected(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleTogglePreset(preset, activeCategory)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      active
                        ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600 ring-1 ring-emerald-400/40"
                        : "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {active ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Plus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Interest Adder */}
          <form onSubmit={handleAddCustom} className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={customInterestName}
              onChange={(e) => setCustomInterestName(e.target.value)}
              placeholder={`Add custom interest under "${activeCategory}"...`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white shrink-0 border border-slate-200 dark:border-slate-700 transition"
            >
              <Plus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Add Custom</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
