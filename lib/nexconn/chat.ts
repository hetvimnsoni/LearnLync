"use client";

import {
  BaseChannel,
  DirectChannel,
  DirectChannelIdentifier,
  SendTextMessageParams,
  MessageHandler,
  NCEngine,
  ChannelType,
  Message,
  MessagesQuery,
  SentStatus,
  NCResult,
} from "@nexconn/chat";
import {
  ChatMessage,
  parseVoiceMessage,
  parseAttachmentMessage,
  parseCallMessage,
  isDeletedForEveryonePayload,
} from "@/types/chat";

/**
 * Normalizes and guarantees valid numeric timestamps (milliseconds).
 */
export function normalizeTimestamp(rawTime: any): number {
  if (typeof rawTime === "number" && rawTime > 0) {
    return rawTime;
  }
  if (typeof rawTime === "string") {
    const parsed = parseInt(rawTime, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    const dateParsed = Date.parse(rawTime);
    if (!isNaN(dateParsed) && dateParsed > 0) return dateParsed;
  }
  return Date.now();
}

/**
 * Deterministically merges and sorts messages in ascending chronological order (oldest first, newest last).
 * Eliminates duplicate IDs, reconciles optimistic tempId messages, and breaks timestamp ties stably.
 */
export function mergeAndSortMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[]
): ChatMessage[] {
  // Use a map to track messages by unique ID and tempId
  const byId = new Map<string, ChatMessage>();
  const byTempId = new Map<string, string>(); // tempId -> canonical id

  // Process existing first
  for (const msg of existing) {
    byId.set(msg.id, msg);
    if (msg.tempId) {
      byTempId.set(msg.tempId, msg.id);
    }
  }

  // Merge incoming
  for (const msg of incoming) {
    // Check if this incoming message reconciles an existing optimistic message
    if (msg.tempId && byTempId.has(msg.tempId)) {
      const canonicalOldId = byTempId.get(msg.tempId)!;
      byId.delete(canonicalOldId);
    }

    // Also check if an incoming confirmed message matches a pending sending message with same text & sender
    if (msg.status !== "sending") {
      Array.from(byId.entries()).forEach(([id, ex]) => {
        if (
          ex.status === "sending" &&
          ex.senderUserId === msg.senderUserId &&
          ex.text === msg.text &&
          Math.abs(normalizeTimestamp(ex.sentTime) - normalizeTimestamp(msg.sentTime)) < 15000
        ) {
          byId.delete(id);
        }
      });
    }

    // Set or overwrite
    byId.set(msg.id, msg);
    if (msg.tempId) {
      byTempId.set(msg.tempId, msg.id);
    }
  }

  // Convert to array and sort ascending chronologically: oldest at top, newest at bottom
  const result = Array.from(byId.values());
  result.sort((a, b) => {
    const timeA = normalizeTimestamp(a.sentTime);
    const timeB = normalizeTimestamp(b.sentTime);
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    // Stable tie-breaker by message ID
    return (a.id || "").localeCompare(b.id || "");
  });

  return result;
}

/**
 * Converts a raw Nexconn SDK Message instance into a normalized ChatMessage.
 */
export function toChatMessage(
  msg: Message<any>,
  currentNexconnUserId: string,
  tempId?: string
): ChatMessage {
  // Extract text payload defensively from content
  const text =
    msg.content?.text ||
    (typeof msg.content === "string" ? msg.content : "") ||
    (msg.content as any)?.content ||
    "";

  // Map SentStatus to DeliveryStatus
  let status: ChatMessage["status"] = "sent";
  if (msg.sentStatus === SentStatus.SENDING) {
    status = "sending";
  } else if (msg.sentStatus === SentStatus.FAILED) {
    status = "failed";
  }

  const isSelf = msg.senderUserId === currentNexconnUserId;
  const isDeleted = isDeletedForEveryonePayload(text);
  const voiceData = !isDeleted ? parseVoiceMessage(text) || undefined : undefined;
  const attachmentData = !isDeleted ? parseAttachmentMessage(text) || undefined : undefined;
  const callData = !isDeleted ? parseCallMessage(text) || undefined : undefined;

  return {
    id: msg.messageId || tempId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    tempId,
    senderUserId: msg.senderUserId,
    text,
    sentTime: normalizeTimestamp(msg.sentTime),
    status,
    isSelf,
    voiceData,
    attachmentData,
    callData,
    isDeletedForEveryone: isDeleted,
  };
}

/**
 * Creates a paginated query for loading message history with a peer.
 */
export function createDirectMessagesQuery(
  peerNexconnUserId: string,
  pageSize: number = 20
): MessagesQuery {
  return BaseChannel.createMessagesQuery({
    channelIdentifier: new DirectChannelIdentifier(peerNexconnUserId),
    pageSize,
    isAscending: false,
  });
}

