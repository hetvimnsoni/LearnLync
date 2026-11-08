export type MessageDeliveryStatus = "sending" | "sent" | "failed";

export interface ChatMessage {
  id: string; // Server messageId or local optimistic tempId
  tempId?: string; // Optimistic temporary identifier for deduplication
  senderUserId: string; // Nexconn alphanumeric user ID
  text: string;
  sentTime: number; // Unix timestamp in ms
  status: MessageDeliveryStatus;
  errorMessage?: string;
  isSelf: boolean;
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

