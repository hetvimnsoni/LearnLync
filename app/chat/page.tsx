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

  // 1. Fetch user-specific hidden/deleted conversations
  const hiddenPeerIds = new Set<string>();
  try {
    const { data: hiddenRows } = await supabase
      .from("chat_hidden_conversations")
      .select("peer_id")
      .eq("user_id", user.id);

    if (hiddenRows && Array.isArray(hiddenRows)) {
      hiddenRows.forEach((r: { peer_id: string }) => {
        if (r.peer_id) hiddenPeerIds.add(r.peer_id);
      });
    }
  } catch (err) {
    console.warn("Could not load hidden conversations:", err);
  }

  // 2. Fetch accepted skill exchanges involving current user to get priority peers
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

  // 3. Fetch all other profiles for learner directory & fallback contacts
  const { data: allProfilesData } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed")
    .neq("id", user.id)
    .limit(50);

  const allLearners: PeerProfile[] = (allProfilesData as PeerProfile[]) || [];

  // 4. Construct initial conversation peers list
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

  // Fetch current user's profile info for calling identification
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
