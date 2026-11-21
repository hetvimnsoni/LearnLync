"use client";

import { useState } from "react";
import { SkillTeach, SkillLearn, ProficiencyLevel } from "@/types/profile";
import { X, GraduationCap, BookOpen, Save } from "lucide-react";

interface SkillModalProps {
  mode: "teach" | "learn";
  initialTeachSkill?: SkillTeach | null;
  initialLearnSkill?: SkillLearn | null;
  onSaveTeach?: (skill: SkillTeach) => void;
  onSaveLearn?: (skill: SkillLearn) => void;
  onClose: () => void;
}

export function SkillModal({
  mode,
  initialTeachSkill,
  initialLearnSkill,
  onSaveTeach,
  onSaveLearn,
  onClose,
}: SkillModalProps) {
  // Teach fields
  const [name, setName] = useState(
    mode === "teach" ? initialTeachSkill?.name || "" : initialLearnSkill?.name || ""
  );
  const [proficiency, setProficiency] = useState<ProficiencyLevel>(
    mode === "teach"
      ? initialTeachSkill?.proficiency || "Advanced"
      : initialLearnSkill?.currentLevel || "Beginner"
  );
  const [experience, setExperience] = useState(initialTeachSkill?.experience || "2+ years");
  const [topicsInput, setTopicsInput] = useState(
    initialTeachSkill?.topics?.join(", ") || ""
  );
  const [teachingPrefInput, setTeachingPrefInput] = useState(
    initialTeachSkill?.teachingPreferences?.join(", ") || "1-on-1 Mentorship, Code Reviews"
  );

  // Learn fields
  const [learningObjectives, setLearningObjectives] = useState(
    initialLearnSkill?.learningObjectives || ""
  );
  const [preferredLearningStyle, setPreferredLearningStyle] = useState(
    initialLearnSkill?.preferredLearningStyle || "Hands-on projects and pair programming"
  );
  const [progress, setProgress] = useState(initialLearnSkill?.progress || 20);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode === "teach" && onSaveTeach) {
      const topics = topicsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const teachingPreferences = teachingPrefInput
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const skill: SkillTeach = {
        id: initialTeachSkill?.id || "st_" + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        proficiency,
        experience: experience.trim(),
        topics,
        teachingPreferences,
      };
      onSaveTeach(skill);
    } else if (mode === "learn" && onSaveLearn) {
      const skill: SkillLearn = {
        id: initialLearnSkill?.id || "sl_" + Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        currentLevel: proficiency,
        learningObjectives: learningObjectives.trim(),
        preferredLearningStyle: preferredLearningStyle.trim(),
        progress,
      };
      onSaveLearn(skill);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                mode === "teach"
                  ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400"
              }`}
            >
              {mode === "teach" ? (
                <GraduationCap className="w-5 h-5" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                {mode === "teach" ? "Skill I Can Teach" : "Skill I Want to Learn"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === "teach"
                  ? "Share your expertise with peer learners"
                  : "Define your learning goals and preferences"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
              Skill Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Next.js, PyTorch, Figma, Docker"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                {mode === "teach" ? "Proficiency Level" : "Current Level"}
              </label>
              <select
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value as ProficiencyLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                {mode === "teach" && <option value="Expert">Expert</option>}
              </select>
            </div>

            {mode === "teach" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Experience
                </label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 3+ years"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Progress ({progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 mt-3 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>
            )}
          </div>

          {mode === "teach" ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Specific Topics Covered (Comma-separated)
                </label>
                <input
                  type="text"
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  placeholder="Hooks, Server Actions, Responsive Design"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Teaching Preferences (Comma-separated)
                </label>
                <input
                  type="text"
                  value={teachingPrefInput}
                  onChange={(e) => setTeachingPrefInput(e.target.value)}
                  placeholder="1-on-1 Mentorship, Code Reviews, Hands-on Projects"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Learning Objectives
                </label>
                <textarea
                  rows={2}
                  value={learningObjectives}
                  onChange={(e) => setLearningObjectives(e.target.value)}
                  placeholder="What specific project or capability do you want to accomplish?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Preferred Learning Style
                </label>
                <input
                  type="text"
                  value={preferredLearningStyle}
                  onChange={(e) => setPreferredLearningStyle(e.target.value)}
                  placeholder="Hands-on pair programming, visual diagrams"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Skill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
