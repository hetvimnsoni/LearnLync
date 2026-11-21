"use client";

import React, { useState } from "react";
import {
  generateAILearningRoadmap,
  updateRoadmapStage,
} from "@/lib/ai/roadmaps";
import { RoadmapData, RoadmapMilestone } from "@/types/ai";
import { ExchangeModal } from "@/components/requests/ExchangeModal";
import { PeerProfile } from "@/types/learner";
import { useLumi } from "@/components/mascot/LumiContext";
import {
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Target,
  Circle,
  Users,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface RoadmapViewProps {
  initialRoadmaps?: RoadmapData[];
  currentUserId: string | null;
  currentUserSkillsOffered?: string[];
  initialGoal?: string;
}

export function RoadmapView({
  initialRoadmaps = [],
  currentUserId,
  currentUserSkillsOffered = [],
  initialGoal = "",
}: RoadmapViewProps) {
  const { triggerMode } = useLumi();
  const [roadmaps, setRoadmaps] = useState<RoadmapData[]>(initialRoadmaps);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapData | null>(
    initialRoadmaps[0] || null
  );
  const [goalInput, setGoalInput] = useState(initialGoal);
  const [currentLevel, setCurrentLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exchange modal
  const [selectedTeacher, setSelectedTeacher] = useState<PeerProfile | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    triggerMode("thinking", 6000, "Mapping your step-by-step peer roadmap...");

    const res = await generateAILearningRoadmap({
      goal: goalInput.trim(),
      currentLevel,
    });

    setIsGenerating(false);

    if (res.error || !res.roadmap) {
      setError(res.error || "Failed to generate roadmap.");
      triggerMode("encouragement", 3500, "Couldn't generate that roadmap. Let's try adjusting the goal.");
    } else {
      setRoadmaps((prev) => [res.roadmap!, ...prev]);
      setSelectedRoadmap(res.roadmap);
      triggerMode("explaining", 4500, "Roadmap ready! Here are your sequenced milestones.");
    }
  };

  const handleToggleStage = async (stage: RoadmapMilestone) => {
    if (!selectedRoadmap) return;

    const nextStatus: "pending" | "in_progress" | "completed" =
      stage.status === "completed"
        ? "in_progress"
        : stage.status === "in_progress"
        ? "completed"
        : "in_progress";

    const prevStages = selectedRoadmap.stages;
    const updatedStages: RoadmapMilestone[] = prevStages.map((s) =>
      s.id === stage.id ? { ...s, status: nextStatus } : s
    );

    const completed = updatedStages.filter((s) => s.status === "completed").length;
    const progress = Math.round((completed / updatedStages.length) * 100);

    const updatedRoadmap = {
      ...selectedRoadmap,
      stages: updatedStages,
      progress_percentage: progress,
    };

    setSelectedRoadmap(updatedRoadmap);
    setRoadmaps((prev) =>
      prev.map((r) => (r.id === selectedRoadmap.id ? updatedRoadmap : r))
    );

    if (nextStatus === "completed") {
      if (progress === 100) {
        triggerMode("celebration", 6000, "Outstanding! You've conquered the entire learning roadmap!");
      } else {
        triggerMode("celebration", 4000, "Milestone achieved! One step closer to your goal!");
      }
    }

    if (selectedRoadmap.id && currentUserId) {
      await updateRoadmapStage({
        roadmapId: selectedRoadmap.id,
        stageId: stage.id,
        newStatus: nextStatus as any,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Creation Banner */}
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-600" />
            <span>Generate Personalized Learning Roadmap</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tell the AI what you want to master (e.g. &quot;Full-Stack Web Developer&quot;, &quot;Data Engineer&quot;). AI will sequence your learning path and match real LearnLync peers to teach each milestone.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-3">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. 'I want to become a full-stack Next.js and TypeScript developer'"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value as any)}
              className="px-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <button
              type="submit"
              disabled={isGenerating || !goalInput.trim()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? "Building..." : "Generate"}</span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-200">
          {error}
        </div>
      )}

      {/* Roadmaps Explorer */}
      {selectedRoadmap ? (
        <div className="space-y-6">
          {/* Header & Progress Bar */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  Active Roadmap • Level: {selectedRoadmap.current_level}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedRoadmap.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Goal: {selectedRoadmap.goal}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {selectedRoadmap.progress_percentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
              <div
                className="bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${selectedRoadmap.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Interactive Stages Timeline */}
          <div className="space-y-4">
            {selectedRoadmap.stages.map((stage, idx) => {
              const isCompleted = stage.status === "completed";
              const isInProgress = stage.status === "in_progress";

              return (
                <div
                  key={stage.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    isCompleted
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                      : isInProgress
                      ? "bg-white/90 dark:bg-slate-900/90 border-brand-500 shadow-md ring-2 ring-brand-500/20"
                      : "bg-white/70 dark:bg-slate-900/70 border-slate-200/90 dark:border-slate-800 opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStage(stage)}
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition ${
                          isCompleted
                            ? "bg-emerald-600 text-white shadow-sm"
                            : isInProgress
                            ? "bg-brand-600 text-white shadow-sm animate-pulse"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        }`}
                        title="Click to toggle stage completion status"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isInProgress ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {stage.title}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              isCompleted
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                                : isInProgress
                                ? "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {stage.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {stage.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStage(stage)}
                      className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline self-start sm:self-auto shrink-0"
                    >
                      {isCompleted ? "Mark Incomplete" : "Mark Completed"}
                    </button>
                  </div>

                  {/* Skills in Stage */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Skills:
                    </span>
                    {stage.skills_to_learn.map((sk, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>

                  {/* Linked LearnLync Peers who can teach this stage */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-brand-600" />
                      <span>LearnLync Teachers for this Stage:</span>
                    </span>

                    {stage.suggested_peers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No active registered teacher yet for this specific stage. You can study independently or invite a peer!
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {stage.suggested_peers.map((peer) => (
                          <button
                            key={peer.id}
                            type="button"
                            onClick={() =>
                              setSelectedTeacher({
                                id: peer.id,
                                full_name: peer.full_name,
                                username: peer.username,
                                avatar_url: null,
                                bio: "",
                                skills_offered: peer.skills_offered,
                                skills_needed: [],
                                created_at: "",
                                nexconnUserId: "",
                              })
                            }
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500 shadow-2xs transition"
                          >
                            <span>Connect with {peer.full_name}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
          <Compass className="w-12 h-12 text-brand-600 mx-auto" />
          <h4 className="font-bold text-base text-slate-900 dark:text-white">
            No Learning Roadmaps Yet
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Type your target role above to generate a visual, stage-by-stage learning path with matching LearnLync teachers.
          </p>
        </div>
      )}

      {/* Exchange Modal */}
      {selectedTeacher && (
        <ExchangeModal
          peer={selectedTeacher}
          currentUserSkillsOffered={currentUserSkillsOffered}
          isOpen={true}
          onClose={() => setSelectedTeacher(null)}
          onSuccess={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  );
}
