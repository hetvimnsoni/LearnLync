"use client";

import React, { useState } from "react";
import { UnifiedAIChat } from "./UnifiedAIChat";
import { PeerRecommendationsView } from "./PeerRecommendationsView";
import { RoadmapView } from "./RoadmapView";
import { QuizRunnerView } from "./QuizRunnerView";
import { SkillGapView } from "./SkillGapView";
import { RoadmapData, QuizAttempt } from "@/types/ai";
import {
  MessageSquare,
  Users,
  Compass,
  FileCheck,
  BarChart2,
  BookOpen,
} from "lucide-react";

interface UnifiedAIHubProps {
  currentUserId: string | null;
  currentUserSkillsOffered: string[];
  initialRoadmaps: RoadmapData[];
  initialQuizAttempts: QuizAttempt[];
  initialTab?: string;
  initialQuery?: string;
}

export function UnifiedAIHub({
  currentUserId,
  currentUserSkillsOffered,
  initialRoadmaps,
  initialQuizAttempts,
  initialTab = "chat",
  initialQuery = "",
}: UnifiedAIHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  const handleSelectStarterTab = (tab: string, query?: string) => {
    setActiveTab(tab);
    if (query) setActiveQuery(query);
  };

  const navItems = [
    { id: "chat", label: "Doubt Solver & Chat", icon: MessageSquare },
    { id: "peers", label: "Peer Matcher", icon: Users },
    { id: "courses", label: "Peer Curriculum", icon: BookOpen },
    { id: "roadmap", label: "Roadmaps", icon: Compass },
    { id: "quiz", label: "AI Quizzes", icon: FileCheck },
    { id: "skillgap", label: "Skill-Gap Analysis", icon: BarChart2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto p-1.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "chat" && (
          <UnifiedAIChat onSelectFeatureTab={handleSelectStarterTab} />
        )}

        {activeTab === "peers" && (
          <PeerRecommendationsView
            currentUserId={currentUserId}
            currentUserSkillsOffered={currentUserSkillsOffered}
            initialTab="peers"
            initialQuery={activeQuery}
          />
        )}

        {activeTab === "courses" && (
          <PeerRecommendationsView
            currentUserId={currentUserId}
            currentUserSkillsOffered={currentUserSkillsOffered}
            initialTab="curriculum"
            initialQuery={activeQuery}
          />
        )}

        {activeTab === "roadmap" && (
          <RoadmapView
            initialRoadmaps={initialRoadmaps}
            currentUserId={currentUserId}
            currentUserSkillsOffered={currentUserSkillsOffered}
            initialGoal={activeQuery}
          />
        )}

        {activeTab === "quiz" && (
          <QuizRunnerView
            initialAttempts={initialQuizAttempts}
            currentUserId={currentUserId}
            initialTopic={activeQuery}
          />
        )}

        {activeTab === "skillgap" && (
          <SkillGapView
            currentUserId={currentUserId}
            currentUserSkillsOffered={currentUserSkillsOffered}
            initialGoal={activeQuery}
          />
        )}
      </div>
    </div>
  );
}
