
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarPageClient } from "@/components/calendar/CalendarPageClient";
import { ScheduledMeeting } from "@/types/meeting";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/calendar");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", user.id)
    .single();

  const currentUserName =
    profile?.full_name ||
    profile?.username ||
    user.email?.split("@")[0] ||
    "Learner";

  let initialMeetings: ScheduledMeeting[] = [];

  try {
    const { data: rawMeetings, error: meetError } = await supabase
      .from("scheduled_meetings")
      .select("*")
      .order("meeting_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (!meetError && rawMeetings && Array.isArray(rawMeetings) && rawMeetings.length > 0) {
      const ownerIds = Array.from(
        new Set(rawMeetings.map((r: any) => r.owner_id).filter(Boolean))
      );

      const profilesMap = new Map<string, string>();

      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, username")
          .in("id", ownerIds);

        profiles?.forEach((p: {
          id: string;
          full_name: string | null;
          username: string | null;
        }) => {
          profilesMap.set(p.id, p.full_name || p.username || "Learner");
        });
      }

      initialMeetings = rawMeetings.map((row: any) => ({
        id: row.id,
        title: row.title || "Untitled Meeting",
        description: row.description || null,
        meeting_date: row.meeting_date || row.date || new Date().toISOString().split("T")[0],
        start_time: row.start_time || "10:00",
        end_time: row.end_time || "11:00",
        owner_id: row.owner_id,
        owner_name:
          profilesMap.get(row.owner_id) ||
          (row.owner_id === user.id ? currentUserName : "Learner"),
        room_code: row.room_code || row.code || `meet-${row.id?.slice(0, 7)}`,
        meeting_link: row.meeting_link || `http://localhost:3000/meet/${row.room_code || row.code}`,
        meeting_type: row.meeting_type || row.type || "study_group",
        status: row.status || "upcoming",
        invited_participant_ids: row.invited_participant_ids || [],
        reminder_minutes: row.reminder_minutes ?? 15,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    }
  } catch (err) {
    console.warn("Could not load initial scheduled meetings:", err);
  }

  return (
    <CalendarPageClient
      currentUserId={user.id}
      currentUserName={currentUserName}
      initialMeetings={initialMeetings}
    />
  );
}