/**
 * Fetches the next page of historical messages using an active MessagesQuery.
 */
export async function loadMessagePage(
  query: MessagesQuery,
  currentNexconnUserId: string
): Promise<{ messages: ChatMessage[]; hasNext: boolean; error?: string }> {
  try {
    const result = await query.loadNextPage();

    if (!result.isOk || !result.data) {
      return {
        messages: [],
        hasNext: query.hasNext,
        error: result.msg || `Failed to load message history (code ${result.code})`,
      };
    }

    const rawList = result.data.data || [];
    const messages = rawList.map((msg) => toChatMessage(msg, currentNexconnUserId));

    return {
      messages,
      hasNext: query.hasNext,
    };
  } catch (err: any) {
    return {
      messages: [],
      hasNext: false,
      error: err?.message || "Unexpected error querying message history",
    };
  }
}

/**
 * Sends a real-time direct text message to a peer over the established Nexconn connection.
 */
export async function sendDirectTextMessage(
  peerNexconnUserId: string,
  text: string,
  currentNexconnUserId: string,
  tempId?: string
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  if (!text || !text.trim()) {
    return { success: false, error: "Message cannot be empty." };
  }

  if (text.length > 2000) {
    return { success: false, error: "Message exceeds maximum length of 2000 characters." };
  }

  try {
    const channel = new DirectChannel(peerNexconnUserId);
    const params = new SendTextMessageParams({ text: text.trim() });
    const result: NCResult<Message<any>> = await channel.sendMessage(params);

    if (result.isOk && result.data) {
      const chatMessage = toChatMessage(result.data, currentNexconnUserId, tempId);
      chatMessage.status = "sent";
      return { success: true, message: chatMessage };
    } else {
      return {
        success: false,
        error: result.msg || `Failed to send message (error code ${result.code})`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Unexpected network exception while sending message",
    };
  }
}

/**
 * Clears the unread message count on the Nexconn server for a specific direct peer channel.
 */
export async function clearDirectChannelUnread(peerNexconnUserId: string): Promise<boolean> {
  if (!peerNexconnUserId) return false;
  try {
    const channel = new DirectChannel(peerNexconnUserId);
    const result = await channel.clearUnreadCount();
    return result.isOk;
  } catch (err) {
    console.warn("Failed to clear channel unread count:", err);
    return false;
  }
}

/**
 * Fetches the total unread message count across all channels from Nexconn.
 */
export async function fetchTotalUnreadCount(): Promise<number> {
  try {
    const result = await BaseChannel.getTotalUnreadCount();
    if (result.isOk && typeof result.data === "number") {
      return result.data;
    }
    return 0;
  } catch (err) {
    console.warn("Failed to fetch total unread count:", err);
    return 0;
  }
}

/**
 * Fetches all unread direct channels and returns a map of peerNexconnUserId -> unreadCount.
 */
export async function fetchUnreadChannelsMap(): Promise<Record<string, number>> {
  try {
    const result = await BaseChannel.getUnreadChannels([ChannelType.DIRECT]);
    if (result.isOk && Array.isArray(result.data)) {
      const map: Record<string, number> = {};
      for (const ch of result.data) {
        if (ch.channelId && ch.unreadCount > 0) {
          map[ch.channelId] = ch.unreadCount;
        }
      }
      return map;
    }
    return {};
  } catch (err) {
    console.warn("Failed to fetch unread channels map:", err);
    return {};
  }
}

/**
 * Subscribes to real-time incoming messages specifically for a direct peer conversation.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeDirectMessages(
  peerNexconnUserId: string,
  currentNexconnUserId: string,
  onMessage: (msg: ChatMessage) => void
): () => void {
  const handlerId = `direct-chat-${peerNexconnUserId}-${Date.now()}`;

  const handler = new MessageHandler({
    onMessageReceived({ messages }) {
      if (!Array.isArray(messages)) return;

      for (const msg of messages) {
        // Filter: Must be a direct message involving this peer
        const isDirect = msg.channelIdentifier?.channelType === ChannelType.DIRECT;
        if (!isDirect) continue;

        const isFromPeer = msg.senderUserId === peerNexconnUserId;
        const isToPeer = msg.channelIdentifier?.channelId === peerNexconnUserId;

        if (isFromPeer || isToPeer) {
          const chatMsg = toChatMessage(msg, currentNexconnUserId);
          onMessage(chatMsg);
        }
      }
    },
  });

  try {
    NCEngine.addMessageHandler(handlerId, handler);
  } catch (err: any) {
    console.warn("Failed to attach direct message handler:", err?.message);
  }

  return () => {
    try {
      NCEngine.removeMessageHandler(handlerId);
    } catch { }
  };
}

