import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toNexconnUserId } from "@/lib/nexconn/identity";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ChatPeerInfo } from "@/types/chat";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { ArrowLeft, UserX, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface ChatPageProps {
  params: Promise<{
    peerId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { peerId } = await params;

  // 1. Authenticate the active user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/chat/${encodeURIComponent(peerId)}`);
  }

  // 2. Reject attempts to message oneself
  if (user.id === peerId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
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
        <Link
          href="/learners"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discover Learners</span>
        </Link>
      </div>
    );
  }

  // 3. Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(peerId)) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 mx-auto flex items-center justify-center">
          <UserX className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Invalid Learner Identifier
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The requested peer ID does not match a valid user UUID.
          </p>
        </div>
        <Link
          href="/learners"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-700 text-xs font-semibold hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Learners</span>
        </Link>
      </div>
    );
  }

  // 4. Fetch the target peer profile from Supabase
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed")
    .eq("id", peerId)
    .single();

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
          <UserX className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Learner Not Found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The profile for this learner does not exist or has been removed.
          </p>
        </div>
        <Link
          href="/learners"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Other Learners</span>
        </Link>
      </div>
    );
  }

  // 5. Construct normalized peer info with deterministic Nexconn ID
  const peerInfo: ChatPeerInfo = {
    id: profile.id,
    nexconnUserId: toNexconnUserId(profile.id),
    fullName: profile.full_name || "Learner",
    username: profile.username || `learner_${profile.id.slice(0, 5)}`,
    avatarUrl: profile.avatar_url || null,
    bio: profile.bio || null,
    skillsOffered: Array.isArray(profile.skills_offered) ? profile.skills_offered : [],
    skillsNeeded: Array.isArray(profile.skills_needed) ? profile.skills_needed : [],
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <FluidAtmosphere />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ChatRoom peer={peerInfo} currentUserId={user.id} />
      </div>
    </div>
  );
}

