"use client";

import React, { useState } from "react";
import { analyzeSkillGaps } from "@/lib/ai/skill-gap";
import { SkillGapData } from "@/types/ai";
import { ExchangeModal } from "@/components/requests/ExchangeModal";
import { PeerProfile } from "@/types/learner";
import { useLumi } from "@/components/mascot/LumiContext";
import {
  BarChart2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Users,
  Target,
  ArrowRight,
  ShieldCheck,
  Award,
} from "lucide-react";

interface SkillGapViewProps {
  currentUserId: string | null;
  currentUserSkillsOffered?: string[];
  initialGoal?: string;
}

export function SkillGapView({
  currentUserId,
  currentUserSkillsOffered = [],
  initialGoal = "",
}: SkillGapViewProps) {
  const { triggerMode } = useLumi();
  const [targetRole, setTargetRole] = useState(initialGoal || "");
  const [details, setDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SkillGapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Exchange modal
  const [selectedTeacher, setSelectedTeacher] = useState<PeerProfile | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    triggerMode("analysis", 6000, "Analyzing your skill profile, verified credentials, and target role...");

    const res = await analyzeSkillGaps({
      targetRole: targetRole.trim(),
      goalDescription: details.trim(),
    });

    setIsLoading(false);

    if (res.error || !res.analysis) {
      setError(res.error || "Failed to analyze skill gaps.");
      triggerMode("encouragement", 3500, "Couldn't analyze skill gaps. Please check your network or try again.");
    } else {
      setAnalysis(res.analysis);
      triggerMode("explaining", 4500, "Skill gap analysis complete! Here are your recommended peer mentors.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search / Target Role Banner */}
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-600" />
            <span>AI Skill-Gap Analysis & Verification Dashboard</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare your profile skills against target career requirements. Differentiates self-reported skills from demonstrated competencies, identifies missing skills with priority ratings, and pairs you with verified LearnLync teachers.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Desired Target Role / Career Goal
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. 'Senior React & Node Fullstack Engineer'"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="sm:col-span-2 flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Context / Specific Industry
              </label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g. 'Fintech, microservices, cloud-native'"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !targetRole.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md disabled:opacity-50 shrink-0 h-[42px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? "Analyzing..." : "Analyze Gaps"}</span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-200">
          {error}
        </div>
      )}

      {/* Analysis Results Dashboard */}
      {analysis && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Progress & Role Status */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  Target Role Readiness Analysis
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {analysis.target_role}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {analysis.progress_percentage}%
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Goal Readiness Score
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
              <div
                className="bg-gradient-to-r from-brand-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${analysis.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Self-Reported vs Demonstrated Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Demonstrated Skills */}
            <div className="p-6 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="font-extrabold text-sm">Demonstrated / Verified Skills</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Skills verified through completed quizzes or evaluated exchange sessions.
              </p>
              {analysis.current_skills_demonstrated.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No verified skills yet. Complete quizzes or verified exchanges to prove mastery!
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.current_skills_demonstrated.map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                    >
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Self-Reported Skills */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Target className="w-5 h-5 text-brand-600" />
                <h4 className="font-extrabold text-sm">Self-Reported Profile Skills</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Skills listed on your user profile (pending assessment/exchange verification).
              </p>
              {analysis.current_skills_self_reported.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No skills listed on profile.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.current_skills_self_reported.map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Missing Skills with Learning Priorities & Suggested Teachers */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Missing Skills to Acquire for {analysis.target_role}
            </h4>

            <div className="space-y-3">
              {analysis.missing_skills.map((item, idx) => {
                const isHigh = item.priority === "high";
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isHigh
                              ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/40"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40"
                          }`}
                        >
                          {item.priority} priority
                        </span>
                        <h5 className="font-extrabold text-slate-900 dark:text-white text-base">
                          {item.skill}
                        </h5>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {item.importance}
                    </p>

                    {/* Matching Teachers from LearnLync */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-brand-600" />
                        <span>Available LearnLync Peer Teachers:</span>
                      </span>

                      {item.teachers_available.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No registered peer is currently teaching this specific skill.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {item.teachers_available.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() =>
                                setSelectedTeacher({
                                  id: t.id,
                                  full_name: t.full_name,
                                  username: t.username,
                                  avatar_url: null,
                                  bio: "",
                                  skills_offered: [item.skill],
                                  skills_needed: [],
                                  created_at: "",
                                  nexconnUserId: "",
                                })
                              }
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500 shadow-2xs transition"
                            >
                              <span>Learn from {t.full_name}</span>
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
