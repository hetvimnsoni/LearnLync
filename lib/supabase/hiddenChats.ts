import { createClient } from "@/lib/supabase/client";

const LOCAL_STORAGE_PREFIX = "learnlync_hidden_chats_";

function getStorageKey(userId: string): string {
  return `${LOCAL_STORAGE_PREFIX}${userId}`;
}

/**
 * Returns locally cached hidden peer IDs for instant zero-latency UI updates.
 */
export function getLocalHiddenPeerIds(userId: string): Set<string> {
  if (typeof window === "undefined" || !userId) return new Set();
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/**
 * Saves a peerId to the local hidden set.
 */
function addLocalHiddenPeerId(userId: string, peerId: string) {
  if (typeof window === "undefined" || !userId || !peerId) return;
  try {
    const set = getLocalHiddenPeerIds(userId);
    set.add(peerId);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn("Error updating local hidden chats:", err);
  }
}

/**
 * Removes a peerId from the local hidden set (e.g. when initiating a new chat).
 */
function removeLocalHiddenPeerId(userId: string, peerId: string) {
  if (typeof window === "undefined" || !userId || !peerId) return;
  try {
    const set = getLocalHiddenPeerIds(userId);
    set.delete(peerId);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn("Error clearing local hidden chat:", err);
  }
}

/**
 * Fetches all hidden peer IDs for a user from Supabase and syncs with localStorage.
 */
export async function fetchHiddenPeerIds(userId: string): Promise<Set<string>> {
  const localSet = getLocalHiddenPeerIds(userId);
  if (!userId) return localSet;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_hidden_conversations")
      .select("peer_id")
      .eq("user_id", userId);

    if (error) {
      console.warn("Could not query chat_hidden_conversations from Supabase:", error.message);
      return localSet;
    }

    if (data && Array.isArray(data)) {
      data.forEach((row: { peer_id: string }) => {
        if (row.peer_id) localSet.add(row.peer_id);
      });
      // Update local cache
      if (typeof window !== "undefined") {
        localStorage.setItem(getStorageKey(userId), JSON.stringify(Array.from(localSet)));
      }
    }
  } catch (err) {
    console.warn("Exception querying hidden chats:", err);
  }

  return localSet;
}

/**
 * Hides a conversation for the current user ("Delete for Me").
 * Updates both localStorage and Supabase.
 */
export async function hideChatForUser(userId: string, peerId: string): Promise<boolean> {
  if (!userId || !peerId) return false;

  // 1. Optimistic local update
  addLocalHiddenPeerId(userId, peerId);

  // 2. Persist to Supabase
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("chat_hidden_conversations")
      .upsert(
        {
          user_id: userId,
          peer_id: peerId,
          hidden_at: new Date().toISOString(),
        },
        { onConflict: "user_id,peer_id" }
      );

    if (error) {
      console.warn("Could not upsert hidden conversation in Supabase:", error.message);
    }
    return true;
  } catch (err) {
    console.warn("Exception in hideChatForUser:", err);
    return true; // Local update still succeeded
  }
}

/**
 * Restores a conversation for the current user (e.g. when a new message is sent).
 */
export async function unhideChatForUser(userId: string, peerId: string): Promise<boolean> {
  if (!userId || !peerId) return false;

  // 1. Clear from local storage
  removeLocalHiddenPeerId(userId, peerId);

  // 2. Delete from Supabase
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("chat_hidden_conversations")
      .delete()
      .eq("user_id", userId)
      .eq("peer_id", peerId);

    if (error) {
      console.warn("Could not remove hidden conversation from Supabase:", error.message);
    }
    return true;
  } catch (err) {
    console.warn("Exception in unhideChatForUser:", err);
    return true;
  }
}

/**
 * Restores ALL hidden conversations for the current user.
 */
export async function unhideAllChatsForUser(userId: string): Promise<boolean> {
  if (!userId) return false;

  // 1. Clear local storage
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(getStorageKey(userId));
    } catch {}
  }

  // 2. Clear from Supabase
  try {
    const supabase = createClient();
    await supabase.from("chat_hidden_conversations").delete().eq("user_id", userId);
    return true;
  } catch (err) {
    console.warn("Exception in unhideAllChatsForUser:", err);
    return true;
  }
}

