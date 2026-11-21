export type AIChatRole = "user" | "assistant" | "system";

export interface AIChatMessage {
  id: string;
  conversation_id?: string;
  role: AIChatRole;
  content: string;
  metadata?: {
    intent?:
      | "general_chat"
      | "doubt_solving"
      | "study_buddy"
      | "profile_recommendation"
      | "course_recommendation"
      | "quiz_generator"
      | "roadmap_generator"
      | "skill_gap_analysis"
      | "session_prep"
      | "certificate_designer";
    suggested_actions?: Array<{
      label: string;
      action: string;
      payload?: any;
    }>;
    matched_peers?: Array<{
      id: string;
      full_name: string;
      username: string;
      avatar_url: string | null;
      bio: string;
      skills_offered: string[];
      skills_needed: string[];
      match_reason: string;
      compatibility_score?: number;
    }>;
    skill_recommendations?: Array<{
      skill: string;
      reason: string;
      applications: string;
      career_impact: string;
      learning_order: number;
      available_teachers: Array<{
        id: string;
        full_name: string;
        username: string;
      }>;
    }>;
    quiz_data?: QuizData;
    roadmap_data?: RoadmapData;
    skill_gap_data?: SkillGapData;
    session_prep_data?: SessionPrepData;
    certificate_design_data?: CertificateDesignConfig;
  };
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options?: string[]; // for multiple choice
  correct_answer: string;
  explanation: string;
  topic: string;
}

export interface QuizData {
  id?: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  questions: QuizQuestion[];
  created_at?: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  user_answers: Record<string, string>;
  weak_topics: string[];
  revision_suggestions: string[];
  completed_at: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  skills_to_learn: string[];
  learning_order: number;
  status: "pending" | "in_progress" | "completed";
  suggested_peers: Array<{
    id: string;
    full_name: string;
    username: string;
    skills_offered: string[];
  }>;
}

export interface RoadmapData {
  id?: string;
  title: string;
  goal: string;
  current_level: "beginner" | "intermediate" | "advanced";
  stages: RoadmapMilestone[];
  progress_percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface SkillGapData {
  goal: string;
  target_role: string;
  current_skills_self_reported: string[];
  current_skills_demonstrated: string[];
  missing_skills: Array<{
    skill: string;
    priority: "high" | "medium" | "low";
    importance: string;
    teachers_available: Array<{
      id: string;
      full_name: string;
      username: string;
    }>;
  }>;
  learning_order: string[];
  progress_percentage: number;
}

export interface SessionPrepData {
  skill: string;
  teacher_name: string;
  learner_name: string;
  learning_objectives: string[];
  agenda: Array<{
    time_estimate: string;
    topic: string;
    description: string;
  }>;
  suggested_questions_for_learner: string[];
  hands_on_exercises: string[];
}

export type CertificateTemplate =
  | "classic-professional"
  | "modern-minimal"
  | "elegant-academic"
  | "creative-colorful"
  | "premium-achievement";

export interface CertificateDesignConfig {
  template: CertificateTemplate;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_style: "clean" | "gradient" | "pattern" | "dark" | "parchment";
  font_family: "serif" | "sans" | "mono" | "display";
  border_style: "double" | "minimal" | "ornate" | "geometric";
  badge_style: "gold_seal" | "modern_shield" | "minimal_circle" | "ribbon";
  custom_notes?: string;
}

export interface VerifiedCertificate {
  id: string; // e.g. LL-2026-T-8F3A2B or LL-2026-L-4C9D1E
  exchange_id: string;
  type: "teacher" | "learner";
  recipient_id: string;
  recipient_name: string;
  partner_id: string;
  partner_name: string;
  skill: string;
  title: string;
  issue_date: string;
  design_config: CertificateDesignConfig;
  created_at: string;
}
