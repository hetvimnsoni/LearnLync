"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  ArrowRight,
  Plus,
  Sparkles,
  ExternalLink,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { ScheduledMeeting } from "@/types/meeting";
import { ScheduleMeetingModal } from "@/components/calendar/ScheduleMeetingModal";
import { MeetingDetailsModal } from "@/components/calendar/MeetingDetailsModal";

interface UpcomingMeetingsWidgetProps {
  initialMeetings: ScheduledMeeting[];
  currentUserId: string;
  currentUserName: string;
}

export function UpcomingMeetingsWidget({
  initialMeetings,
  currentUserId,
  currentUserName,
}: UpcomingMeetingsWidgetProps) {
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>(initialMeetings);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<ScheduledMeeting | null>(null);

  // Filter only upcoming meetings
  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter((m) => m.status === "upcoming")
      .slice(0, 4); // Display up to 4 on dashboard
  }, [meetings]);

  // Compute countdown label
  const getCountdownLabel = (meetingDate: string, startTime: string) => {
    try {
      const now = new Date();
      const [y, m, d] = meetingDate.split("-").map(Number);
      const [hh, mm] = startTime.split(":").map(Number);
      const target = new Date(y, m - 1, d, hh, mm);

      const diffMs = target.getTime() - now.getTime();
      if (diffMs < 0) {
        return "Happening now / In progress";
      }

      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `In ${diffDays} day${diffDays > 1 ? "s" : ""}`;
      }
      if (diffHours > 0) {
        return `In ${diffHours} hr${diffHours > 1 ? "s" : ""}`;
      }
      if (diffMins > 0) {
        return `In ${diffMins} min${diffMins > 1 ? "s" : ""}`;
      }
      return "Starting now";
    } catch {
      return "Upcoming";
    }
  };

  return (
    <div className="bg-gradient-to-br from-white/95 via-[#FCFAFF]/90 to-[#F4F8FF]/85 dark:from-slate-900/80 dark:via-slate-900/80 dark:to-slate-900/80 backdrop-blur-xl rounded-3xl border border-indigo-100/80 dark:border-slate-800 p-4 sm:p-8 shadow-[0_4px_24px_-4px_rgba(112,70,232,0.06)] dark:shadow-sm space-y-6">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Upcoming Meetings
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Live Calendar
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive video learning sessions and study groups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/25 transition hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule</span>
          </button>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            <span>View Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Meetings List */}
      {upcomingMeetings.length === 0 ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 mx-auto flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No upcoming meetings scheduled
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Schedule a group study session or 1-on-1 skill exchange meeting to collaborate with peers.
          </p>
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule First Meeting</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingMeetings.map((m) => {
            const isOwner = m.owner_id === currentUserId;
            const countdown = getCountdownLabel(m.meeting_date, m.start_time);

            return (
              <div
                key={m.id}
                className="group p-4 sm:p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 hover:border-purple-400/80 transition-all hover:shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {countdown}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {m.meeting_type}
                    </span>
                  </div>

                  <h4
                    onClick={() => setSelectedMeeting(m)}
                    className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-purple-600 transition cursor-pointer"
                  >
                    {m.title}
                  </h4>

                  {/* Meeting Owner Name (Crucial Requirement) */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Host:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {m.owner_name} {isOwner ? "(You)" : ""}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      <span>{m.meeting_date}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{m.start_time} - {m.end_time}</span>
                    </span>
                  </div>
                </div>

                {/* Actions: Join Now or Details */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedMeeting(m)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                  >
                    Details & Options
                  </button>

                  <Link
                    href={`/meet/${m.room_code}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition hover:scale-105 active:scale-95"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Meeting</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onClose={() => setIsScheduleModalOpen(false)}
        onMeetingScheduled={(newM) => setMeetings((prev) => [...prev, newM])}
      />

      {/* Meeting Details Modal */}
      <MeetingDetailsModal
        isOpen={!!selectedMeeting}
        meeting={selectedMeeting}
        currentUserId={currentUserId}
        onClose={() => setSelectedMeeting(null)}
        onMeetingCancelled={(id) =>
          setMeetings((prev) =>
            prev.map((m) => (m.id === id ? { ...m, status: "cancelled" } : m))
          )
        }
      />
    </div>
  );
}
