"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  UserProfile,
  SkillTeach,
  SkillLearn,
  Interest,
  PortfolioProject,
  LearningJourney,
  Availability,
  PrivacySettings,
  PartnerReview,
  ProfileStatistics,
} from "@/types/profile";
import { DEMO_PROFILES, getDemoProfile } from "@/lib/demo";
import { cookies } from "next/headers";

/**
 * Helper to get currently authenticated user (Supabase or Demo)
 */
async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Update general user profile identity and metadata
 */
export async function updateUserProfile(
  updates: Partial<UserProfile>
): Promise<{ success?: string; error?: string }> {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return { error: "Authentication required." };
    }

    const cookieStore = cookies();
    const demoCookie = cookieStore.get("learnlync_demo_user")?.value;

    // Demo Mode in-memory mutation
    if (demoCookie && DEMO_PROFILES[demoCookie.toLowerCase()]) {
      const demo = DEMO_PROFILES[demoCookie.toLowerCase()];
      Object.assign(demo, updates);
      revalidatePath("/profile");
      revalidatePath("/dashboard");
      return { success: "Profile changes saved successfully!" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { success: "Profile saved successfully!" };
  } catch (err: any) {
    return { error: err?.message || "Failed to update profile." };
  }
}

/**
 * Save and synchronize "Skills I Can Teach"
 * Automatically syncs with public.profiles.skills_offered for site-wide search
 */
