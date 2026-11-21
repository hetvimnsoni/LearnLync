import { createClient } from "@/lib/supabase/client";
import { ScheduledMeeting } from "@/types/meeting";

export interface CreateMeetingInput {
  title: string;
  description?: string;
  meeting_date: string; // YYYY-MM-DD
  start_time: string;   // HH:MM
  end_time: string;     // HH:MM
  owner_id: string;
  meeting_type?: "study_group" | "1-on-1" | "code_review" | "mentorship";
  invited_participant_ids?: string[];
  reminder_minutes?: number;
}

const LOCAL_STORAGE_MEETINGS_KEY = "learnlync_local_scheduled_meetings";

export function getLocalMeetings(): ScheduledMeeting[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEETINGS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveLocalMeeting(meeting: ScheduledMeeting) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalMeetings();
    const existingIndex = current.findIndex((m) => m.id === meeting.id);
    if (existingIndex >= 0) {
      current[existingIndex] = meeting;
    } else {
      current.push(meeting);
    }
    localStorage.setItem(LOCAL_STORAGE_MEETINGS_KEY, JSON.stringify(current));
  } catch {}
}

export function generateMeetingCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const seg = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `meet-${seg(3)}-${seg(3)}`;
}

/**
 * Fetches all scheduled meetings without relying on fragile PostgREST foreign key joins.
 * Performs independent lookup of profiles for maximum schema compatibility.
 */
export async function fetchScheduledMeetings(): Promise<ScheduledMeeting[]> {
  const localList = getLocalMeetings();

  try {
    const supabase = createClient();

    // 1. Fetch raw meeting rows directly without joining profiles in SQL
    const { data: rawMeetings, error: meetingsError } = await supabase
      .from("scheduled_meetings")
      .select("*")
      .order("meeting_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (meetingsError) {
      console.warn("Could not query scheduled_meetings from Supabase:", meetingsError.message);
      return localList;
    }

    if (!rawMeetings || !Array.isArray(rawMeetings) || rawMeetings.length === 0) {
      return localList;
    }

    // 2. Collect unique owner IDs to fetch profiles
    const ownerIds = Array.from(
      new Set(rawMeetings.map((m: any) => m.owner_id || m.host_id || m.user_id).filter(Boolean))
    );

    const profilesMap = new Map<string, { full_name?: string; username?: string; avatar_url?: string }>();
    if (ownerIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", ownerIds);

        if (profiles && Array.isArray(profiles)) {
          profiles.forEach((p: any) => {
            profilesMap.set(p.id, {
              full_name: p.full_name,
              username: p.username,
              avatar_url: p.avatar_url,
            });
          });
        }
      } catch (profErr) {
        console.warn("Could not load owner profiles for meetings:", profErr);
      }
    }

    // 3. Map into strongly-typed ScheduledMeeting objects
    const mapped: ScheduledMeeting[] = rawMeetings.map((row: any) => {
      const ownerId = row.owner_id || row.host_id || row.user_id;
      const profile = profilesMap.get(ownerId);
      const ownerDisplayName =
        profile?.full_name ||
        profile?.username ||
        row.owner_name ||
        "Learner";

      return {
        id: row.id,
        title: row.title || "Untitled Meeting",
        description: row.description || null,
        meeting_date: row.meeting_date || row.date || new Date().toISOString().split("T")[0],
        start_time: row.start_time || "10:00",
        end_time: row.end_time || "11:00",
        owner_id: ownerId,
        owner_name: ownerDisplayName,
        owner_username: profile?.username || undefined,
        owner_avatar: profile?.avatar_url || null,
        room_code: row.room_code || row.code || `meet-${row.id?.slice(0, 7)}`,
        meeting_link: row.meeting_link || `http://localhost:3000/meet/${row.room_code || row.code}`,
        meeting_type: row.meeting_type || row.type || "study_group",
        status: row.status || "upcoming",
        invited_participant_ids: row.invited_participant_ids || [],
        reminder_minutes: row.reminder_minutes ?? 15,
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
      };
    });

    // Merge with any unsynced local meetings
    const remoteIds = new Set(mapped.map((m) => m.id));
    for (const loc of localList) {
      if (!remoteIds.has(loc.id)) {
        mapped.push(loc);
      }
    }

    return mapped;
  } catch (err) {
    console.warn("Exception in fetchScheduledMeetings:", err);
    return localList;
  }
}

/**
 * Creates a new scheduled meeting in Supabase with resilient fallbacks.
 */
