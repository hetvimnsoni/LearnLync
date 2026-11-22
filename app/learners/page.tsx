import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLearnerPeers } from "@/lib/learners";
import { LearnersMapExplorer } from "@/components/learners/LearnersMapExplorer";
import { LearnersAtmosphere } from "@/components/learners/LearnersAtmosphere";
import { PeerConnectionStatus } from "@/types/learner";
import { isPlaceholderSupabase } from "@/lib/demo";
import { resolveLearnerLocation } from "@/lib/geo";
import { toNexconnUserId } from "@/lib/nexconn/identity";
import { ArrowLeft, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearnersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/learners");
  }

  // Fetch peers, user profile, and active exchange connections in parallel (Zero N+1 queries)
  const [
    { peers, currentUserId, error },
    { data: myProfile },
    { data: exchangeRows, error: exchangeError },
  ] = await Promise.all([
    getLearnerPeers(),
    supabase
      .from("profiles")
      .select("skills_offered")
      .eq("id", user.id)
      .single(),
    supabase
      .from("skill_exchanges")
      .select("id, sender_id, receiver_id, status")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
  ]);

  if (exchangeError) {
    console.error("Error fetching skill_exchanges for learners page:", exchangeError.message);
  }

  const mySkills: string[] = Array.isArray(myProfile?.skills_offered)
    ? myProfile.skills_offered
    : [];

  const initialConnections: Record<string, PeerConnectionStatus> = {};
  const currentUserIdNormalized = user.id.toLowerCase();

  if (exchangeRows && Array.isArray(exchangeRows)) {
    exchangeRows.forEach((row: any) => {
      const senderId = String(row.sender_id || "").toLowerCase();
      const receiverId = String(row.receiver_id || "").toLowerCase();
      const status = String(row.status || "").trim().toLowerCase();

      let peerId: string | null = null;
      if (senderId === currentUserIdNormalized) {
        peerId = row.receiver_id;
      } else if (receiverId === currentUserIdNormalized) {
        peerId = row.sender_id;
      }

      if (!peerId) return;

      if (status === "accepted" || status === "completed") {
        initialConnections[peerId] = "connected";
        initialConnections[peerId.toLowerCase()] = "connected";
      } else if (status === "pending" && !initialConnections[peerId]) {
        initialConnections[peerId] = "pending";
        initialConnections[peerId.toLowerCase()] = "pending";
      }
    });
  }

  // Ensure all peers who have accepted connections exist in the peers array
  const existingPeerIdSet = new Set(peers.map((p) => p.id.toLowerCase()));
  const missingConnectedIds = Object.keys(initialConnections).filter(
    (id) => initialConnections[id] === "connected" && !existingPeerIdSet.has(id.toLowerCase())
  );

  if (missingConnectedIds.length > 0) {
    const uniqueMissingIds = Array.from(new Set(missingConnectedIds));
    const { data: missingProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed, created_at")
      .in("id", uniqueMissingIds);

    if (missingProfiles && Array.isArray(missingProfiles)) {
      missingProfiles.forEach((profile: any) => {
        const geo = resolveLearnerLocation({
          id: profile.id,
          username: profile.username,
          bio: profile.bio,
        });

        peers.push({
          id: profile.id,
          full_name: profile.full_name || "Learner Peer",
          username: profile.username || `learner_${profile.id.slice(0, 5)}`,
          avatar_url: profile.avatar_url || null,
          bio: profile.bio || "Active learner on LearnLync ready for reciprocal skill exchange.",
          skills_offered: Array.isArray(profile.skills_offered) ? profile.skills_offered : [],
          skills_needed: Array.isArray(profile.skills_needed) ? profile.skills_needed : [],
          created_at: profile.created_at,
          nexconnUserId: toNexconnUserId(profile.id),
          city: geo?.city || "San Francisco",
          country: geo?.country || "United States",
          country_code: geo?.countryCode || "US",
          show_on_community_map: true,
          latitude: geo?.lat ?? 37.7749,
          longitude: geo?.lon ?? -122.4194,
        });
      });
    }
  }

  // Temporary server-side development diagnostics for counts only (no secrets or PII)
  if (process.env.NODE_ENV !== "production") {
    console.log("[FindPeers Diagnostics]", {
      exchangeRowsCount: exchangeRows?.length ?? 0,
      connectedCount: Object.values(initialConnections).filter((s) => s === "connected").length,
      pendingCount: Object.values(initialConnections).filter((s) => s === "pending").length,
      totalPeersCount: peers.length,
      matchedConnectedPeersCount: peers.filter((p) => initialConnections[p.id] === "connected").length,
    });
  }

  // Demo fallback only when running in placeholder/demo mode
  if (isPlaceholderSupabase() && Object.keys(initialConnections).length === 0 && peers.length > 0) {
    if (peers[0]) initialConnections[peers[0].id] = "connected";
    if (peers[1]) initialConnections[peers[1].id] = "pending";
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      {/* Premium fluid lavender, violet, pale-blue & mint background */}
      <LearnersAtmosphere />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/80 dark:bg-slate-900/80 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80 backdrop-blur-md shadow-sm self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
            <span>Global 3D Peer Network Active</span>
          </div>
        </div>

        {/* 3D Global Earth Map Explorer */}
        <LearnersMapExplorer
          initialPeers={peers}
          currentUserId={currentUserId}
          currentUserSkillsOffered={mySkills}
          initialConnections={initialConnections}
          initialError={error}
        />
      </div>
    </div>
  );
}
