"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Video,
  Clock,
  User,
  Plus,
  List,
  Grid3X3,
  Sparkles,
} from "lucide-react";
import { ScheduledMeeting } from "@/types/meeting";

interface CalendarViewProps {
  meetings: ScheduledMeeting[];
  currentUserId: string;
  onSelectMeeting: (meeting: ScheduledMeeting) => void;
  onOpenScheduleModal: () => void;
}

type ViewMode = "month" | "week" | "day" | "all";

export function CalendarView({
  meetings,
  currentUserId,
  onSelectMeeting,
  onOpenScheduleModal,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Current year & month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else if (viewMode === "day") {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const nextPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else if (viewMode === "day") {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Group meetings by date: "YYYY-MM-DD" -> ScheduledMeeting[]
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, ScheduledMeeting[]>();
    for (const m of meetings) {
      if (!map.has(m.meeting_date)) {
        map.set(m.meeting_date, []);
      }
      map.get(m.meeting_date)!.push(m);
    }
    return map;
  }, [meetings]);

  // Month grid generation: calendar days
  const monthDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const totalDays = lastDayOfMonth.getDate();

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const mStr = String(prevDate.getMonth() + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        dateStr: `${prevDate.getFullYear()}-${mStr}-${dStr}`,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(month + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        dateStr: `${year}-${mStr}-${dStr}`,
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill complete grid of 35 or 42
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const mStr = String(nextDate.getMonth() + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      days.push({
        dateStr: `${nextDate.getFullYear()}-${mStr}-${dStr}`,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="space-y-6">
      {/* Calendar Navigation & Mode Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        {/* Current Period Display & Prev/Next */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={prevPeriod}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={nextPeriod}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {monthNames[month]} {year}
          </h2>
        </div>

        {/* View Mode Switcher & Schedule Meeting Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold overflow-x-auto no-scrollbar max-w-full">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                viewMode === "month"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                viewMode === "week"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                viewMode === "day"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                viewMode === "all"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span className="hidden sm:inline">All Meetings</span>
              <span className="sm:hidden">All</span>
            </button>
          </div>

          {/* Schedule Meeting Button */}
          <button
            type="button"
            onClick={onOpenScheduleModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === "month" && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-x-auto">
          <div className="min-w-[580px] sm:min-w-0">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-850/50 py-3">
              {weekdayNames.map((w, idx) => (
                <span
                  key={idx}
                  className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  <span className="hidden sm:inline">{w}</span>
                  <span className="sm:hidden">{w.slice(0, 3)}</span>
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 dark:divide-slate-800">
            {monthDays.map((item, idx) => {
              const dayMeetings = meetingsByDate.get(item.dateStr) || [];
              const isToday = item.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] sm:min-h-[145px] p-1.5 sm:p-2.5 transition-colors flex flex-col justify-between ${
                    !item.isCurrentMonth
                      ? "bg-slate-50/30 dark:bg-slate-950/20 text-slate-400 dark:text-slate-600"
                      : "bg-white/40 dark:bg-slate-900/40 text-slate-900 dark:text-white"
                  } ${isToday ? "ring-2 ring-inset ring-purple-500/80 bg-purple-50/20" : ""}`}
                >
                  {/* Date Number Badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold ${
                        isToday
                          ? "bg-purple-600 text-white shadow-sm"
                          : item.isCurrentMonth
                          ? "text-slate-700 dark:text-slate-300"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {item.dayNumber}
                    </span>

                    {dayMeetings.length > 0 && (
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        {dayMeetings.length} {dayMeetings.length === 1 ? "meet" : "meets"}
                      </span>
                    )}
                  </div>

                  {/* Meetings on this Date: MOST IMPORTANT REQUIREMENTS:
                      Display Meeting Title AND Meeting Owner's Name clearly without overlapping! */}
                  <div className="space-y-1.5 overflow-y-auto max-h-[105px] scrollbar-none flex-1">
                    {dayMeetings.map((m) => {
                      const isOwner = m.owner_id === currentUserId;
                      const isCancelled = m.status === "cancelled";

                      return (
                        <div
                          key={m.id}
                          onClick={() => onSelectMeeting(m)}
                          className={`p-1.5 sm:p-2 rounded-xl text-left cursor-pointer transition-all hover:scale-[1.02] border text-xs shadow-2xs ${
                            isCancelled
                              ? "bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 opacity-60"
                              : "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50 border-purple-200/80 dark:border-purple-800/60 hover:border-purple-400"
                          }`}
                        >
                          {/* Meeting Title */}
                          <div className="font-extrabold text-[11px] sm:text-xs text-slate-900 dark:text-white truncate leading-tight">
                            {m.title}
                          </div>

                          {/* MEETING OWNER NAME (Prominently Rendered as Requested) */}
                          <div className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 truncate mt-0.5 flex items-center gap-1">
                            <span className="opacity-75">Owner:</span>
                            <span className="font-bold underline decoration-purple-300 underline-offset-2">
                              {m.owner_name} {isOwner ? "(You)" : ""}
                            </span>
                          </div>

                          {/* Time */}
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>{m.start_time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === "week" && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekdayNames.map((dayName, idx) => {
              // Calculate date for this day of current week
              const curr = new Date(currentDate);
              const firstDayOfWeek = curr.getDate() - curr.getDay() + idx;
              const dayDate = new Date(curr.setDate(firstDayOfWeek));
              const yStr = dayDate.getFullYear();
              const mStr = String(dayDate.getMonth() + 1).padStart(2, "0");
              const dStr = String(dayDate.getDate()).padStart(2, "0");
              const dateKey = `${yStr}-${mStr}-${dStr}`;
              const dayMeetings = meetingsByDate.get(dateKey) || [];
              const isToday = dateKey === todayStr;

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border min-h-[220px] flex flex-col justify-between ${
                    isToday
                      ? "bg-purple-50/50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800"
                      : "bg-slate-50/50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">{dayName}</div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white">
                      {monthNames[dayDate.getMonth()].slice(0, 3)} {dayDate.getDate()}
                    </div>
                  </div>

                  <div className="space-y-2 mt-2 flex-1 overflow-y-auto">
                    {dayMeetings.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic pt-4 text-center">No meetings</p>
                    ) : (
                      dayMeetings.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => onSelectMeeting(m)}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/60 shadow-2xs cursor-pointer hover:border-purple-400 transition"
                        >
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {m.title}
                          </p>
                          <p className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold mt-0.5 truncate">
                            Owner: {m.owner_name}
                          </p>
                          <p className="text-[9px] text-slate-500 font-mono mt-1">
                            {m.start_time} - {m.end_time}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === "day" && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {weekdayNames[currentDate.getDay()]}, {monthNames[month]} {currentDate.getDate()}, {year}
              </h3>
              <p className="text-xs text-slate-500">Scheduled sessions for today</p>
            </div>
            <button
              type="button"
              onClick={onOpenScheduleModal}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition"
            >
              Add Meeting
            </button>
          </div>

          {/* Today's Meetings List */}
          {(() => {
            const yStr = currentDate.getFullYear();
            const mStr = String(currentDate.getMonth() + 1).padStart(2, "0");
            const dStr = String(currentDate.getDate()).padStart(2, "0");
            const dateKey = `${yStr}-${mStr}-${dStr}`;
            const dayMeetings = meetingsByDate.get(dateKey) || [];

            if (dayMeetings.length === 0) {
              return (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 mx-auto flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    No meetings scheduled for this date
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click &ldquo;Schedule Meeting&rdquo; to plan a group study session or 1-on-1 learning exchange.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {dayMeetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectMeeting(m)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-400 cursor-pointer transition shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{m.title}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold uppercase">
                          {m.meeting_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          Owner: {m.owner_name}
                        </span>
                        <span>•</span>
                        <span className="font-mono">{m.start_time} - {m.end_time}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition shadow-sm shrink-0"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ALL MEETINGS / LIST VIEW */}
      {viewMode === "all" && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">All Scheduled Meetings</h3>
              <p className="text-xs text-slate-500">Complete agenda of upcoming and past meetings</p>
            </div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              {meetings.length} Total Meetings
            </span>
          </div>

          {meetings.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CalendarIcon className="w-10 h-10 text-purple-400 mx-auto opacity-50" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No scheduled meetings yet</p>
              <button
                type="button"
                onClick={onOpenScheduleModal}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition"
              >
                Schedule First Meeting
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectMeeting(m)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-400 cursor-pointer transition shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{m.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase">
                        {m.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        Owner: {m.owner_name}
                      </span>
                      <span>•</span>
                      <span>Date: {m.meeting_date}</span>
                      <span>•</span>
                      <span className="font-mono">{m.start_time} - {m.end_time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
