"use client";

import { ProfileTabId } from "@/types/profile";
import {
  Compass,
  User,
  Sparkles,
  GraduationCap,
  Briefcase,
  Award,
  Milestone,
  Users,
  Calendar,
  Star,
  BarChart3,
  Shield,
} from "lucide-react";

interface ProfileNavTabsProps {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  counts?: {
    skills?: number;
    projects?: number;
    achievements?: number;
    reviews?: number;
    connections?: number;
  };
}

export const TABS: { id: ProfileTabId; label: string; icon: any; countKey?: string }[] = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "personal", label: "Personal Info", icon: User },
  { id: "interests", label: "Interests", icon: Sparkles },
  { id: "skills", label: "Skills", icon: GraduationCap, countKey: "skills" },
  { id: "portfolio", label: "Portfolio", icon: Briefcase, countKey: "projects" },
  { id: "achievements", label: "Achievements", icon: Award, countKey: "achievements" },
  { id: "journey", label: "Learning Journey", icon: Milestone },
  { id: "community", label: "Community", icon: Users, countKey: "connections" },
  { id: "availability", label: "Availability", icon: Calendar },
  { id: "reviews", label: "Reviews", icon: Star, countKey: "reviews" },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "privacy", label: "Privacy & Settings", icon: Shield },
];

export function ProfileNavTabs({ activeTab, onTabChange, counts }: ProfileNavTabsProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 p-1.5 shadow-sm dark:shadow-xl backdrop-blur-xl transition-colors">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.countKey && counts ? (counts as any)[tab.countKey] : undefined;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 select-none ${
                isActive
                  ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25 ring-1 ring-white/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`} />
              <span>{tab.label}</span>
              {typeof count === "number" && count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
