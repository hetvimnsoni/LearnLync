"use client";

import { UserProfile, ProfileStatistics } from "@/types/profile";
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  Award,
  Sparkles,
  Flame,
  ArrowRight,
  Calendar,
  Clock,
} from "lucide-react";

interface OverviewSectionProps {
  profile: UserProfile;
  stats: ProfileStatistics;
  onNavigateTab: (tabId: any) => void;
  isOwner: boolean;
}

export function OverviewSection({
  profile,
  stats,
  onNavigateTab,
}: OverviewSectionProps) {
  const teachSkills = profile.skills_teach_detailed || [];
  const learnSkills = profile.skills_learn_detailed || [];
  const projects = profile.portfolio_projects || [];
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 2);
  const displayProjects = featuredProjects.length > 0 ? featuredProjects : projects.slice(0, 2);
  const achievements = (profile.achievements || []).filter((a) => a.unlocked).slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in transition-colors">
      {/* 1. Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col justify-between hover:border-brand-500/40 transition group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Exchanges</span>
            <Sparkles className="w-4 h-4 text-brand-500 dark:text-brand-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.skills_exchanged}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Completed matches</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col justify-between hover:border-emerald-500/40 transition group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Taught</span>
            <GraduationCap className="w-4 h-4 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.people_taught}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Peers mentored</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Learned</span>
            <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.skills_learned}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">New skills acquired</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col justify-between hover:border-blue-500/40 transition group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sessions</span>
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.completed_sessions}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Sessions logged</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col justify-between hover:border-amber-500/40 transition group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hours</span>
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.learning_hours}h</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Time invested</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col justify-between hover:border-rose-500/40 transition group">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Streak</span>
            <Flame className="w-4 h-4 text-rose-500 animate-pulse group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.learning_streak}d</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Active streak</span>
        </div>
      </div>

      {/* 2. Detailed About Me Summary Card */}
      {profile.about_details && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 flex items-center justify-center font-bold">
                💡
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">About Me &amp; Learning Goals</h2>
            </div>
            <button
              onClick={() => onNavigateTab("personal")}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 flex items-center gap-1 transition"
            >
              <span>View Full Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {profile.about_details.introduction && (
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Introduction
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {profile.about_details.introduction}
                </p>
              </div>
            )}
            {profile.about_details.looking_for && (
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  Looking For in LearnLync
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {profile.about_details.looking_for}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Skills Snapshot (Teach vs Learn) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills I Can Teach */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Skills I Can Teach</h3>
              </div>
              <button
                onClick={() => onNavigateTab("skills")}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 flex items-center gap-1"
              >
                <span>View All ({teachSkills.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {teachSkills.slice(0, 3).map((skill) => (
                <div
                  key={skill.id}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{skill.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {skill.experience} • {skill.topics.slice(0, 2).join(", ")}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    {skill.proficiency}
                  </span>
                </div>
              ))}
              {teachSkills.length === 0 && (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No skills listed to teach yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skills I Want to Learn */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Skills I Want to Learn</h3>
              </div>
              <button
                onClick={() => onNavigateTab("skills")}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 flex items-center gap-1"
              >
                <span>View All ({learnSkills.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {learnSkills.slice(0, 3).map((skill) => (
                <div
                  key={skill.id}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{skill.name}</h4>
                    <span className="text-[11px] font-mono font-bold text-brand-600 dark:text-brand-400">
                      {skill.progress}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
                      style={{ width: `${skill.progress}%` }}
                    />
                  </div>
                </div>
              ))}
              {learnSkills.length === 0 && (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No learning goals added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Featured Portfolio Showcase */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Featured Portfolio</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Projects, credentials, and research</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("portfolio")}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 transition"
          >
            <span>Explore All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 overflow-hidden group hover:border-indigo-500/40 transition duration-300 flex flex-col justify-between"
            >
              <div className="relative h-40 w-full overflow-hidden">
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                {project.featured && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md">
                    Featured
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                  {project.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.technologies.slice(0, 3).map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {displayProjects.length === 0 && (
            <div className="col-span-2 py-8 text-center text-xs text-slate-400 italic">
              No portfolio projects showcased yet.
            </div>
          )}
        </div>
      </div>

      {/* 5. Unlocked Badges Bar */}
      {achievements.length > 0 && (
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Key Achievements</h3>
            </div>
            <button
              onClick={() => onNavigateTab("achievements")}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 flex items-center gap-1"
            >
              <span>View Badges</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {achievements.map((badge) => (
              <div
                key={badge.id}
                className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{badge.title}</h4>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Unlocked</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
