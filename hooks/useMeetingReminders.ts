"use client";

import { useEffect, useRef } from "react";
import { ScheduledMeeting } from "@/types/meeting";

const REMINDER_STORAGE_KEY = "learnlync_sent_meeting_reminders";

function getSentReminders(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function markReminderSent(key: string) {
  if (typeof window === "undefined") return;
  try {
    const sent = getSentReminders();
    sent.add(key);
    // Prune entries older than 2 days
    const arr = Array.from(sent).slice(-200);
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

export function useMeetingReminders(
  meetings: ScheduledMeeting[],
  onInAppNotification?: (meeting: ScheduledMeeting, minutesRemaining: number) => void
) {
  const hasRequestedPermission = useRef(false);

  // Request browser notification permission once
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && !hasRequestedPermission.current) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
      hasRequestedPermission.current = true;
    }
  }, []);

  // Poll for upcoming meetings
  useEffect(() => {
    if (!meetings || meetings.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const sentReminders = getSentReminders();

      for (const meeting of meetings) {
        if (meeting.status === "cancelled") continue;

        // Parse meeting date & start_time
        // meeting_date: "YYYY-MM-DD", start_time: "HH:MM"
        const [year, month, day] = meeting.meeting_date.split("-").map(Number);
        const [hours, minutes] = meeting.start_time.split(":").map(Number);

        if (!year || !month || !day || isNaN(hours) || isNaN(minutes)) continue;

        const meetingStart = new Date(year, month - 1, day, hours, minutes, 0);
        const diffMs = meetingStart.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / (60 * 1000));

        // Threshold based on meeting.reminder_minutes (defaults to 15)
        const threshold = meeting.reminder_minutes ?? 15;

        // Trigger if within threshold (and not in the past by more than 5 minutes)
        if (diffMinutes >= 0 && diffMinutes <= threshold) {
          const reminderKey = `${meeting.id}_reminded_${meeting.meeting_date}_${meeting.start_time}`;

          if (!sentReminders.has(reminderKey)) {
            markReminderSent(reminderKey);

            // 1. In-app notification callback
            onInAppNotification?.(meeting, diffMinutes);

            // 2. Native Desktop Browser Notification
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                const title = `Reminder: ${meeting.title}`;
                const body = `Hosted by ${meeting.owner_name}\nStarts in ${diffMinutes === 0 ? "moments" : `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`} at ${meeting.start_time}.`;
                const notif = new Notification(title, {
                  body,
                  icon: "/favicon.ico",
                  tag: reminderKey,
                });

                notif.onclick = () => {
                  window.focus();
                  window.location.href = `/meet/${meeting.room_code}`;
                };
              } catch (e) {
                console.warn("Could not fire desktop notification:", e);
              }
            }
          }
        }
      }
    };

    // Run check immediately
    checkReminders();

    // Check every 30 seconds
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [meetings, onInAppNotification]);
}
