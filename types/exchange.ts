import { PeerProfile } from "./learner";

export type ExchangeStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface SkillExchange {
  id: string;
  sender_id: string;
  receiver_id: string;
  skill_offered: string;
  skill_wanted: string;
  message: string | null;
  status: ExchangeStatus;
  created_at: string;
  updated_at: string;
  sender?: PeerProfile;
  receiver?: PeerProfile;
}

export interface CreateExchangeInput {
  receiverId: string;
  skillOffered: string;
  skillWanted: string;
  message?: string;
}

export interface ExchangeActionResult {
  success?: boolean;
  error?: string;
  message?: string;
  exchange?: SkillExchange;
}

export interface CategorizedRequests {
  incoming: SkillExchange[];
  outgoing: SkillExchange[];
  accepted: SkillExchange[];
  pendingIncomingCount: number;
}

