"use client";

import { useState } from "react";
import { ScheduledMeeting } from "@/types/meeting";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ScheduleMeetingModal } from "@/components/calendar/ScheduleMeetingModal";
import { MeetingDetailsModal } from "@/components/calendar/MeetingDetailsModal";
import { useMeetingReminders } from "@/hooks/useMeetingReminders";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { Calendar as CalendarIcon, Sparkles, Bell, Video } from "lucide-react";
import Link from "next/link";

interface CalendarPageClientProps {
  currentUserId: string;
  currentUserName: string;
  initialMeetings: ScheduledMeeting[];
}

export function CalendarPageClient({
  currentUserId,
  currentUserName,
  initialMeetings,
}: CalendarPageClientProps) {
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>(initialMeetings);
  const [selectedMeeting, setSelectedMeeting] = useState<ScheduledMeeting | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<{ meeting: ScheduledMeeting; minutes: number } | null>(null);

  // Hook for live in-app and desktop meeting reminders
  useMeetingReminders(meetings, (upcomingMeeting, minutesRemaining) => {
    setActiveToast({ meeting: upcomingMeeting, minutes: minutesRemaining });
  });

  const handleMeetingScheduled = (newMeeting: ScheduledMeeting) => {
    setMeetings((prev) => [...prev, newMeeting]);
  };

  const handleMeetingCancelled = (cancelledId: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === cancelledId ? { ...m, status: "cancelled" } : m))
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <FluidAtmosphere />

      {/* Floating In-App Reminder Toast */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border-2 border-purple-500 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Bell className="w-4 h-4 animate-bounce" />
              <span>Meeting Reminder</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {activeToast.meeting.title}
            </h4>
            <p className="text-xs text-purple-600 dark:text-purple-300 font-semibold">
              Host: {activeToast.meeting.owner_name}
            </p>
            <p className="text-xs text-slate-500">
              Starts in {activeToast.minutes === 0 ? "moments" : `${activeToast.minutes} mins`} at {activeToast.meeting.start_time}.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Link
              href={`/meet/${activeToast.meeting.room_code}`}
              onClick={() => setActiveToast(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Now</span>
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Meeting Calendar
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/80 dark:bg-slate-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 backdrop-blur-md shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
                <span>Live Agenda</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Plan and view scheduled study groups, mentorship sessions, and peer learning exchanges.
            </p>
          </div>
        </div>

        {/* Main Calendar View */}
        <CalendarView
          meetings={meetings}
          currentUserId={currentUserId}
          onSelectMeeting={(m) => setSelectedMeeting(m)}
          onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
        />
      </div>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onClose={() => setIsScheduleModalOpen(false)}
        onMeetingScheduled={handleMeetingScheduled}
      />

      {/* Meeting Details Modal */}
      <MeetingDetailsModal
        isOpen={!!selectedMeeting}
        meeting={selectedMeeting}
        currentUserId={currentUserId}
        onClose={() => setSelectedMeeting(null)}
        onMeetingCancelled={handleMeetingCancelled}
      />
    </div>
  );
}
