"use client";

import Link from "next/link";
import { PeerProfile, PeerConnectionStatus } from "@/types/learner";
import {
  X,
  Sparkles,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Calendar,
  ArrowLeftRight,
  Check,
} from "lucide-react";

interface PeerProfileModalProps {
  peer: PeerProfile | null;
  currentUserId: string | null;
  connectionStatus?: PeerConnectionStatus;
  onClose: () => void;
  onRequestExchange?: (peer: PeerProfile) => void;
}

export function PeerProfileModal({
  peer,
  currentUserId,
  connectionStatus = "none",
  onClose,
  onRequestExchange,
}: PeerProfileModalProps) {
  if (!peer) return null;

  const initial = (peer.full_name || peer.username || "L").charAt(0).toUpperCase();
  const isConnected = connectionStatus === "connected";
  const isPending = connectionStatus === "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 sm:p-8 space-y-4 sm:space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 pb-4 sm:pb-6 border-b border-slate-100 dark:border-slate-800">
          {peer.avatar_url ? (
            <img
              src={peer.avatar_url}
              alt={peer.full_name || "Peer avatar"}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-brand-500/30 shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-lg shadow-brand-500/20 shrink-0">
              {initial}
            </div>
          )}

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
                {peer.full_name}
              </h2>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Connected Peer</span>
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Request Pending</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>Verified Peer</span>
                </span>
              )}
            </div>
            <p className="text-sm font-mono text-slate-500 dark:text-slate-400">
              @{peer.username}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Joined LearnLync on{" "}
                {new Date(peer.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            About This Learner
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            {peer.bio || "Active learner on LearnLync ready for reciprocal skill exchange."}
          </p>
        </div>

        {/* Skills Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              <GraduationCap className="w-4 h-4" />
              <span>Skills They Offer to Teach</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {peer.skills_offered.length > 0 ? (
                peer.skills_offered.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                  >
                    ✓ {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No skills listed yet</span>
              )}
            </div>
          </div>

          <div className="bg-brand-50/60 dark:bg-brand-950/20 rounded-2xl p-4 border border-brand-200/60 dark:border-brand-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              <BookOpen className="w-4 h-4" />
              <span>Skills They Want to Learn</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {peer.skills_needed.length > 0 ? (
                peer.skills_needed.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-brand-900/60 text-brand-800 dark:text-brand-200 border border-brand-200 dark:border-brand-800 shadow-2xs"
                  >
                    ✦ {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Open to all skills</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href={`/profile/${peer.username || peer.id}`}
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-center"
          >
            View Full Profile
          </Link>

          {isConnected ? (
            <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Connected Peer</span>
            </span>
          ) : isPending ? (
            <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              <span>⏳ Request Pending</span>
            </span>
          ) : (
            onRequestExchange && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestExchange(peer);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 hover:bg-brand-600 hover:text-white transition shadow-sm border border-brand-200/60 dark:border-brand-800/60"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Request Skill Exchange</span>
              </button>
            )
          )}

          <Link
            href={`/chat/${peer.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-md shadow-brand-500/20 transition group"
          >
            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Message {peer.full_name?.split(" ")[0] || "Learner"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
