"use client";

import { useState } from "react";
import { UserProfile, SkillTeach, SkillLearn } from "@/types/profile";
import {
  GraduationCap,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  Sparkles,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { SkillModal } from "../modals/SkillModal";
import { saveSkillsTeach, saveSkillsLearn } from "@/app/profile/actions";

interface SkillsSectionProps {
  profile: UserProfile;
  isOwner: boolean;
}

export function SkillsSection({ profile, isOwner }: SkillsSectionProps) {
  const [teachSkills, setTeachSkills] = useState<SkillTeach[]>(
    profile.skills_teach_detailed || []
  );
  const [learnSkills, setLearnSkills] = useState<SkillLearn[]>(
    profile.skills_learn_detailed || []
  );

  const [modalMode, setModalMode] = useState<"teach" | "learn" | null>(null);
  const [editingTeachSkill, setEditingTeachSkill] = useState<SkillTeach | null>(null);
  const [editingLearnSkill, setEditingLearnSkill] = useState<SkillLearn | null>(null);

  const [savingTeach, setSavingTeach] = useState(false);
  const [savingLearn, setSavingLearn] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Teach Skill operations
  const handleSaveTeach = async (skill: SkillTeach) => {
    let updated: SkillTeach[];
    if (editingTeachSkill) {
      updated = teachSkills.map((s) => (s.id === skill.id ? skill : s));
    } else {
      updated = [...teachSkills, skill];
    }
    setTeachSkills(updated);
    setEditingTeachSkill(null);

    setSavingTeach(true);
    await saveSkillsTeach(updated);
    setSavingTeach(false);
    showToast("Teaching skill updated!");
  };

  const handleDeleteTeach = async (id: string) => {
    const updated = teachSkills.filter((s) => s.id !== id);
    setTeachSkills(updated);
    setSavingTeach(true);
    await saveSkillsTeach(updated);
    setSavingTeach(false);
    showToast("Skill removed from teach list.");
  };

  // Learn Skill operations
  const handleSaveLearn = async (skill: SkillLearn) => {
    let updated: SkillLearn[];
    if (editingLearnSkill) {
      updated = learnSkills.map((s) => (s.id === skill.id ? skill : s));
    } else {
      updated = [...learnSkills, skill];
    }
    setLearnSkills(updated);
    setEditingLearnSkill(null);

    setSavingLearn(true);
    await saveSkillsLearn(updated);
    setSavingLearn(false);
    showToast("Learning goal updated!");
  };

  const handleDeleteLearn = async (id: string) => {
    const updated = learnSkills.filter((s) => s.id !== id);
    setLearnSkills(updated);
    setSavingLearn(true);
    await saveSkillsLearn(updated);
    setSavingLearn(false);
    showToast("Skill removed from learning list.");
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case "Expert":
        return "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60";
      case "Advanced":
        return "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60";
      case "Intermediate":
        return "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* =========================================================================
          COLLECTION 1: SKILLS I CAN TEACH
      ========================================================================== */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Skills I Can Teach</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Skills you are willing to mentor and share with peers ({teachSkills.length})
              </p>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => {
                setEditingTeachSkill(null);
                setModalMode("teach");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Teachable Skill</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 transition duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{skill.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{skill.experience} experience</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getProficiencyColor(
                      skill.proficiency
                    )}`}
                  >
                    {skill.proficiency}
                  </span>
                </div>

                {/* Topics Covered */}
                {skill.topics && skill.topics.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Topics Covered
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {skill.topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teaching Preferences */}
                {skill.teachingPreferences && skill.teachingPreferences.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Teaching Style
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {skill.teachingPreferences.join(" • ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Owner */}
              {isOwner && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                  <button
                    onClick={() => {
                      setEditingTeachSkill(skill);
                      setModalMode("teach");
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                    title="Edit Skill"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeach(skill.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Delete Skill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {teachSkills.length === 0 && (
            <div className="col-span-2 py-10 text-center text-xs text-slate-500 dark:text-slate-400 italic">
              No skills listed to teach yet. Click "Add Teachable Skill" to share your expertise.
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          COLLECTION 2: SKILLS I WANT TO LEARN
      ========================================================================== */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Skills I Want to Learn</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Skills you are eager to develop through peer exchange ({learnSkills.length})
              </p>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => {
                setEditingLearnSkill(null);
                setModalMode("learn");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Learning Interest</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {learnSkills.map((skill) => (
            <div
              key={skill.id}
              className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/40 transition duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{skill.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Current Level:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{skill.currentLevel}</span>
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                    {skill.progress}% Complete
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${skill.progress}%` }}
                  />
                </div>

                {/* Learning Objectives */}
                {skill.learningObjectives && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Learning Goal
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {skill.learningObjectives}
                    </p>
                  </div>
                )}

                {/* Preferred Learning Style */}
                {skill.preferredLearningStyle && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Preferred Style
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{skill.preferredLearningStyle}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Owner */}
              {isOwner && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                  <button
                    onClick={() => {
                      setEditingLearnSkill(skill);
                      setModalMode("learn");
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                    title="Edit Goal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLearn(skill.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {learnSkills.length === 0 && (
            <div className="col-span-2 py-10 text-center text-xs text-slate-500 dark:text-slate-400 italic">
              No learning interests added yet. Click "Add Learning Interest" to specify what you want to learn.
            </div>
          )}
        </div>
      </div>

      {/* Modal for adding/editing skills */}
      {modalMode && (
        <SkillModal
          mode={modalMode}
          initialTeachSkill={editingTeachSkill}
          initialLearnSkill={editingLearnSkill}
          onSaveTeach={handleSaveTeach}
          onSaveLearn={handleSaveLearn}
          onClose={() => {
            setModalMode(null);
            setEditingTeachSkill(null);
            setEditingLearnSkill(null);
          }}
        />
      )}
    </div>
  );
}
