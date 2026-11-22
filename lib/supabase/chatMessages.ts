import { createClient } from "@/lib/supabase/client";
import {
  ChatMessage,
  parseAttachmentMessage,
  parseVoiceMessage,
  parseCallMessage,
  isDeletedForEveryonePayload,
} from "@/types/chat";
import { toNexconnUserId } from "@/lib/nexconn/identity";

/**
 * Normalizes a Supabase chat_messages row into a ChatMessage object.
 */
export function rowToChatMessage(
  row: any,
  currentUserId: string,
  currentUserNexconnId?: string
): ChatMessage {
  const isSelf = row.sender_id === currentUserId;
  const isDeletedForEveryone =
    Boolean(row.is_deleted_for_everyone) || isDeletedForEveryonePayload(row.text);

  const rawText = isDeletedForEveryone ? "🚫 This message was deleted" : row.text || "";
  const attachmentData = !isDeletedForEveryone ? parseAttachmentMessage(rawText) || undefined : undefined;
  const voiceData = !isDeletedForEveryone ? parseVoiceMessage(rawText) || undefined : undefined;
  const callData = !isDeletedForEveryone ? parseCallMessage(rawText) || undefined : undefined;

  const sentTime = row.created_at ? new Date(row.created_at).getTime() : Date.now();
  const senderNexconn = isSelf
    ? currentUserNexconnId || toNexconnUserId(currentUserId)
    : toNexconnUserId(row.sender_id);

  return {
    id: row.id || `msg-${sentTime}`,
    senderUserId: senderNexconn,
    text: rawText,
    sentTime,
    status: "sent",
    isSelf,
    attachmentData,
    voiceData,
    callData,
    isDeletedForEveryone,
  };
}

/**
 * Loads message history between two users from the Supabase chat_messages table.
 */
export async function fetchSupabaseMessages(
  userId: string,
  peerId: string,
  currentUserNexconnId?: string
): Promise<ChatMessage[]> {
  if (!userId || !peerId) return [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, sender_id, receiver_id, text, is_deleted_for_everyone, created_at")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`
      )
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.warn("Could not query chat_messages from Supabase:", error.message);
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map((row) => rowToChatMessage(row, userId, currentUserNexconnId));
  } catch (err) {
    console.warn("Exception querying Supabase messages:", err);
    return [];
  }
}

/**
 * Persists a message to Supabase chat_messages table and broadcasts it via Supabase Realtime.
 */
export async function saveSupabaseMessage(params: {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
}): Promise<boolean> {
  const { id, senderId, receiverId, text } = params;
  if (!senderId || !receiverId || !text) return false;

  const conversationKey = [senderId, receiverId].sort().join("_");

  try {
    const supabase = createClient();

    // 1. Persist to DB table
    const { error } = await supabase.from("chat_messages").upsert(
      {
        id,
        sender_id: senderId,
        receiver_id: receiverId,
        text,
        is_deleted_for_everyone: false,
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.warn("Could not insert chat_message into Supabase:", error.message);
    }

    // 2. Broadcast via Supabase Realtime direct channel
    const channelName = `chat_direct_${conversationKey}`;
    const channel = supabase.channel(channelName);
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "new_message",
      payload: {
        id,
        sender_id: senderId,
        receiver_id: receiverId,
        text,
        created_at: new Date().toISOString(),
      },
    });
    supabase.removeChannel(channel);

    return true;
  } catch (err) {
    console.warn("Exception saving Supabase message:", err);
    return false;
  }
}

/**
 * Subscribes to incoming messages in real time via Supabase Realtime channel.
 */
export function subscribeSupabaseMessages(
  userId: string,
  peerId: string,
  currentUserNexconnId: string | undefined,
  onMessage: (msg: ChatMessage) => void
): () => void {
  const conversationKey = [userId, peerId].sort().join("_");
  const supabase = createClient();
  const channelName = `chat_direct_${conversationKey}`;

  const channel = supabase.channel(channelName);

  channel
    .on("broadcast", { event: "new_message" }, ({ payload }: { payload: { id: string; [key: string]: unknown } }) => {
      if (payload && payload.id) {
        // Only deliver if message is from the peer (or self from another tab)
        const incomingMsg = rowToChatMessage(payload, userId, currentUserNexconnId);
        onMessage(incomingMsg);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
