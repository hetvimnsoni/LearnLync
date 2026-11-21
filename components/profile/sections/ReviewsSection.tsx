"use client";

import { useState } from "react";
import { UserProfile, PartnerReview } from "@/types/profile";
import { Star, ShieldCheck, MessageSquare, Plus, CheckCircle2 } from "lucide-react";
import { ReviewModal } from "../modals/ReviewModal";

interface ReviewsSectionProps {
  profile: UserProfile;
  isOwner: boolean;
}

export function ReviewsSection({ profile, isOwner }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<PartnerReview[]>(profile.reviews || []);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Compute aggregate statistics
  const count = reviews.length;
  const avgOverall =
    count > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1) : "5.0";
  const avgTeaching =
    count > 0
      ? (reviews.reduce((acc, r) => acc + (r.teaching_quality || 5), 0) / count).toFixed(1)
      : "5.0";
  const avgComm =
    count > 0
      ? (reviews.reduce((acc, r) => acc + (r.communication || 5), 0) / count).toFixed(1)
      : "5.0";
  const avgCollab =
    count > 0
      ? (reviews.reduce((acc, r) => acc + (r.collaboration || 5), 0) / count).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Rating Overview Scoreboard */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Big Score */}
          <div className="flex items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-mono">{avgOverall}</span>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Verified Partner Feedback</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Based on {count} completed peer exchanges
              </p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Verified Skill Exchange Reviews</span>
              </div>
            </div>
          </div>

          {/* Sub-ratings bars */}
          <div className="w-full md:w-72 space-y-2.5 bg-slate-50/80 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Teaching Quality</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">{avgTeaching} / 5</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 dark:bg-amber-400 rounded-full"
                  style={{ width: `${(Number(avgTeaching) / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Communication</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{avgComm} / 5</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                  style={{ width: `${(Number(avgComm) / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Collaboration</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{avgCollab} / 5</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                  style={{ width: `${(Number(avgCollab) / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {!isOwner && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Leave Partner Review</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Reviews List */}
      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-6 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={rev.reviewer_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                  alt={rev.reviewer_name}
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rev.reviewer_name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">{rev.exchange_skill || "Skill Exchange"}</span>
                    <span>•</span>
                    <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                  {rev.rating}.0
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              "{rev.comment}"
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/90 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Exchange Partner</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span>Teaching: {rev.teaching_quality || 5}★</span>
                <span>Clarity: {rev.communication || 5}★</span>
                <span>Teamwork: {rev.collaboration || 5}★</span>
              </div>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No partner reviews yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Reviews appear here automatically when you complete verified skill exchange sessions with peer learners.
            </p>
          </div>
        )}
      </div>

      {isReviewModalOpen && (
        <ReviewModal
          targetUserId={profile.id}
          targetUserName={profile.full_name || profile.username || "Peer"}
          onClose={() => setIsReviewModalOpen(false)}
          onSuccess={() => {
            // Optional local refresh
          }}
        />
      )}
    </div>
  );
}
