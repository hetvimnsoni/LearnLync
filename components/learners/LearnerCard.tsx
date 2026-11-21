"use client";

import Link from "next/link";
import { PeerProfile } from "@/types/learner";
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  ArrowRight,
  MessageSquare,
  ArrowLeftRight,
} from "lucide-react";

interface LearnerCardProps {
  peer: PeerProfile;
  onSelectPeer: (peer: PeerProfile) => void;
  onRequestExchange?: (peer: PeerProfile) => void;
}

export function LearnerCard({ peer, onSelectPeer, onRequestExchange }: LearnerCardProps) {
  const initial = (peer.full_name || peer.username || "L").charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onSelectPeer(peer)}
      className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-400 dark:hover:border-brand-500/70 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Header: Avatar, Name, Username */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {peer.avatar_url ? (
              <img
                src={peer.avatar_url}
                alt={peer.full_name || "Learner avatar"}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                {initial}
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {peer.full_name}
              </h3>
              <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                @{peer.username}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>Active Peer</span>
          </span>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {peer.bio || "Active learner on LearnLync ready for reciprocal skill exchange."}
        </p>

        {/* Skills Offered */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Offers to Teach</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {peer.skills_offered.length > 0 ? (
              peer.skills_offered.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs"
                >
                  ✓ {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No skills listed yet</span>
            )}
            {peer.skills_offered.length > 3 && (
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800">
                +{peer.skills_offered.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Skills Needed */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Wants to Learn</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {peer.skills_needed.length > 0 ? (
              peer.skills_needed.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/50 shadow-2xs"
                >
                  ✦ {skill}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Open to all skills</span>
            )}
            {peer.skills_needed.length > 3 && (
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800">
                +{peer.skills_needed.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:translate-x-1 transition inline-flex items-center gap-1">
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>

        <div className="flex items-center gap-2">
          {onRequestExchange && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestExchange(peer);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 hover:bg-brand-600 hover:text-white transition shadow-sm border border-brand-200/60 dark:border-brand-800/60"
              title="Request Skill Exchange"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Exchange</span>
            </button>
          )}

          <Link
            href={`/chat/${peer.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:from-brand-500 hover:to-indigo-500 transition shadow-sm shadow-brand-500/20"
            title="Open 1:1 Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
