"use client";

import React, { useState, useTransition } from "react";
import { VerifiedCertificate, CertificateDesignConfig, CertificateTemplate } from "@/types/ai";
import { CertificateRenderer } from "./CertificateRenderer";
import { useLumi } from "@/components/mascot/LumiContext";
import {
  designCertificateWithAI,
  updateCertificateDesign,
} from "@/lib/ai/certificates";
import {
  Sparkles,
  Palette,
  Type,
  Layout,
  Check,
  Save,
  Wand2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

interface CertificateStudioProps {
  initialCertificate: VerifiedCertificate;
  onSave?: (updated: VerifiedCertificate) => void;
}

const TEMPLATE_PRESETS: Array<{
  id: CertificateTemplate;
  name: string;
  description: string;
  config: Partial<CertificateDesignConfig>;
}> = [
  {
    id: "classic-professional",
    name: "Classic Professional",
    description: "Deep navy blue borders with elegant gold foil accents",
    config: {
      template: "classic-professional",
      primary_color: "#1e3a8a",
      secondary_color: "#d97706",
      accent_color: "#2563eb",
      background_style: "clean",
      font_family: "serif",
      border_style: "double",
      badge_style: "gold_seal",
    },
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Crisp slate borders, emerald accents, and modern sans-serif",
    config: {
      template: "modern-minimal",
      primary_color: "#0f172a",
      secondary_color: "#10b981",
      accent_color: "#059669",
      background_style: "clean",
      font_family: "sans",
      border_style: "minimal",
      badge_style: "modern_shield",
    },
  },
  {
    id: "elegant-academic",
    name: "Elegant Academic",
    description: "Rich burgundy borders with warm parchment background",
    config: {
      template: "elegant-academic",
      primary_color: "#831843",
      secondary_color: "#b45309",
      accent_color: "#9d174d",
      background_style: "parchment",
      font_family: "serif",
      border_style: "ornate",
      badge_style: "ribbon",
    },
  },
  {
    id: "creative-colorful",
    name: "Creative Colorful",
    description: "Vibrant violet borders with coral accents and modern styling",
    config: {
      template: "creative-colorful",
      primary_color: "#6d28d9",
      secondary_color: "#f97316",
      accent_color: "#8b5cf6",
      background_style: "gradient",
      font_family: "display",
      border_style: "geometric",
      badge_style: "minimal_circle",
    },
  },
  {
    id: "premium-achievement",
    name: "Premium Achievement",
    description: "Midnight dark mode theme with glowing amber accents",
    config: {
      template: "premium-achievement",
      primary_color: "#e2e8f0",
      secondary_color: "#f59e0b",
      accent_color: "#fbbf24",
      background_style: "dark",
      font_family: "display",
      border_style: "ornate",
      badge_style: "gold_seal",
    },
  },
];

export function CertificateStudio({ initialCertificate }: CertificateStudioProps) {
  const { triggerMode } = useLumi();
  const [cert, setCert] = useState<VerifiedCertificate>(initialCertificate);
  const [activeTab, setActiveTab] = useState<"templates" | "customize" | "ai_designer">("templates");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiDesigning, setIsAiDesigning] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const currentConfig = cert.design_config;

  const updateConfig = (updates: Partial<CertificateDesignConfig>) => {
    setCert((prev) => ({
      ...prev,
      design_config: {
        ...prev.design_config,
        ...updates,
      },
    }));
  };

  const handleSelectTemplate = (preset: (typeof TEMPLATE_PRESETS)[0]) => {
    updateConfig(preset.config);
    setNotification({
      type: "success",
      message: `Applied "${preset.name}" template.`,
    });
  };

  const handleAIDesign = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiDesigning(true);
    setNotification(null);
    triggerMode("thinking", 5000, "Designing custom certificate typography, borders, and palette...");

    const result = await designCertificateWithAI({
      certificateId: cert.id,
      description: aiPrompt.trim(),
    });

    setIsAiDesigning(false);

    if (result.error || !result.designConfig) {
      setNotification({
        type: "error",
        message: result.error || "Failed to generate design with AI.",
      });
      triggerMode("encouragement", 3500, "Couldn't generate that design. Let's try another prompt.");
    } else {
      updateConfig(result.designConfig);
      setNotification({
        type: "success",
        message: "AI generated and applied your custom design!",
      });
      triggerMode("celebration", 4500, "Custom certificate design rendered!");
    }
  };

  const handleSaveToDatabase = () => {
    startSaving(async () => {
      setNotification(null);
      const res = await updateCertificateDesign({
        certificateId: cert.id,
        designConfig: cert.design_config,
      });

      if (res.error) {
        setNotification({ type: "error", message: res.error });
      } else {
        setNotification({
          type: "success",
          message: "Certificate design saved successfully!",
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm transition ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Studio Toolset Tabs */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand-600" />
              <span>Certificate Customization Studio</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize your verified {cert.type === "teacher" ? "Teaching" : "Learning"} certificate styling independently.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Design"}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === "templates"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Templates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("customize")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
              activeTab === "customize"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Custom Palette
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ai_designer")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "ai_designer"
                ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Designer</span>
          </button>
        </div>

        {/* Tab 1: Template Selection (Canva style) */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {TEMPLATE_PRESETS.map((preset) => {
              const isSelected = currentConfig.template === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectTemplate(preset)}
                  className={`p-4 rounded-2xl text-left border transition relative flex flex-col justify-between ${
                    isSelected
                      ? "border-brand-600 ring-2 ring-brand-500/30 bg-brand-50/40 dark:bg-brand-950/30"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {preset.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {preset.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.config.primary_color }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.config.secondary_color }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: preset.config.accent_color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Manual Customization */}
        {activeTab === "customize" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentConfig.primary_color}
                  onChange={(e) => updateConfig({ primary_color: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-1"
                />
                <input
                  type="text"
                  value={currentConfig.primary_color}
                  onChange={(e) => updateConfig({ primary_color: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Secondary Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentConfig.secondary_color}
                  onChange={(e) => updateConfig({ secondary_color: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-1"
                />
                <input
                  type="text"
                  value={currentConfig.secondary_color}
                  onChange={(e) => updateConfig({ secondary_color: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Typography Font
              </label>
              <select
                value={currentConfig.font_family}
                onChange={(e) => updateConfig({ font_family: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="serif">Classic Serif (Traditional)</option>
                <option value="sans">Modern Sans (Clean)</option>
                <option value="display">Display Bold (High Impact)</option>
                <option value="mono">Technical Monospace</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Border Frame Style
              </label>
              <select
                value={currentConfig.border_style}
                onChange={(e) => updateConfig({ border_style: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="double">Double Border with Inset</option>
                <option value="minimal">Minimal Single Border</option>
                <option value="ornate">Ornate Shadow Frame</option>
                <option value="geometric">Geometric Angular</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab 3: AI Certificate Designer ("Describe Your Certificate") */}
        {activeTab === "ai_designer" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-brand-600" />
                <span>Describe Your Dream Certificate in Plain English</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Our Gemini AI Art Director will translate your prompt into professional color palettes, typography, and styling.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder='e.g. "Create an academic certificate with ivory background, emerald borders, and golden seals."'
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAIDesign}
                disabled={isAiDesigning || !aiPrompt.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAiDesigning ? "Designing..." : "Generate AI Style"}</span>
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-400 self-center">Try prompt:</span>
              {[
                "Minimalist tech certificate with dark slate background and cyan neon glow",
                "Warm parchment certificate with crimson borders and vintage gold accents",
                "Crisp corporate certificate in royal blue and polished brass gold",
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAiPrompt(p)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Live Vector Certificate Preview Canvas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Live Preview
          </span>
          <span className="text-xs text-slate-400">
            Rendered with verified application data
          </span>
        </div>
        <CertificateRenderer certificate={cert} showActions={true} />
      </div>
    </div>
  );
}