export async function saveSkillsTeach(
  skills: SkillTeach[]
): Promise<{ success?: string; error?: string }> {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return { error: "Authentication required." };

    const skillsOffered = skills.map((s) => s.name.trim()).filter(Boolean);

    const cookieStore = cookies();
    const demoCookie = cookieStore.get("learnlync_demo_user")?.value;
    if (demoCookie && DEMO_PROFILES[demoCookie.toLowerCase()]) {
      const demo = DEMO_PROFILES[demoCookie.toLowerCase()];
      demo.skills_teach_detailed = skills;
      demo.skills_offered = skillsOffered;
      revalidatePath("/profile");
      revalidatePath("/learners");
      return { success: "Teaching skills updated!" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        skills_teach_detailed: skills,
        skills_offered: skillsOffered,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/profile");
    revalidatePath("/learners");
    return { success: "Teaching skills updated!" };
  } catch (err: any) {
    return { error: err?.message || "Failed to update skills." };
  }
}

/**
 * Save and synchronize "Skills I Want to Learn"
 * Automatically syncs with public.profiles.skills_needed for site-wide match
 */
export async function saveSkillsLearn(
  skills: SkillLearn[]
): Promise<{ success?: string; error?: string }> {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return { error: "Authentication required." };

    const skillsNeeded = skills.map((s) => s.name.trim()).filter(Boolean);

    const cookieStore = cookies();
    const demoCookie = cookieStore.get("learnlync_demo_user")?.value;
    if (demoCookie && DEMO_PROFILES[demoCookie.toLowerCase()]) {
      const demo = DEMO_PROFILES[demoCookie.toLowerCase()];
      demo.skills_learn_detailed = skills;
      demo.skills_needed = skillsNeeded;
      revalidatePath("/profile");
      revalidatePath("/learners");
      return { success: "Learning skills updated!" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        skills_learn_detailed: skills,
        skills_needed: skillsNeeded,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/profile");
    revalidatePath("/learners");
    return { success: "Learning skills updated!" };
  } catch (err: any) {
    return { error: err?.message || "Failed to update skills." };
  }
}

/**
 * Save User Interests
 */
export async function saveInterests(
  interests: Interest[]
): Promise<{ success?: string; error?: string }> {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return { error: "Authentication required." };

    const cookieStore = cookies();
    const demoCookie = cookieStore.get("learnlync_demo_user")?.value;
    if (demoCookie && DEMO_PROFILES[demoCookie.toLowerCase()]) {
      DEMO_PROFILES[demoCookie.toLowerCase()].interests = interests;
      revalidatePath("/profile");
      return { success: "Interests saved!" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        interests,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/profile");
    return { success: "Interests saved!" };
  } catch (err: any) {
    return { error: err?.message || "Failed to save interests." };
  }
}

/**
 * Save Portfolio Projects
 */
export async function savePortfolioProjects(
  projects: PortfolioProject[]
): Promise<{ success?: string; error?: string }> {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return { error: "Authentication required." };

    const cookieStore = cookies();
    const demoCookie = cookieStore.get("learnlync_demo_user")?.value;
    if (demoCookie && DEMO_PROFILES[demoCookie.toLowerCase()]) {
      DEMO_PROFILES[demoCookie.toLowerCase()].portfolio_projects = projects;
      revalidatePath("/profile");
      return { success: "Portfolio updated!" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        portfolio_projects: projects,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/profile");
    return { success: "Portfolio updated!" };
  } catch (err: any) {
    return { error: err?.message || "Failed to save portfolio." };
  }
}

/**
 * Save Learning Journey (goals, hours, milestones)
 */
export async function saveLearningJourney(
  journey: LearningJourney
): Promise<{ success?: string; error?: string }> {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return { error: "Authentication required." };

    const cookieStore = cookies();
    const demoCookie = cookieStore.get("learnlync_demo_user")?.value;
    if (demoCookie && DEMO_PROFILES[demoCookie.toLowerCase()]) {
      DEMO_PROFILES[demoCookie.toLowerCase()].learning_journey = journey;
      revalidatePath("/profile");
      return { success: "Learning journey updated!" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        learning_journey: journey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/profile");
    return { success: "Learning journey updated!" };
  } catch (err: any) {
    return { error: err?.message || "Failed to update journey." };
  }
}

/**
 * Save Availability & Collaboration Preferences
 */
export async function saveAvailability(
  availability: Availability
): Promise<{ success?: string; error?: string }> {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return { error: "Authentication required." };

    const cookieStore = cookies();
    const demoCookie = cookieStore.get("learnlync_demo_user")?.value;
    if (demoCookie && DEMO_PROFILES[demoCookie.toLowerCase()]) {
      DEMO_PROFILES[demoCookie.toLowerCase()].availability = availability;
      revalidatePath("/profile");
      return { success: "Availability settings saved!" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        availability,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/profile");
    return { success: "Availability settings saved!" };
  } catch (err: any) {
    return { error: err?.message || "Failed to save availability." };
  }
}

/**
 * Save Privacy and Profile Settings
 */
export async function savePrivacySettings(
  settings: PrivacySettings
): Promise<{ success?: string; error?: string }> {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return { error: "Authentication required." };

    const cookieStore = cookies();
    const demoCookie = cookieStore.get("learnlync_demo_user")?.value;
    if (demoCookie && DEMO_PROFILES[demoCookie.toLowerCase()]) {
      DEMO_PROFILES[demoCookie.toLowerCase()].privacy_settings = settings;
      DEMO_PROFILES[demoCookie.toLowerCase()].is_public = settings.is_public;
      revalidatePath("/profile");
      return { success: "Privacy settings updated!" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        privacy_settings: settings,
        is_public: settings.is_public,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/profile");
    return { success: "Privacy settings updated!" };
  } catch (err: any) {
    return { error: err?.message || "Failed to save privacy settings." };
  }
}

/**
 * Submit Feedback / Review from a verified peer exchange partner
 */
export async function submitPartnerReview(
  targetUserId: string,
  reviewInput: {
    rating: number;
    teaching_quality: number;
    communication: number;
    collaboration: number;
    comment: string;
    exchange_skill?: string;
  }
): Promise<{ success?: string; error?: string }> {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return { error: "Authentication required." };

    if (user.id === targetUserId) {
      return { error: "You cannot review your own profile." };
    }

    const { data: reviewerProfile } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", user.id)
      .single();

    const newReview: PartnerReview = {
      id: "rev_" + Math.random().toString(36).substring(2, 9),
      reviewer_id: user.id,
      reviewer_name: reviewerProfile?.full_name || reviewerProfile?.username || "Verified Peer",
      reviewer_avatar: reviewerProfile?.avatar_url || "",
      rating: reviewInput.rating,
      teaching_quality: reviewInput.teaching_quality,
      communication: reviewInput.communication,
      collaboration: reviewInput.collaboration,
      comment: reviewInput.comment,
      exchange_skill: reviewInput.exchange_skill || "Skill Exchange",
      verified: true,
      created_at: new Date().toISOString(),
    };

    const cookieStore = cookies();
    const demoCookie = cookieStore.get("learnlync_demo_user")?.value;
    if (demoCookie) {
      const target = getDemoProfile(targetUserId);
      if (target) {
        target.reviews = [newReview, ...(target.reviews || [])];
        revalidatePath("/profile");
        return { success: "Verified review submitted successfully!" };
      }
    }

    // Fetch existing target profile reviews
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("reviews")
      .eq("id", targetUserId)
      .single();

    const currentReviews: PartnerReview[] = targetProfile?.reviews || [];
    const updatedReviews = [newReview, ...currentReviews];

    const { error } = await supabase
      .from("profiles")
      .update({ reviews: updatedReviews })
      .eq("id", targetUserId);

    if (error) return { error: error.message };

    revalidatePath("/profile");
    return { success: "Verified review submitted successfully!" };
  } catch (err: any) {
    return { error: err?.message || "Failed to submit review." };
  }
}

/**
 * Calculate genuine platform statistics directly from user's exchanges and records
 */
export async function getProfileStats(userId: string): Promise<ProfileStatistics> {
  const supabase = await createClient();

  try {
    // 1. Fetch user's profile to inspect learning_journey
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills_offered, skills_needed, learning_journey")
      .eq("id", userId)
      .single();

    // 2. Fetch accepted skill exchanges where user is sender or receiver
    const { data: exchanges } = await supabase
      .from("skill_exchanges")
      .select("id, sender_id, receiver_id, status, skill_offered, skill_wanted")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    interface ExchangeRow {
      id: string;
      sender_id: string;
      receiver_id: string;
      status: string;
      skill_offered: string;
      skill_wanted: string;
    }

    const allExchanges: ExchangeRow[] = (exchanges as any) || [];
    const acceptedExchanges = allExchanges.filter((e: ExchangeRow) => e.status === "accepted");
    const activeExchanges = allExchanges.filter(
      (e: ExchangeRow) => e.status === "pending" || e.status === "accepted"
    );

    // People taught: distinct peers where user offered a skill
    const peopleTaughtSet = new Set<string>();
    acceptedExchanges.forEach((e: ExchangeRow) => {
      if (e.sender_id === userId) peopleTaughtSet.add(e.receiver_id);
    });

    // Skills learned: distinct skills acquired through completed exchanges
    const skillsLearnedSet = new Set<string>();
    acceptedExchanges.forEach((e: ExchangeRow) => {
      if (e.receiver_id === userId) skillsLearnedSet.add(e.skill_offered);
      if (e.sender_id === userId) skillsLearnedSet.add(e.skill_wanted);
    });

    const journey = (profile?.learning_journey as LearningJourney) || {
      goals: [],
      learning_hours: 0,
      streak_days: 1,
      mastered_skills: [],
      upcoming_milestones: [],
    };

    return {
      skills_exchanged: acceptedExchanges.length,
      people_taught: peopleTaughtSet.size,
      skills_learned: skillsLearnedSet.size,
      completed_sessions: acceptedExchanges.length,
      learning_hours: journey.learning_hours || 0,
      active_collaborations: activeExchanges.length,
      learning_streak: journey.streak_days || 1,
    };
  } catch {
    return {
      skills_exchanged: 0,
      people_taught: 0,
      skills_learned: 0,
      completed_sessions: 0,
      learning_hours: 0,
      active_collaborations: 0,
      learning_streak: 1,
    };
  }
}
