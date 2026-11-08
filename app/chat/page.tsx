import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatIndexExplorer } from "@/components/chat/ChatIndexExplorer";
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

  // 1. Fetch accepted skill exchanges involving current user to get priority peers
  const { data: exchanges } = await supabase
    .from("skill_exchanges")
    .select("sender_id, receiver_id, status")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq("status", "accepted");

  const peerIds = new Set<string>();
  if (exchanges && Array.isArray(exchanges)) {
    for (const ex of exchanges) {
      if (ex.sender_id !== user.id) peerIds.add(ex.sender_id);
      if (ex.receiver_id !== user.id) peerIds.add(ex.receiver_id);
    }
  }

  // 2. Fetch profiles of these peers, or general learners if list is small
  let peers: PeerProfile[] = [];
  if (peerIds.size > 0) {
    const { data: peerProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed")
      .in("id", Array.from(peerIds));

    if (peerProfiles) {
      peers = peerProfiles as PeerProfile[];
    }
  }

  // If no accepted peers yet, fetch recent profiles to display quick chat opportunities
  if (peers.length === 0) {
    const { data: generalProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed")
      .neq("id", user.id)
      .limit(10);

    if (generalProfiles) {
      peers = generalProfiles as PeerProfile[];
    }
  }

  return <ChatIndexExplorer currentUserId={user.id} peers={peers} />;
}

