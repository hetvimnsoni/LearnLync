export interface MeetingRoom {
  id: string;
  code: string;
  title: string;
  host_id: string;
  is_active: boolean;
  created_at: string;
  ended_at?: string | null;
}

export interface MeetingParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: "host" | "co-host" | "participant";
  joined_at: string;
  left_at?: string | null;
  full_name?: string;
  username?: string;
  avatar_url?: string | null;
}

export interface MeetingMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  content: string;
  created_at: string;
  is_self?: boolean;
}

export interface PeerStreamInfo {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  stream: MediaStream;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isSpeaking: boolean;
  isScreenShare?: boolean;
}

export interface MeetingPresenceState {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
}

export interface ScheduledMeeting {
  id: string;
  title: string;
  description?: string | null;
  meeting_date: string; // "YYYY-MM-DD"
  start_time: string;   // "HH:MM"
  end_time: string;     // "HH:MM"
  owner_id: string;
  owner_name?: string;
  owner_username?: string;
  owner_avatar?: string | null;
  room_code: string;
  meeting_link: string;
  meeting_type: "study_group" | "1-on-1" | "code_review" | "mentorship";
  status: "upcoming" | "completed" | "cancelled";
  invited_participant_ids?: string[];
  reminder_minutes?: number; // 5, 10, 15, 30, 60, 1440
  created_at: string;
  updated_at: string;
}
