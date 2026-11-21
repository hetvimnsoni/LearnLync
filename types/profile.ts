export type ProficiencyLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  discord?: string;
  portfolio?: string;
}

export interface AboutDetails {
  introduction?: string;
  background?: string;
  passions?: string;
  hobbies?: string;
  personal_goals?: string;
  career_aspirations?: string;
  motivation?: string;
  looking_for?: string;
}

export interface Interest {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

export interface SkillTeach {
  id: string;
  name: string;
  proficiency: ProficiencyLevel;
  experience: string; // e.g. "2+ years"
  topics: string[];
  teachingPreferences: string[]; // e.g. "1-on-1 Mentorship", "Code Reviews"
}

export interface SkillLearn {
  id: string;
  name: string;
  currentLevel: ProficiencyLevel;
  learningObjectives: string;
  preferredLearningStyle: string; // e.g. "Hands-on projects", "Pair programming"
  progress: number; // 0 - 100
}

export type PortfolioItemType = "project" | "certificate" | "course" | "research";

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
  type: PortfolioItemType;
  completedAt?: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  criteria: string;
  progress?: number;
  maxProgress?: number;
}

export interface LearningGoal {
  id: string;
  title: string;
  skill: string;
  targetDate: string;
  progress: number; // 0 - 100
  status: "in_progress" | "completed";
}

export interface LearningJourney {
  goals: LearningGoal[];
  learning_hours: number;
  streak_days: number;
  mastered_skills: string[];
  upcoming_milestones: string[];
}

export interface Availability {
  days: string[]; // e.g. ["Monday", "Wednesday", "Friday"]
  time_slots: string[]; // e.g. ["Morning (9am-12pm)", "Evening (5pm-9pm)"]
  timezone: string;
  collaboration_format: string[]; // e.g. ["1-on-1", "Group Sessions", "Pair Programming"]
  individual_or_group: string; // "Individual" | "Group" | "Both"
  teaching_style: string;
  languages: string[];
  open_to_exchange: boolean;
}

export interface PartnerReview {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string;
  rating: number; // 1-5
  teaching_quality: number; // 1-5
  communication: number; // 1-5
  collaboration: number; // 1-5
  comment: string;
  created_at: string;
  verified: boolean;
  exchange_skill?: string;
}

export interface PrivacySettings {
  is_public: boolean;
  show_dob: boolean;
  show_email: boolean;
  show_location: boolean;
  show_connections: boolean;
  allow_messages: "everyone" | "connections" | "none";
  allow_exchanges: "everyone" | "connections" | "none";
}

export interface ProfileStatistics {
  skills_exchanged: number;
  people_taught: number;
  skills_learned: number;
  completed_sessions: number;
  learning_hours: number;
  active_collaborations: number;
  learning_streak: number;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_url?: string | null;
  bio: string | null;
  skills_offered: string[];
  skills_needed: string[];
  created_at: string;
  updated_at?: string;

  // Rich Profile Fields
  tagline?: string;
  pronouns?: string;
  date_of_birth?: string;
  location?: string;
  education?: string;
  profession?: string;
  languages?: string[];
  website?: string;
  social_links?: SocialLinks;
  about_details?: AboutDetails;
  interests?: Interest[];
  skills_teach_detailed?: SkillTeach[];
  skills_learn_detailed?: SkillLearn[];
  portfolio_projects?: PortfolioProject[];
  achievements?: AchievementBadge[];
  learning_journey?: LearningJourney;
  availability?: Availability;
  reviews?: PartnerReview[];
  theme?: string;
  privacy_settings?: PrivacySettings;
  is_public?: boolean;
}

export type ProfileTabId =
  | "overview"
  | "personal"
  | "interests"
  | "skills"
  | "portfolio"
  | "achievements"
  | "journey"
  | "community"
  | "availability"
  | "reviews"
  | "statistics"
  | "privacy";
