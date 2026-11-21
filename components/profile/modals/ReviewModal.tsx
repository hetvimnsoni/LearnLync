"use client";

import { useState } from "react";
import { Star, X, CheckCircle, ShieldCheck } from "lucide-react";
import { submitPartnerReview } from "@/app/profile/actions";

interface ReviewModalProps {
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewModal({
  targetUserId,
  targetUserName,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [teachingQuality, setTeachingQuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [collaboration, setCollaboration] = useState(5);
  const [comment, setComment] = useState("");
  const [exchangeSkill, setExchangeSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Please write some feedback about your skill exchange.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await submitPartnerReview(targetUserId, {
      rating,
      teaching_quality: teachingQuality,
      communication,
      collaboration,
      comment: comment.trim(),
      exchange_skill: exchangeSkill.trim() || "Skill Exchange",
    });

    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const StarSelector = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
  }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 transition hover:scale-110"
          >
            <Star
              className={`w-4 h-4 ${
                star <= value
                  ? "text-amber-400 fill-amber-400"
                  : "text-slate-300 dark:text-slate-600"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Leave Partner Review</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">For {targetUserName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-3">
            <StarSelector value={rating} onChange={setRating} label="Overall Experience" />
            <StarSelector
              value={teachingQuality}
              onChange={setTeachingQuality}
              label="Teaching Quality"
            />
            <StarSelector
              value={communication}
              onChange={setCommunication}
              label="Communication & Clarity"
            />
            <StarSelector
              value={collaboration}
              onChange={setCollaboration}
              label="Collaboration & Respect"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
              Skills Exchanged (Optional)
            </label>
            <input
              type="text"
              value={exchangeSkill}
              onChange={(e) => setExchangeSkill(e.target.value)}
              placeholder="e.g. Next.js ⇄ Machine Learning"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
              Written Feedback *
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What made this learning exchange great? How did this peer help you grow?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Marked as a Verified LearnLync Exchange Partner</span>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 transition disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Submit Review"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
