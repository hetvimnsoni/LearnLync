"use client";

import { useState } from "react";
import { UserProfile, PortfolioProject, PortfolioItemType } from "@/types/profile";
import {
  Briefcase,
  Plus,
  ExternalLink,
  Github,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { ProjectModal } from "../modals/ProjectModal";
import { savePortfolioProjects } from "@/app/profile/actions";

interface PortfolioSectionProps {
  profile: UserProfile;
  isOwner: boolean;
}

export function PortfolioSection({ profile, isOwner }: PortfolioSectionProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>(
    profile.portfolio_projects || []
  );
  const [filterType, setFilterType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProject = async (project: PortfolioProject) => {
    let updated: PortfolioProject[];
    if (editingProject) {
      updated = projects.map((p) => (p.id === project.id ? project : p));
    } else {
      updated = [project, ...projects];
    }
    setProjects(updated);
    setEditingProject(null);

    setSaving(true);
    await savePortfolioProjects(updated);
    setSaving(false);
    showToast("Portfolio item saved!");
  };

  const handleDeleteProject = async (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    setSaving(true);
    await savePortfolioProjects(updated);
    setSaving(false);
    showToast("Portfolio item removed.");
  };

  const handleToggleFeatured = async (id: string) => {
    if (!isOwner) return;
    const updated = projects.map((p) =>
      p.id === id ? { ...p, featured: !p.featured } : p
    );
    setProjects(updated);
    await savePortfolioProjects(updated);
    showToast("Featured status updated!");
  };

  const filteredProjects =
    filterType === "all"
      ? projects
      : projects.filter((p) => p.type === filterType);

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header and Filter Controls */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Portfolio & Showcase</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Projects, credentials, and published research ({projects.length})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Type Filters */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {["all", "project", "certificate", "course", "research"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                  filterType === t
                    ? "bg-brand-600 text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {isOwner && (
            <button
              onClick={() => {
                setEditingProject(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 overflow-hidden shadow-sm dark:shadow-xl hover:border-indigo-500/40 transition duration-300 flex flex-col justify-between group"
          >
            <div>
              {/* Thumbnail */}
              <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-70" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-md">
                    {project.type}
                  </span>
                  {project.featured && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md">
                      Featured
                    </span>
                  )}
                </div>

                {isOwner && (
                  <button
                    onClick={() => handleToggleFeatured(project.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 text-amber-500 dark:text-amber-400 hover:bg-white dark:hover:bg-slate-800 transition"
                    title={project.featured ? "Unfeature" : "Feature this item"}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        project.featured ? "fill-amber-400" : "text-slate-400"
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Details */}
              <div className="p-5 space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                  {project.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Links and Action Footer */}
            <div className="px-5 pb-5 pt-3 border-t border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent transition"
                    title="View Source on GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800/60 transition"
                  >
                    <span>Live Demo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {isOwner && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingProject(project);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 dark:text-slate-400 italic">
            No items in this category yet. Click "Add Item" to showcase your work!
          </div>
        )}
      </div>

      {isModalOpen && (
        <ProjectModal
          initialProject={editingProject}
          onSave={handleSaveProject}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
}
