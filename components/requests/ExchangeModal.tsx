"use client";

import { useState, useTransition } from "react";
import { PeerProfile } from "@/types/learner";
import { createExchangeRequest } from "@/app/requests/actions";
import { useNotification } from "@/components/providers/NotificationProvider";
import {
  X,
  ArrowLeftRight,
  GraduationCap,
  BookOpen,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface ExchangeModalProps {
  peer: PeerProfile | null;
  currentUserSkillsOffered?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ExchangeModal({
  peer,
  currentUserSkillsOffered = [],
  isOpen,
  onClose,
  onSuccess,
}: ExchangeModalProps) {
  const { refreshCounts } = useNotification();
  const [skillOffered, setSkillOffered] = useState<string>(
    currentUserSkillsOffered.length > 0 ? currentUserSkillsOffered[0] : ""
  );
  const [skillWanted, setSkillWanted] = useState<string>(
    peer && peer.skills_offered.length > 0 ? peer.skills_offered[0] : ""
  );
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !peer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedOffered = skillOffered.trim();
    const trimmedWanted = skillWanted.trim();

    if (!trimmedOffered) {
      setError("Please specify the skill you are offering to teach.");
      return;
    }

    if (!trimmedWanted) {
      setError("Please specify the skill you want to learn.");
      return;
    }

    startTransition(async () => {
      const result = await createExchangeRequest({
        receiverId: peer.id,
        skillOffered: trimmedOffered,
        skillWanted: trimmedWanted,
        message: message.trim(),
      });

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.message || "Request sent successfully!");
        refreshCounts();

        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1500);
      }
    });
  };

  const initial = (peer.full_name || peer.username || "L").charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Request Skill Exchange
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Propose a collaborative skill swap with <span className="font-semibold text-slate-700 dark:text-slate-300">{peer.full_name}</span>
            </p>
          </div>
        </div>

        {/* Target Peer Summary Pill */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          {peer.avatar_url ? (
            <img
              src={peer.avatar_url}
              alt={peer.full_name || "Learner avatar"}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              {initial}
            </div>
          )}
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-white">{peer.full_name}</p>
            <p className="text-slate-400 font-mono">@{peer.username}</p>
          </div>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Exchange Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Skill Offered */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Skill You Offer to Teach</span>
              </span>
              <span className="text-[10px] text-slate-400 lowercase font-normal">choose chip or type</span>
            </label>

            {/* Quick chips from user's offered skills */}
            {currentUserSkillsOffered.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {currentUserSkillsOffered.map((skill, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSkillOffered(skill)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${
                      skillOffered.toLowerCase() === skill.toLowerCase()
                        ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                        : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={skillOffered}
              onChange={(e) => setSkillOffered(e.target.value)}
              placeholder="e.g. React, Next.js, System Architecture"
              maxLength={80}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Step 2: Skill Wanted */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Skill You Want to Learn</span>
              </span>
              <span className="text-[10px] text-slate-400 lowercase font-normal">from peer's skills</span>
            </label>

            {/* Quick chips from peer's offered skills */}
            {peer.skills_offered.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {peer.skills_offered.map((skill, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSkillWanted(skill)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium transition ${
                      skillWanted.toLowerCase() === skill.toLowerCase()
                        ? "bg-blue-600 text-white shadow-2xs font-semibold"
                        : "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={skillWanted}
              onChange={(e) => setSkillWanted(e.target.value)}
              placeholder="e.g. Python, Machine Learning, UI/UX"
              maxLength={80}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Step 3: Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <span>Intro Message (Optional)</span>
              <span className="text-[10px] text-slate-400 font-mono">{message.length}/1000</span>
            </div>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${peer.full_name?.split(" ")[0] || "there"}, I'd love to exchange skills! Let's connect.`}
              maxLength={1000}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending || !skillOffered.trim() || !skillWanted.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPending ? "Sending Proposal..." : "Send Request"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
