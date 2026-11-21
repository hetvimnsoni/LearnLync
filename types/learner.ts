export interface PeerProfile {
  id: string; // Supabase auth.users UUID (36 chars)
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills_offered: string[];
  skills_needed: string[];
  created_at: string;
  nexconnUserId: string; // Alphanumeric 32-char Nexconn User ID
}

export interface LearnerFilterState {
  searchQuery: string;
  selectedSkill: string | null;
}

