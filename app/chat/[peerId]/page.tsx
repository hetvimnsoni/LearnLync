
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toSupabaseUserId } from "@/lib/nexconn/identity";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { PeerProfile } from "@/types/learner";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { ArrowLeft, UserX, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface ChatPageProps {
  params: Promise<{
    peerId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const resolvedParams = await params;
  const rawParam = resolvedParams?.peerId
    ? decodeURIComponent(resolvedParams.peerId).trim()
    : "";

  // 1. Authenticate the active user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/chat/${encodeURIComponent(rawParam)}`);
  }

  // 2. Resolve learner identifier
  const standardUuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const nexconnIdRegex = /^[0-9a-f]{32}$/i;

  let resolvedId: string | null = null;

  if (standardUuidRegex.test(rawParam)) {
    resolvedId = rawParam.toLowerCase();
  } else if (nexconnIdRegex.test(rawParam)) {
    try {
      resolvedId = toSupabaseUserId(rawParam);
    } catch {
      resolvedId = null;
    }
  }

  // 3. Query profile from Supabase
  let profile: any = null;

  if (resolvedId) {
    const { data: profileById } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed")
      .eq("id", resolvedId)
      .maybeSingle();

    profile = profileById;
  }

  if (!profile && rawParam) {
    const cleanUsername = rawParam.replace(/^@/, "").trim();

    const { data: profileByUsername } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed")
      .ilike("username", cleanUsername)
      .maybeSingle();

    profile = profileByUsername;

    if (profile) {
      resolvedId = profile.id;
    }
  }

  if (!profile && resolvedId) {
    profile = {
      id: resolvedId,
      full_name: "Peer Learner",
      username: `learner_${resolvedId.slice(0, 6)}`,
      avatar_url: null,
      bio: null,
      skills_offered: [],
      skills_needed: [],
    };
  }

  // 4. Reject attempts to message oneself
  if (profile && user.id === profile.id) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <FluidAtmosphere />
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Cannot Message Yourself
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              One-to-one chat is designed for connecting with other learners. Find a peer on the discovery page.
            </p>
          </div>
          <Link href="/learners" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discover Learners</span>
          </Link>
        </div>
      </div>
    );
  }

  // 5. Handle unresolvable learner
  if (!profile) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <FluidAtmosphere />
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
            <UserX className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Learner Not Found
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Could not find a learner matching &quot;{rawParam}&quot;. Please check the identifier or explore discoverable peers.
            </p>
          </div>
          <Link href="/learners" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Explore Other Learners</span>
          </Link>
        </div>
      </div>
    );
  }

  // 6. Fetch accepted skill exchanges
  const { data: exchanges } = await supabase
    .from("skill_exchanges")
    .select("sender_id, receiver_id, status")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq("status", "accepted");

  const acceptedPeerIds = new Set<string>();

  if (exchanges && Array.isArray(exchanges)) {
    for (const ex of exchanges) {
      if (ex.sender_id !== user.id) acceptedPeerIds.add(ex.sender_id);
      if (ex.receiver_id !== user.id) acceptedPeerIds.add(ex.receiver_id);
    }
  }

  // 7. Fetch other learner profiles
  const { data: allProfilesData } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed")
    .neq("id", user.id)
    .limit(50);

  const allLearners: PeerProfile[] =
    (allProfilesData as PeerProfile[]) || [];

  // 8. Prioritize the active peer and accepted connections
  const otherPeers = allLearners.filter((p) => p.id !== profile.id);

  const conversationPeers: PeerProfile[] = [
    profile as PeerProfile,
    ...otherPeers.filter((p) => acceptedPeerIds.has(p.id)),
    ...otherPeers.filter((p) => !acceptedPeerIds.has(p.id)).slice(0, 6),
  ];

  // 9. Fetch current user's calling identity
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const currentUserName =
    myProfile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Learner";

  const currentUserAvatar =
    myProfile?.avatar_url || user.user_metadata?.avatar_url || null;

  // 10. Render Bhakti's upgraded chat workspace
  return (
    <ChatWorkspace
      currentUserId={user.id}
      currentUserName={currentUserName}
      currentUserAvatar={currentUserAvatar}
      initialPeers={conversationPeers}
      allLearners={allLearners}
      initialActivePeerId={profile.id}
    />
  );
}
