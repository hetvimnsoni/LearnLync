import { createClient } from "@/lib/supabase/client";

const LOCAL_STORAGE_DELETED_MSGS_PREFIX = "learnlync_deleted_msgs_";
const LOCAL_STORAGE_EVERYONE_DELETED_PREFIX = "learnlync_everyone_deleted_";

function getDeletedForMeStorageKey(userId: string): string {
  return `${LOCAL_STORAGE_DELETED_MSGS_PREFIX}${userId}`;
}

function getDeletedForEveryoneStorageKey(conversationKey: string): string {
  return `${LOCAL_STORAGE_EVERYONE_DELETED_PREFIX}${conversationKey}`;
}

/**
 * Returns locally cached message IDs deleted for the current user ("Delete for Me").
 */
export function getLocalDeletedForMeIds(userId: string): Set<string> {
  if (typeof window === "undefined" || !userId) return new Set();
  try {
    const raw = localStorage.getItem(getDeletedForMeStorageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/**
 * Adds a messageId to the user's local "Delete for Me" cache.
 */
export function addLocalDeletedForMeId(userId: string, messageId: string) {
  if (typeof window === "undefined" || !userId || !messageId) return;
  try {
    const set = getLocalDeletedForMeIds(userId);
    set.add(messageId);
    localStorage.setItem(getDeletedForMeStorageKey(userId), JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn("Could not save to local deleted messages:", err);
  }
}

/**
 * Returns locally cached message IDs deleted for everyone in this conversation.
 */
export function getLocalDeletedForEveryoneIds(conversationKey: string): Set<string> {
  if (typeof window === "undefined" || !conversationKey) return new Set();
  try {
    const raw = localStorage.getItem(getDeletedForEveryoneStorageKey(conversationKey));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/**
 * Adds a messageId to the local "Delete for Everyone" cache.
 */
export function addLocalDeletedForEveryoneId(conversationKey: string, messageId: string) {
  if (typeof window === "undefined" || !conversationKey || !messageId) return;
  try {
    const set = getLocalDeletedForEveryoneIds(conversationKey);
    set.add(messageId);
    localStorage.setItem(
      getDeletedForEveryoneStorageKey(conversationKey),
      JSON.stringify(Array.from(set))
    );
  } catch (err) {
    console.warn("Could not save to local everyone deleted messages:", err);
  }
}

/**
 * Deletes a message ONLY for the current user ("Delete for Me").
 */
export async function deleteMessageForMe(userId: string, messageId: string): Promise<boolean> {
  if (!userId || !messageId) return false;

  // 1. Optimistic local update
  addLocalDeletedForMeId(userId, messageId);

  // 2. Persist to Supabase
  try {
    const supabase = createClient();
    const { error } = await supabase.from("chat_message_deletions").upsert(
      {
        user_id: userId,
        message_id: messageId,
        deleted_at: new Date().toISOString(),
      },
      { onConflict: "message_id,user_id" }
    );

    if (error) {
      console.warn("Could not persist message deletion in Supabase:", error.message);
    }
    return true;
  } catch (err) {
    console.warn("Exception in deleteMessageForMe:", err);
    return true;
  }
}

/**
 * Deletes a message for ALL participants ("Delete for Everyone").
 * Only valid for messages sent by the current user.
 */
export async function deleteMessageForEveryone(
  senderId: string,
  receiverId: string,
  messageId: string
): Promise<boolean> {
  if (!senderId || !receiverId || !messageId) return false;

  const conversationKey = [senderId, receiverId].sort().join("_");

  // 1. Optimistic local cache
  addLocalDeletedForEveryoneId(conversationKey, messageId);

  // 2. Persist in Supabase chat_messages table
  try {
    const supabase = createClient();

    // Upsert or update status
    await supabase.from("chat_messages").upsert(
      {
        id: messageId,
        sender_id: senderId,
        receiver_id: receiverId,
        text: "🚫 This message was deleted",
        is_deleted_for_everyone: true,
        deleted_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    // 3. Broadcast Realtime signal on direct channel
    const channelName = `chat_direct_${conversationKey}`;
    const channel = supabase.channel(channelName);
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "message_deleted_for_everyone",
      payload: { messageId, senderId },
    });
    supabase.removeChannel(channel);

    return true;
  } catch (err) {
    console.warn("Exception in deleteMessageForEveryone:", err);
    return true;
  }
}

/**
 * Fetches all deleted message IDs for a user and conversation from Supabase.
 */
export async function fetchAllDeletedIds(
  userId: string,
  peerId: string
): Promise<{ deletedForMe: Set<string>; deletedForEveryone: Set<string> }> {
  const conversationKey = [userId, peerId].sort().join("_");
  const deletedForMe = getLocalDeletedForMeIds(userId);
  const deletedForEveryone = getLocalDeletedForEveryoneIds(conversationKey);

  try {
    const supabase = createClient();

    // 1. Fetch user's "Delete for Me" records
    const { data: myDeletions } = await supabase
      .from("chat_message_deletions")
      .select("message_id")
      .eq("user_id", userId);

    if (myDeletions && Array.isArray(myDeletions)) {
      myDeletions.forEach((row: { message_id: string }) => {
        if (row.message_id) deletedForMe.add(row.message_id);
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(getDeletedForMeStorageKey(userId), JSON.stringify(Array.from(deletedForMe)));
      }
    }

    // 2. Fetch "Delete for Everyone" records
    const { data: everyoneDeletions } = await supabase
      .from("chat_messages")
      .select("id")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq("is_deleted_for_everyone", true);

    if (everyoneDeletions && Array.isArray(everyoneDeletions)) {
      everyoneDeletions.forEach((row: { id: string }) => {
        if (row.id) deletedForEveryone.add(row.id);
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(
          getDeletedForEveryoneStorageKey(conversationKey),
          JSON.stringify(Array.from(deletedForEveryone))
        );
      }
    }
  } catch (err) {
    console.warn("Exception fetching deleted message IDs:", err);
  }

  return { deletedForMe, deletedForEveryone };
}
