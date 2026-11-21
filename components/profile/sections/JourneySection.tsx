"use client";

import { useState } from "react";
import { UserProfile, LearningJourney, LearningGoal } from "@/types/profile";
import {
  Milestone,
  Flame,
  Clock,
  CheckCircle2,
  Plus,
  Save,
  Target,
  GraduationCap,
  Sparkles,
  Calendar,
} from "lucide-react";
import { saveLearningJourney } from "@/app/profile/actions";

interface JourneySectionProps {
  profile: UserProfile;
  isOwner: boolean;
}

export function JourneySection({ profile, isOwner }: JourneySectionProps) {
  const [journey, setJourney] = useState<LearningJourney>(
    profile.learning_journey || {
      goals: [],
      learning_hours: 0,
      streak_days: 1,
      mastered_skills: [],
      upcoming_milestones: [],
    }
  );

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalSkill, setNewGoalSkill] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");

  const [newMasteredSkill, setNewMasteredSkill] = useState("");
  const [newMilestone, setNewMilestone] = useState("");

  const [isLoggingHours, setIsLoggingHours] = useState(false);
  const [hoursToAdd, setHoursToAdd] = useState(2);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const persistJourney = async (updated: LearningJourney) => {
    setJourney(updated);
    setSaving(true);
    await saveLearningJourney(updated);
    setSaving(false);
  };

  const handleUpdateGoalProgress = async (goalId: string, progress: number) => {
    const updatedGoals = journey.goals.map((g) => {
      if (g.id === goalId) {
        return {
          ...g,
          progress,
          status: progress >= 100 ? ("completed" as const) : ("in_progress" as const),
        };
      }
      return g;
    });
    const updated = { ...journey, goals: updatedGoals };
    await persistJourney(updated);
    showToast("Goal progress updated!");
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !newGoalSkill.trim()) return;

    const newGoal: LearningGoal = {
      id: "goal_" + Math.random().toString(36).substring(2, 9),
      title: newGoalTitle.trim(),
      skill: newGoalSkill.trim(),
      targetDate: newGoalDate || "2026-12-31",
      progress: 0,
      status: "in_progress",
    };

    const updated = {
      ...journey,
      goals: [...journey.goals, newGoal],
    };

    await persistJourney(updated);
    setNewGoalTitle("");
    setNewGoalSkill("");
    setNewGoalDate("");
    showToast("Learning goal created!");
  };

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedHours = (journey.learning_hours || 0) + Number(hoursToAdd);
    const updated = {
      ...journey,
      learning_hours: updatedHours,
    };
    await persistJourney(updated);
    setIsLoggingHours(false);
    showToast(`Logged ${hoursToAdd} hours to your learning journey!`);
  };

  const handleAddMasteredSkill = async () => {
    if (!newMasteredSkill.trim()) return;
    if (!journey.mastered_skills.includes(newMasteredSkill.trim())) {
      const updated = {
        ...journey,
        mastered_skills: [...journey.mastered_skills, newMasteredSkill.trim()],
      };
      await persistJourney(updated);
      setNewMasteredSkill("");
      showToast("Mastered skill added!");
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.trim()) return;
    const updated = {
      ...journey,
      upcoming_milestones: [...journey.upcoming_milestones, newMilestone.trim()],
    };
    await persistJourney(updated);
    setNewMilestone("");
    showToast("Upcoming milestone added!");
  };

  const inProgressGoals = journey.goals.filter((g) => g.status === "in_progress");
  const completedGoals = journey.goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-8 animate-fade-in">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* 1. Journey Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Learning Streak
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {journey.streak_days || 1}
              </span>
              <span className="text-sm font-semibold text-rose-500 dark:text-rose-400">Days</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Learning Hours
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {journey.learning_hours || 0}
              </span>
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Hours</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            {isOwner && (
              <button
                onClick={() => setIsLoggingHours(true)}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 underline"
              >
                + Log Hours
              </button>
            )}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed Goals
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {completedGoals.length}
              </span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Goals</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Active Learning Goals Tracker */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Active Learning Goals</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track progress on current skill milestones ({inProgressGoals.length})
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {inProgressGoals.map((goal) => (
            <div
              key={goal.id}
              className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{goal.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="text-brand-600 dark:text-brand-300 font-semibold">{goal.skill}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Target: {goal.targetDate}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-mono font-bold text-brand-600 dark:text-brand-400">
                  {goal.progress}%
                </span>
              </div>

              {/* Progress Bar & Slider */}
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>

              {isOwner && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Adjust progress:</span>
                  <div className="flex items-center gap-2">
                    {[25, 50, 75, 100].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => handleUpdateGoalProgress(goal.id, step)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                          goal.progress >= step
                            ? "bg-brand-600 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {step}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {inProgressGoals.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic py-4 text-center">
              No active learning goals right now. Set one below!
            </p>
          )}
        </div>

        {/* Add Goal Form for Owner */}
        {isOwner && (
          <form onSubmit={handleAddGoal} className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="Goal title (e.g. Master LoRA Fine-Tuning)..."
              className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="text"
              required
              value={newGoalSkill}
              onChange={(e) => setNewGoalSkill(e.target.value)}
              placeholder="Related Skill..."
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </form>
        )}
      </div>

      {/* 3. Skills Mastered & Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills Mastered */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Skills Mastered</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {journey.mastered_skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs"
              >
                ✓ {skill}
              </span>
            ))}
            {journey.mastered_skills.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No mastered skills recorded yet.</p>
            )}
          </div>

          {isOwner && (
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newMasteredSkill}
                onChange={(e) => setNewMasteredSkill(e.target.value)}
                placeholder="Add newly mastered skill..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs"
              />
              <button
                type="button"
                onClick={handleAddMasteredSkill}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white shrink-0 border border-slate-200 dark:border-transparent"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Upcoming Milestones */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Milestone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Upcoming Milestones</h3>
          </div>

          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {journey.upcoming_milestones.map((m, idx) => (
              <li
                key={idx}
                className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                <span>{m}</span>
              </li>
            ))}
            {journey.upcoming_milestones.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No upcoming milestones listed yet.</p>
            )}
          </ul>

          {isOwner && (
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                placeholder="Next big milestone..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-xs"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white shrink-0 border border-slate-200 dark:border-transparent"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log Hours Modal */}
      {isLoggingHours && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Log Learning Hours</h3>
            <form onSubmit={handleLogHours} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">Hours to add</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={hoursToAdd}
                  onChange={(e) => setHoursToAdd(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoggingHours(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Confirm Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
