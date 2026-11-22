import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { PeerProfile } from "@/types/learner";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/chat");
  }

  // Fetch hidden conversations, accepted exchanges, directory profiles, and user profile in parallel
  const [hiddenResult, exchangesResult, profilesResult, myProfileResult] =
    await Promise.all([
      supabase
        .from("chat_hidden_conversations")
        .select("peer_id")
        .eq("user_id", user.id),
      supabase
        .from("skill_exchanges")
        .select("sender_id, receiver_id, status")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted"),
      supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed")
        .neq("id", user.id)
        .limit(50),
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  const hiddenPeerIds = new Set<string>();
  if (hiddenResult.data && Array.isArray(hiddenResult.data)) {
    hiddenResult.data.forEach((r: { peer_id: string }) => {
      if (r.peer_id) hiddenPeerIds.add(r.peer_id);
    });
  }

  const exchanges = exchangesResult.data;
  const acceptedPeerIds = new Set<string>();
  if (exchanges && Array.isArray(exchanges)) {
    for (const ex of exchanges) {
      if (ex.sender_id !== user.id) acceptedPeerIds.add(ex.sender_id);
      if (ex.receiver_id !== user.id) acceptedPeerIds.add(ex.receiver_id);
    }
  }

  const allLearners: PeerProfile[] = (profilesResult.data as PeerProfile[]) || [];

  // Construct initial conversation peers list
  // Priority 1: Accepted exchange peers
  const priorityPeers: PeerProfile[] = allLearners.filter((p) => acceptedPeerIds.has(p.id));

  // Priority 2: Augment with recent learners if active conversations list is small
  const remainingLearners = allLearners.filter((p) => !acceptedPeerIds.has(p.id));
  const conversationPeers =
    priorityPeers.length >= 3
      ? priorityPeers
      : [...priorityPeers, ...remainingLearners.slice(0, 8 - priorityPeers.length)];

  // Default active peer is the first non-hidden conversation peer
  const firstUnhiddenPeer = conversationPeers.find((p) => !hiddenPeerIds.has(p.id)) || conversationPeers[0];

  const myProfile = myProfileResult.data;

  const currentUserName =
    myProfile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Learner";
  const currentUserAvatar = myProfile?.avatar_url || user.user_metadata?.avatar_url || null;

  return (
    <ChatWorkspace
      currentUserId={user.id}
      currentUserName={currentUserName}
      currentUserAvatar={currentUserAvatar}
      initialPeers={conversationPeers}
      allLearners={allLearners}
      initialActivePeerId={firstUnhiddenPeer?.id || null}
    />
  );
}
