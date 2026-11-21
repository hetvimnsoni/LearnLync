"use client";

import React, { useState, useTransition } from "react";
import { recordSessionCompletion } from "@/lib/ai/sessions";
import { useLumi } from "@/components/mascot/LumiContext";
import {
  CheckCircle2,
  X,
  Award,
  Sparkles,
  AlertCircle,
  FileText,
  Star,
} from "lucide-react";
import Link from "next/link";

interface SessionCompleteModalProps {
  exchangeId: string;
  skillOffered: string;
  peerName: string;
  isOpen: boolean;
  onClose: () => void;
  onCompleteSuccess?: () => void;
}

export function SessionCompleteModal({
  exchangeId,
  skillOffered,
  peerName,
  isOpen,
  onClose,
  onCompleteSuccess,
}: SessionCompleteModalProps) {
  const { triggerMode } = useLumi();
  const [topicsCovered, setTopicsCovered] = useState("");
  const [learnerUnderstanding, setLearnerUnderstanding] = useState("Thoroughly understood core concepts with hands-on practice");
  const [practiceNeeded, setPracticeNeeded] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isFullyCompleted, setIsFullyCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultMessage(null);

    startTransition(async () => {
      const res = await recordSessionCompletion({
        exchangeId,
        topicsCovered: topicsCovered || `Mastery of ${skillOffered}`,
        learnerUnderstanding,
        practiceNeeded,
        feedback,
      });

      if (res.error) {
        setError(res.error);
        triggerMode("encouragement", 3500, "Could not submit completion notes. Let's try again.");
      } else {
        setResultMessage(res.message);
        setIsFullyCompleted(res.completed);
        if (res.completed) {
          triggerMode("celebration", 6000, "Exchange verified by both peers! Your verified certificate is ready!");
        } else {
          triggerMode("explaining", 4500, "Your completion is recorded! Waiting for your peer's confirmation.");
        }
        if (onCompleteSuccess) onCompleteSuccess();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Complete & Verify Exchange
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log completion notes for <strong>{skillOffered}</strong> with {peerName}
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resultMessage ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isFullyCompleted ? "Exchange Completed & Verified!" : "Completion Record Logged!"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {resultMessage}
                </p>
              </div>

              {isFullyCompleted && (
                <div className="pt-2">
                  <Link
                    href="/certificates"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md"
                  >
                    <Award className="w-4 h-4" />
                    <span>View & Customize Certificates</span>
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-3 text-xs text-slate-400 hover:text-slate-600"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
                  <span>Dual Verification Required for Certificates</span>
                </p>
                LearnLync certificates are awarded once both learners confirm completion. Both teacher and learner will receive their verified certificates.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Topics Covered During Session
                </label>
                <input
                  type="text"
                  required
                  value={topicsCovered}
                  onChange={(e) => setTopicsCovered(e.target.value)}
                  placeholder={`e.g. ${skillOffered} fundamentals, hands-on debugging, best practices`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Understanding Assessment
                </label>
                <select
                  value={learnerUnderstanding}
                  onChange={(e) => setLearnerUnderstanding(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Thoroughly understood core concepts with hands-on practice">
                    Thoroughly understood core concepts with hands-on practice (Excellent)
                  </option>
                  <option value="Solid grasp of fundamentals with minor guidance">
                    Solid grasp of fundamentals with minor guidance (Good)
                  </option>
                  <option value="Covered essentials, needs follow-up self-practice">
                    Covered essentials, needs follow-up self-practice (Developing)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Suggested Further Practice (Optional)
                </label>
                <input
                  type="text"
                  value={practiceNeeded}
                  onChange={(e) => setPracticeNeeded(e.target.value)}
                  placeholder="e.g. Build a mini app, review documentation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Peer Feedback / Testimonial
                </label>
                <textarea
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share a short note on how the learning collaboration went..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isPending ? "Submitting..." : "Confirm Completion"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
