"use client";

import { useState } from "react";
import { UserProfile, Availability } from "@/types/profile";
import {
  Calendar,
  Clock,
  Globe,
  Users,
  Save,
  CheckCircle2,
  Check,
  ShieldCheck,
} from "lucide-react";
import { saveAvailability } from "@/app/profile/actions";

interface AvailabilitySectionProps {
  profile: UserProfile;
  isOwner: boolean;
}

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_SLOTS = [
  "Morning (9:00 AM - 12:00 PM)",
  "Afternoon (12:00 PM - 5:00 PM)",
  "Evening (5:00 PM - 9:00 PM)",
  "Night (9:00 PM - 12:00 AM)",
];

const COLLAB_FORMATS = [
  "1-on-1 Sessions",
  "Pair Programming",
  "Code Reviews",
  "Group Workshops",
  "Async Feedback",
];

const TIMEZONES = [
  "Pacific Standard Time (UTC-8)",
  "Eastern Standard Time (UTC-5)",
  "Universal Coordinated Time (UTC)",
  "Central European Time (UTC+1)",
  "Indian Standard Time (UTC+5:30)",
  "Japan Standard Time (UTC+9)",
  "Australian Eastern Time (UTC+10)",
];

export function AvailabilitySection({ profile, isOwner }: AvailabilitySectionProps) {
  const [availability, setAvailability] = useState<Availability>(
    profile.availability || {
      days: ["Monday", "Wednesday", "Friday"],
      time_slots: ["Evening (5:00 PM - 9:00 PM)"],
      timezone: "Universal Coordinated Time (UTC)",
      collaboration_format: ["1-on-1 Sessions", "Pair Programming"],
      individual_or_group: "Individual (1-on-1)",
      teaching_style: "Hands-on projects and interactive code reviews",
      languages: ["English"],
      open_to_exchange: true,
    }
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    if (!isOwner) return;
    const days = availability.days.includes(day)
      ? availability.days.filter((d) => d !== day)
      : [...availability.days, day];
    setAvailability({ ...availability, days });
  };

  const toggleTimeSlot = (slot: string) => {
    if (!isOwner) return;
    const time_slots = availability.time_slots.includes(slot)
      ? availability.time_slots.filter((s) => s !== slot)
      : [...availability.time_slots, slot];
    setAvailability({ ...availability, time_slots });
  };

  const toggleFormat = (format: string) => {
    if (!isOwner) return;
    const collaboration_format = availability.collaboration_format.includes(format)
      ? availability.collaboration_format.filter((f) => f !== format)
      : [...availability.collaboration_format, format];
    setAvailability({ ...availability, collaboration_format });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setSaving(true);
    setSuccess(null);
    const res = await saveAvailability(availability);
    setSaving(false);

    if (!res.error) {
      setSuccess("Availability & preferences saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* 1. Open to Exchange Status Switch */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              availability.open_to_exchange
                ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            }`}
          >
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Open to Skill Exchange</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {availability.open_to_exchange
                ? "Accepting new exchange requests from verified learners"
                : "Currently not accepting new exchange requests"}
            </p>
          </div>
        </div>

        {isOwner ? (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={availability.open_to_exchange}
              onChange={(e) =>
                setAvailability({ ...availability, open_to_exchange: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        ) : (
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              availability.open_to_exchange
                ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
            }`}
          >
            {availability.open_to_exchange ? "Active & Accepting Requests" : "Unavailable"}
          </span>
        )}
      </div>

      {/* 2. Available Days Grid */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Available Days of the Week</span>
        </h3>

        <div className="flex flex-wrap gap-2.5">
          {ALL_DAYS.map((day) => {
            const active = availability.days.includes(day);
            return (
              <button
                key={day}
                type="button"
                disabled={!isOwner}
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/25 ring-1 ring-white/20"
                    : "bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                } ${!isOwner ? "cursor-default" : ""}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Preferred Time Slots & Timezone */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Preferred Time Slots</h3>
            <div className="space-y-2">
              {TIME_SLOTS.map((slot) => {
                const active = availability.time_slots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={!isOwner}
                    onClick={() => toggleTimeSlot(slot)}
                    className={`w-full p-3 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition ${
                      active
                        ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60"
                        : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                    } ${!isOwner ? "cursor-default" : ""}`}
                  >
                    <span>{slot}</span>
                    {active && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Primary Timezone
              </label>
              {isOwner ? (
                <select
                  value={availability.timezone}
                  onChange={(e) =>
                    setAvailability({ ...availability, timezone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">{availability.timezone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Teaching & Mentoring Style
              </label>
              {isOwner ? (
                <input
                  type="text"
                  value={availability.teaching_style}
                  onChange={(e) =>
                    setAvailability({ ...availability, teaching_style: e.target.value })
                  }
                  placeholder="e.g. Hands-on coding with live iteration"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-xs text-slate-700 dark:text-slate-300">{availability.teaching_style}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Collaboration Formats */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Collaboration Format Preferences</h3>
        <div className="flex flex-wrap gap-2">
          {COLLAB_FORMATS.map((format) => {
            const active = availability.collaboration_format.includes(format);
            return (
              <button
                key={format}
                type="button"
                disabled={!isOwner}
                onClick={() => toggleFormat(format)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/60"
                    : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
                } ${!isOwner ? "cursor-default" : ""}`}
              >
                {format}
              </button>
            );
          })}
        </div>
      </div>

      {isOwner && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-xl shadow-brand-500/25 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Availability"}</span>
          </button>
        </div>
      )}
    </form>
  );
}
