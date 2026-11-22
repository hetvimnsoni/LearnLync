export type MessageDeliveryStatus = "sending" | "sent" | "failed";

export interface VoiceMessageData {
  type: "voice";
  url: string;
  duration: number; // Duration in seconds
  mimeType?: string;
  signedUrl?: string;
  storagePath?: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // MIME type (e.g. image/png, application/pdf)
  url: string;
  signedUrl?: string; // Optional signed URL for private bucket access
  storagePath?: string;
}

export interface AttachmentMessageData {
  type: "attachment";
  files: AttachmentFile[];
  caption?: string;
}

export interface CallMessageData {
  type: "call";
  callType: "video" | "audio";
  status: "missed" | "completed" | "declined" | "no_answer";
  duration: number; // in seconds
  timestamp: number;
}

export interface ChatMessage {
  id: string; // Server messageId or local optimistic tempId
  tempId?: string; // Optimistic temporary identifier for deduplication
  senderUserId: string; // Nexconn alphanumeric user ID
  text: string;
  sentTime: number; // Unix timestamp in ms
  status: MessageDeliveryStatus;
  errorMessage?: string;
  isSelf: boolean;
  voiceData?: VoiceMessageData; // Parsed voice message payload if present
  attachmentData?: AttachmentMessageData; // Parsed attachment message payload if present
  callData?: CallMessageData; // Parsed video/audio call record payload if present
  isDeletedForEveryone?: boolean; // True if message was deleted for all participants
  isDeletedForMe?: boolean; // True if message was hidden for current user only
}

export interface ChatPeerInfo {
  id: string; // Supabase UUID
  nexconnUserId: string; // 32-char alphanumeric Nexconn User ID
  fullName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  skillsOffered: string[];
  skillsNeeded: string[];
}

/**
 * Unescapes HTML entities that some real-time messaging engines encode.
 */
export function unescapeJson(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Checks if a message text is marked as deleted for everyone.
 */
export function isDeletedForEveryonePayload(text: string): boolean {
  if (!text) return false;
  const clean = unescapeJson(text).trim();
  if (clean === "🚫 This message was deleted" || clean === "This message was deleted") {
    return true;
  }
  if (!clean.startsWith("{") || !clean.endsWith("}")) return false;
  try {
    const parsed = JSON.parse(clean);
    return parsed?.type === "deleted_for_everyone";
  } catch {
    return false;
  }
}

/**
 * Safely parses a voice message payload from a raw text string.
 */
export function parseVoiceMessage(text: string): VoiceMessageData | null {
  if (!text) return null;
  const clean = unescapeJson(text).trim();
  if (!clean.startsWith("{") || !clean.endsWith("}")) return null;
  if (!clean.includes('"type":"voice"') && !clean.includes('"type": "voice"')) return null;

  try {
    const parsed = JSON.parse(clean);
    if (parsed && parsed.type === "voice" && (typeof parsed.url === "string" || typeof parsed.signedUrl === "string")) {
      const finalUrl = parsed.signedUrl || parsed.url || "";
      return {
        type: "voice",
        url: finalUrl,
        signedUrl: parsed.signedUrl,
        storagePath: parsed.storagePath,
        duration: typeof parsed.duration === "number" ? parsed.duration : 0,
        mimeType: parsed.mimeType || "audio/webm",
      };
    }
  } catch { }

  return null;
}

/**
 * Encodes a voice message payload into a JSON string suitable for the chat envelope.
 */
export function formatVoiceMessagePayload(
  url: string,
  duration: number,
  mimeType = "audio/webm",
  storagePath?: string
): string {
  return JSON.stringify({
    type: "voice",
    url,
    signedUrl: url,
    duration: Math.round(duration * 10) / 10,
    mimeType,
    storagePath,
  });
}

/**
 * Safely parses an attachment message payload (images or documents) from a raw text string.
 */
export function parseAttachmentMessage(text: string): AttachmentMessageData | null {
  if (!text) return null;
  const clean = unescapeJson(text).trim();
  if (!clean.startsWith("{") || !clean.endsWith("}")) return null;
  if (!clean.includes('"type":"attachment"') && !clean.includes('"type": "attachment"')) return null;

  try {
    const parsed = JSON.parse(clean);
    if (parsed && parsed.type === "attachment" && Array.isArray(parsed.files)) {
      return {
        type: "attachment",
        files: parsed.files.map((f: any) => ({
          id: f.id || `file_${Math.random().toString(36).substring(2, 9)}`,
          name: f.name || "Untitled File",
          size: typeof f.size === "number" ? f.size : 0,
          type: f.type || "application/octet-stream",
          url: f.signedUrl || f.url || "",
          signedUrl: f.signedUrl,
          storagePath: f.storagePath,
        })),
        caption: typeof parsed.caption === "string" ? parsed.caption : undefined,
      };
    }
  } catch { }

  return null;
}

/**
 * Encodes an attachment message payload into a JSON string for delivery.
 */
export function formatAttachmentPayload(files: AttachmentFile[], caption?: string): string {
  return JSON.stringify({
    type: "attachment",
    files,
    caption: caption?.trim() || undefined,
  });
}

/**
 * Encodes a delete-for-everyone marker into a JSON payload.
 */
export function formatDeletedForEveryonePayload(messageId: string): string {
  return JSON.stringify({
    type: "deleted_for_everyone",
    messageId,
  });
}

/**
 * Safely parses a video or audio call log payload from raw message text.
 */
export function parseCallMessage(text: string): CallMessageData | null {
  if (!text) return null;
  const clean = unescapeJson(text).trim();
  if (!clean.startsWith("{") || !clean.endsWith("}")) return null;
  if (!clean.includes('"type":"call"') && !clean.includes('"type": "call"')) return null;

  try {
    const parsed = JSON.parse(clean);
    if (parsed && parsed.type === "call") {
      return {
        type: "call",
        callType: parsed.callType === "audio" ? "audio" : "video",
        status: parsed.status || "missed",
        duration: typeof parsed.duration === "number" ? parsed.duration : 0,
        timestamp: typeof parsed.timestamp === "number" ? parsed.timestamp : Date.now(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Formats a call record into a JSON payload string.
 */
export function formatCallPayload(data: Omit<CallMessageData, "type">): string {
  return JSON.stringify({
    type: "call",
    callType: data.callType,
    status: data.status,
    duration: data.duration || 0,
    timestamp: data.timestamp || Date.now(),
  });
}
