import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLearnerPeers } from "@/lib/learners";
import { getExchangeRequests } from "@/app/requests/actions";
import { LearnersExplorer } from "@/components/learners/LearnersExplorer";
import { LearningSpace } from "@/components/dashboard/LearningSpace";
import { UpcomingMeetingsWidget } from "@/components/dashboard/UpcomingMeetingsWidget";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { ScheduledMeeting } from "@/types/meeting";
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Edit3,
  CheckCircle2,
  ArrowLeftRight,
  MessageSquare,
  Users,
  Video,
  Phone,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  // Fetch or fallback profile from Supabase profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Learner";
  const username = profile?.username || user.email?.split("@")[0];
  const bio = profile?.bio || "No bio added yet. Tell other learners about yourself!";
  const skillsOffered: string[] = profile?.skills_offered || ["JavaScript", "React", "Next.js"];
  const skillsNeeded: string[] = profile?.skills_needed || ["Python", "Machine Learning", "System Design"];

  // Retrieve discoverable peers from Supabase (excluding current user)
  const { peers, error: peersError } = await getLearnerPeers();

  // Retrieve exchange requests for active user
  const requestsData = await getExchangeRequests();
  const { accepted, pendingIncomingCount } = requestsData;

  // Retrieve upcoming scheduled meetings
  let initialMeetings: ScheduledMeeting[] = [];
  try {
    const { data: rawMeetings } = await supabase
      .from("scheduled_meetings")
      .select(`
        id,
        title,
        description,
        meeting_date,
        start_time,
        end_time,
        owner_id,
        room_code,
        meeting_link,
        meeting_type,
        status,
        invited_participant_ids,
        reminder_minutes,
        created_at,
        updated_at,
        profiles:owner_id (
          full_name,
          username,
          avatar_url
        )
      `)
      .order("meeting_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (rawMeetings && Array.isArray(rawMeetings)) {
      initialMeetings = rawMeetings.map((row: any) => {
        const ownerProf = row.profiles;
        return {
          id: row.id,
          title: row.title,
          description: row.description,
          meeting_date: row.meeting_date,
          start_time: row.start_time,
          end_time: row.end_time,
          owner_id: row.owner_id,
          owner_name: ownerProf?.full_name || ownerProf?.username || (row.owner_id === user.id ? fullName : "Learner"),
          owner_username: ownerProf?.username,
          owner_avatar: ownerProf?.avatar_url || null,
          room_code: row.room_code,
          meeting_link: row.meeting_link,
          meeting_type: row.meeting_type || "study_group",
          status: row.status || "upcoming",
          invited_participant_ids: row.invited_participant_ids || [],
          reminder_minutes: row.reminder_minutes ?? 15,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      });
    }
  } catch (err) {
    console.warn("Could not load dashboard meetings:", err);
  }

  return (
    <div className="relative min-h-screen">
      {/* Background Fluid Atmosphere */}
      <FluidAtmosphere />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome Dimensional Hero Banner */}
        <div className="relative rounded-3xl p-8 sm:p-10 text-white shadow-2xl overflow-hidden bg-gradient-to-r from-brand-600 via-indigo-700 to-purple-800 border border-white/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent-amber/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-extrabold shadow-lg">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
                  <span>LearnLync Member</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Welcome back, {fullName}!
                </h1>
                <p className="text-indigo-100 text-xs sm:text-sm">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition shadow-lg hover:scale-105 active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>

        {/* User-Facing Learning Space (Metrics, Live Messaging status, Recent Exchange Activity) */}
        <LearningSpace requestsData={requestsData} currentUserId={user.id} />

        {/* Upcoming Meetings Section (With live countdown & owner names) */}
        <UpcomingMeetingsWidget
          initialMeetings={initialMeetings}
          currentUserId={user.id}
          currentUserName={fullName}
        />

        {/* Skills Profile Info Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold text-base text-slate-900 dark:text-white">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <span>Your Skill Portfolio</span>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>Edit Skills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Bio
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {bio}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                Skills You Teach
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {skillsOffered.length > 0 ? (
                  skillsOffered.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 shadow-2xs"
                    >
                      ✓ {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No skills listed yet</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
                Skills You Want to Master
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {skillsNeeded.length > 0 ? (
                  skillsNeeded.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-200 dark:border-brand-900/50 shadow-2xs"
                    >
                      ✦ {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No learning goals listed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Incoming Exchange Alert */}
        {pendingIncomingCount > 0 && (
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-5 text-white shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md">
                <ArrowLeftRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  You have {pendingIncomingCount} pending skill exchange request{pendingIncomingCount > 1 ? "s" : ""}!
                </p>
                <p className="text-xs text-indigo-100">
                  Peers want to learn from you and teach skills in return.
                </p>
              </div>
            </div>
            <Link
              href="/requests"
              className="px-5 py-2.5 rounded-2xl bg-white text-brand-700 text-xs font-bold hover:bg-slate-50 transition shadow-md shrink-0"
            >
              Review Requests →
            </Link>
          </div>
        )}

        {/* Connected Learning Partners (Accepted Exchanges) */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold text-base text-slate-900 dark:text-white">
              <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Connected Learning Partners ({accepted.length})</span>
            </div>
            <Link
              href="/requests"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              View All Requests →
            </Link>
          </div>

          {accepted.length === 0 ? (
            <div className="space-y-4">
              <div className="p-8 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Direct Messaging is Ready
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect directly with peer learners to exchange skills, share files, and collaborate in real-time.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Link
                    href="/chat"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Messages Workspace</span>
                  </Link>
                  <Link
                    href="/learners"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Browse Learners</span>
                  </Link>
                </div>
              </div>

              {peers.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Quick Chat with Active Learners
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {peers.slice(0, 3).map((peer) => (
                      <div
                        key={peer.id}
                        className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col justify-between gap-3 hover:border-brand-400 transition"
                      >
                        <div className="flex items-center gap-3">
                          {peer.avatar_url ? (
                            <img
                              src={peer.avatar_url}
                              alt={peer.full_name || "Peer"}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                              {(peer.full_name || peer.username || "P").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {peer.full_name}
                            </p>
                            <p className="text-xs font-mono text-slate-400 truncate">
                              @{peer.username}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/chat/${peer.id}`}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 transition shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </Link>
                          <Link
                            href={`/chat/${peer.id}`}
                            className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition shadow-xs"
                            title="Start Video Call"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Call</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accepted.map((exc) => {
                const isSender = exc.sender_id === user.id;
                const partner = isSender ? exc.receiver : exc.sender;
                const partnerId = isSender ? exc.receiver_id : exc.sender_id;
                const partnerName = partner?.full_name || "Learning Partner";
                const partnerInitial = partnerName.charAt(0).toUpperCase();

                return (
                  <div
                    key={exc.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-3.5 hover:border-brand-400 transition"
                  >
                    <div className="flex items-center gap-3">
                      {partner?.avatar_url ? (
                        <img
                          src={partner.avatar_url}
                          alt={partnerName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {partnerInitial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {partnerName}
                        </p>
                        <p className="text-xs font-mono text-slate-400 truncate">
                          @{partner?.username || "peer"}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                        Teaching: {isSender ? exc.skill_offered : exc.skill_wanted}
                      </p>
                      <p className="text-brand-600 dark:text-brand-400 font-semibold truncate">
                        Learning: {isSender ? exc.skill_wanted : exc.skill_offered}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/chat/${partnerId}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 transition shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </Link>
                      <Link
                        href={`/chat/${partnerId}`}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition shadow-xs"
                        title="Start Video Call"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Video Call</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Peer Learner Discovery */}
        <div className="pt-2">
          <LearnersExplorer
            initialPeers={peers}
            currentUserId={user.id}
            currentUserSkillsOffered={skillsOffered}
            initialError={peersError}
            title="Explore Skill Peers"
            description="Discover fellow learners with complementary skills, propose exchanges, and chat in real time."
            limit={6}
            showViewAllLink={true}
          />
        </div>
      </div>
    </div>
  );
}
