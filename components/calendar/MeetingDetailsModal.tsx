"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Calendar,
  Clock,
  User,
  Video,
  Copy,
  Check,
  Ban,
  ExternalLink,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { ScheduledMeeting } from "@/types/meeting";
import { cancelScheduledMeeting } from "@/lib/supabase/meetings";

interface MeetingDetailsModalProps {
  isOpen: boolean;
  meeting: ScheduledMeeting | null;
  currentUserId: string;
  onClose: () => void;
  onMeetingCancelled?: (meetingId: string) => void;
}

export function MeetingDetailsModal({
  isOpen,
  meeting,
  currentUserId,
  onClose,
  onMeetingCancelled,
}: MeetingDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!isOpen || !meeting) return null;

  const isOwner = meeting.owner_id === currentUserId;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meeting.meeting_link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this scheduled meeting?")) return;
    setIsCancelling(true);
    setCancelError(null);

    const result = await cancelScheduledMeeting(meeting.id);
    setIsCancelling(false);

    if (result.success) {
      onMeetingCancelled?.(meeting.id);
      onClose();
    } else {
      setCancelError(result.error || "Failed to cancel meeting.");
    }
  };

  const getStatusBadge = () => {
    switch (meeting.status) {
      case "cancelled":
        return "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-900";
      case "completed":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
      default:
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge()}`}
            >
              {meeting.status}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {meeting.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cancelError && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600">
            {cancelError}
          </div>
        )}

        {/* Meeting Information Grid */}
        <div className="space-y-3.5 text-xs">
          {/* OWNER NAME (Crucial Prompt Requirement) */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
              {meeting.owner_name?.charAt(0).toUpperCase() || "H"}
            </div>
            <div>
              <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
                Meeting Owner
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {meeting.owner_name} {isOwner ? "(You)" : ""}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px] uppercase font-bold">Date</span>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                {meeting.meeting_date}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[10px] uppercase font-bold">Time</span>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                {meeting.start_time} - {meeting.end_time}
              </p>
            </div>
          </div>

          {/* Description */}
          {meeting.description && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Agenda & Description</div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {meeting.description}
              </p>
            </div>
          )}

          {/* Meeting Link & Copy */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Meeting Link</div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 truncate">
                {meeting.meeting_link}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold hover:bg-slate-100 transition shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Cancel button if owner and upcoming */}
          {isOwner && meeting.status === "upcoming" ? (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition disabled:opacity-50"
            >
              {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
              <span>Cancel Meeting</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Close
            </button>

            {meeting.status !== "cancelled" && (
              <Link
                href={`/meet/${meeting.room_code}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/25 transition hover:scale-105 active:scale-95"
              >
                <Video className="w-4 h-4" />
                <span>Join Now</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
