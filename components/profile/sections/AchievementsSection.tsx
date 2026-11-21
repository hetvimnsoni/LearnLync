"use client";

import { UserProfile, AchievementBadge } from "@/types/profile";
import {
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
  Flame,
  Zap,
  GraduationCap,
  Users,
  Code,
  ShieldCheck,
} from "lucide-react";

interface AchievementsSectionProps {
  profile: UserProfile;
}

const BADGE_ICONS: Record<string, any> = {
  Sparkles,
  GraduationCap,
  Users,
  Flame,
  Zap,
  Award,
  Code,
  ShieldCheck,
};

export function AchievementsSection({ profile }: AchievementsSectionProps) {
  const achievements = profile.achievements || [];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Achievements & Badges</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Unlocked through authentic peer-to-peer exchanges and verified milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Unlocked
            </span>
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {unlockedCount} / {achievements.length}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((badge) => {
          const Icon = BADGE_ICONS[badge.icon] || Award;
          const isUnlocked = badge.unlocked;

          return (
            <div
              key={badge.id}
              className={`p-6 rounded-3xl border transition duration-300 flex flex-col justify-between space-y-4 ${
                isUnlocked
                  ? "bg-white/90 dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-amber-500/40 shadow-sm dark:shadow-xl"
                  : "bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/50 opacity-60 hover:opacity-80"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${
                      isUnlocked
                        ? "bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 text-amber-600 dark:text-amber-400 border-amber-300/40 dark:border-amber-500/30"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{badge.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress and Unlock criteria */}
              <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Criteria:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 text-right text-[10px]">
                    {badge.criteria}
                  </span>
                </div>

                {badge.maxProgress && badge.maxProgress > 1 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span>Progress</span>
                      <span>
                        {badge.progress || 0} / {badge.maxProgress}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                        style={{
                          width: `${Math.min(
                            100,
                            ((badge.progress || 0) / badge.maxProgress) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
