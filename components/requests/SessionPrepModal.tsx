"use client";

import React, { useState } from "react";
import { prepareAISession } from "@/lib/ai/sessions";
import { SessionPrepData } from "@/types/ai";
import { useLumi } from "@/components/mascot/LumiContext";
import {
  Sparkles,
  Calendar,
  Clock,
  HelpCircle,
  Code2,
  CheckCircle,
  X,
  Target,
  FileText,
} from "lucide-react";

interface SessionPrepModalProps {
  exchangeId: string;
  skillOffered: string;
  peerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionPrepModal({
  exchangeId,
  skillOffered,
  peerName,
  isOpen,
  onClose,
}: SessionPrepModalProps) {
  const { triggerMode } = useLumi();
  const [prep, setPrep] = useState<SessionPrepData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    triggerMode("reading", 6000, `Preparing timed agenda & questions for ${skillOffered}...`);
    const res = await prepareAISession(exchangeId);
    setIsLoading(false);

    if (res.error || !res.prep) {
      setError(res.error || "Failed to generate session plan.");
      triggerMode("encouragement", 3500, "Could not load session agenda. Please try again.");
    } else {
      setPrep(res.prep);
      triggerMode("explaining", 4000, "Session plan ready! Review your agenda before meeting.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent-amber" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                AI Session Preparation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tailored 1-on-1 agenda for teaching & learning <strong className="text-brand-600">{skillOffered}</strong> with {peerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          {!prep && !isLoading && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 mx-auto flex items-center justify-center">
                <Target className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Prepare Your Skill Exchange Session
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Let AI analyze your exchange details to produce clear learning objectives, a timed agenda, learner discussion questions, and practical coding exercises.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Session Plan</span>
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-500">
                Crafting tailored learning objectives, timed agenda, and exercises...
              </p>
            </div>
          )}

          {prep && (
            <div className="space-y-6">
              {/* Learning Objectives */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-600" />
                  <span>Learning Objectives</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(prep.learning_objectives || []).map((obj, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs flex items-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-200">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timed Agenda */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Recommended Session Agenda</span>
                </h4>
                <div className="space-y-2">
                  {(prep.agenda || []).map((step, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-start gap-3"
                    >
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                        {step.time_estimate}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {step.topic}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions for Learner */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-accent-amber" />
                  <span>Questions the Learner Can Ask</span>
                </h4>
                <ul className="space-y-2">
                  {(prep.suggested_questions_for_learner || []).map((q, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200"
                    >
                      &quot;{q}&quot;
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hands-on Exercises */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  <span>Hands-on Exercises to Try Together</span>
                </h4>
                <div className="space-y-2">
                  {(prep.hands_on_exercises || []).map((ex, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200"
                    >
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
          {prep && (
            <button
              type="button"
              onClick={handleGenerate}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Regenerate
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