export async function createScheduledMeeting(
  input: CreateMeetingInput,
  origin: string = "http://localhost:3000",
  currentUserName?: string
): Promise<{ success: boolean; meeting?: ScheduledMeeting; error?: string }> {
  const roomCode = generateMeetingCode();
  const meetingLink = `${origin}/meet/${roomCode}`;
  const nowStr = new Date().toISOString();

  const newMeetingObj = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    meeting_date: input.meeting_date,
    start_time: input.start_time,
    end_time: input.end_time,
    owner_id: input.owner_id,
    room_code: roomCode,
    meeting_link: meetingLink,
    meeting_type: input.meeting_type || "study_group",
    status: "upcoming" as const,
    invited_participant_ids: input.invited_participant_ids || [],
    reminder_minutes: input.reminder_minutes ?? 15,
  };

  try {
    const supabase = createClient();

    // Insert directly without relying on foreign key joins in the insert response
    const { data, error } = await supabase
      .from("scheduled_meetings")
      .insert(newMeetingObj)
      .select("*")
      .single();

    if (!error && data) {
      const createdMeeting: ScheduledMeeting = {
        id: (data as any).id,
        title: (data as any).title,
        description: (data as any).description,
        meeting_date: (data as any).meeting_date,
        start_time: (data as any).start_time,
        end_time: (data as any).end_time,
        owner_id: (data as any).owner_id,
        owner_name: currentUserName || "Meeting Host",
        room_code: (data as any).room_code,
        meeting_link: (data as any).meeting_link,
        meeting_type: (data as any).meeting_type || "study_group",
        status: (data as any).status || "upcoming",
        invited_participant_ids: (data as any).invited_participant_ids || [],
        reminder_minutes: (data as any).reminder_minutes ?? 15,
        created_at: (data as any).created_at || nowStr,
        updated_at: (data as any).updated_at || nowStr,
      };

      saveLocalMeeting(createdMeeting);
      return { success: true, meeting: createdMeeting };
    }

    // If PostgREST threw PGRST205 (schema cache not refreshed), save locally and advise user
    if (error) {
      console.warn("Supabase returned error on insert:", error.message, error.code);
      if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
        const fallbackMeeting: ScheduledMeeting = {
          id: `local_meet_${Date.now()}`,
          ...newMeetingObj,
          owner_name: currentUserName || "Meeting Host",
          created_at: nowStr,
          updated_at: nowStr,
        };
        saveLocalMeeting(fallbackMeeting);
        return {
          success: true,
          meeting: fallbackMeeting,
          error: "Meeting saved locally. PostgREST schema cache needs reload (run: NOTIFY pgrst, 'reload schema'; in Supabase SQL editor).",
        };
      }
      throw new Error(error.message);
    }

    throw new Error("Unexpected empty response from Supabase insert.");
  } catch (err: any) {
    console.error("createScheduledMeeting exception:", err);
    // Save to local cache so user's planned meeting isn't lost
    const fallbackMeeting: ScheduledMeeting = {
      id: `local_meet_${Date.now()}`,
      ...newMeetingObj,
      owner_name: currentUserName || "Meeting Host",
      created_at: nowStr,
      updated_at: nowStr,
    };
    saveLocalMeeting(fallbackMeeting);

    return {
      success: true,
      meeting: fallbackMeeting,
      error: err?.message,
    };
  }
}

/**
 * Updates a scheduled meeting in both Supabase and local cache.
 */
export async function updateScheduledMeeting(
  id: string,
  updates: Partial<ScheduledMeeting>
): Promise<{ success: boolean; error?: string }> {
  // Update local cache first for instant UI response
  if (typeof window !== "undefined") {
    try {
      const current = getLocalMeetings();
      const idx = current.findIndex((m) => m.id === id);
      if (idx >= 0) {
        current[idx] = { ...current[idx], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem(LOCAL_STORAGE_MEETINGS_KEY, JSON.stringify(current));
      }
    } catch {}
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("scheduled_meetings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.warn("Could not update meeting in Supabase:", error.message);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update meeting." };
  }
}

/**
 * Cancels a scheduled meeting in both Supabase and local cache.
 */
export async function cancelScheduledMeeting(id: string): Promise<{ success: boolean; error?: string }> {
  // Update local cache first
  if (typeof window !== "undefined") {
    try {
      const current = getLocalMeetings();
      const idx = current.findIndex((m) => m.id === id);
      if (idx >= 0) {
        current[idx] = { ...current[idx], status: "cancelled", updated_at: new Date().toISOString() };
        localStorage.setItem(LOCAL_STORAGE_MEETINGS_KEY, JSON.stringify(current));
      }
    } catch {}
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("scheduled_meetings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.warn("Could not cancel meeting in Supabase:", error.message);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to cancel meeting." };
  }
}
