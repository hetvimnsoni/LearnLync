"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAIStructuredOutput } from "./gemini";
import { PeerProfile } from "@/types/learner";

export interface RecommendedPeerResult {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  skills_offered: string[];
  skills_needed: string[];
  match_reason: string;
  compatibility_score: number;
}

export interface SkillRecommendationResult {
  skill: string;
  reason: string;
  applications: string;
  career_impact: string;
  learning_order: number;
  available_teachers: Array<{
    id: string;
    full_name: string;
    username: string;
    bio: string;
    avatar_url: string | null;
  }>;
}

/**
 * AI-Powered Profile Recommendations
 * Analyzes user search/learning requirements against actual registered LearnLync profiles.
 * Never invents fictional users; strictly ranks existing registered users.
 */
export async function getAIProfileRecommendations(
  userQuery: string
): Promise<{ recommendations: RecommendedPeerResult[]; message?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch real peer profiles from Supabase (excluding current user)
    let query = supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio, skills_offered, skills_needed");

    if (user) {
      query = query.neq("id", user.id);
    }

    const { data: rawProfiles, error: dbError } = await query;

    if (dbError || !rawProfiles || rawProfiles.length === 0) {
      return {
        recommendations: [],
        message: "No other registered learners are currently available in the directory.",
      };
    }

    // 2. Fetch current user's profile if authenticated to check reciprocal skill match
    let currentUserProfile: any = null;
    if (user) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("skills_offered, skills_needed")
        .eq("id", user.id)
        .single();
      currentUserProfile = myProfile;
    }

    const availableProfilesSummary = rawProfiles.map((p) => ({
      id: p.id,
      name: p.full_name || p.username || "Learner",
      username: p.username,
      skills_offered: p.skills_offered || [],
      skills_needed: p.skills_needed || [],
      bio: p.bio || "",
    }));

    // 3. Prompt Gemini to evaluate compatibility strictly against available profiles
    const systemPrompt = `You are LearnLync's Intelligent Profile Recommendation Engine.
LearnLync is a peer-to-peer skill exchange platform where users teach what they know and learn what they want.

CRITICAL RULES:
1. ONLY recommend users from the provided [REGISTERED LEARNLYNC PROFILES] list.
2. NEVER invent names, usernames, skills, or fictional user accounts.
3. If no registered user matches the requirements, return an empty array with a clear explanation in the message.
4. Evaluate skill compatibility: Does this peer offer what the user needs? Do they need what the user offers?
5. Provide a clear, honest match reason for each recommended profile.`;

    const prompt = `User's Learning Request: "${userQuery}"
User's Own Skills Offered: ${JSON.stringify(currentUserProfile?.skills_offered || [])}
User's Own Skills Needed: ${JSON.stringify(currentUserProfile?.skills_needed || [])}

[REGISTERED LEARNLYNC PROFILES]:
${JSON.stringify(availableProfilesSummary, null, 2)}

Evaluate the profiles and return a JSON object with this exact shape:
{
  "matches": [
    {
      "id": "exact profile id from the list",
      "match_reason": "Detailed explanation of why this peer is recommended based on their listed skills and reciprocal compatibility",
      "compatibility_score": 85
    }
  ],
  "summary_message": "A helpful explanation of the search results"
}`;

    const aiResponse = await generateAIStructuredOutput<{
      matches: Array<{ id: string; match_reason: string; compatibility_score: number }>;
      summary_message?: string;
    }>({
      prompt,
      systemInstruction: systemPrompt,
      temperature: 0.1,
    });

    const profileMap = new Map(rawProfiles.map((p) => [p.id, p]));

    const recommendations: RecommendedPeerResult[] = [];

    for (const match of aiResponse.matches || []) {
      const actualProfile = profileMap.get(match.id);
      if (actualProfile) {
        recommendations.push({
          id: actualProfile.id,
          full_name: actualProfile.full_name || "Anonymous Learner",
          username: actualProfile.username || "learner",
          avatar_url: actualProfile.avatar_url || null,
          bio: actualProfile.bio || "",
          skills_offered: actualProfile.skills_offered || [],
          skills_needed: actualProfile.skills_needed || [],
          match_reason: match.match_reason,
          compatibility_score: match.compatibility_score || 75,
        });
      }
    }

    return {
      recommendations,
      message: aiResponse.summary_message,
    };
  } catch (err: any) {
    console.error("getAIProfileRecommendations error:", err?.message || err);
    return {
      recommendations: [],
      error: err?.message || "Failed to generate profile recommendations.",
    };
  }
}

/**
 * AI Course & Skill Recommendations (PEER-ONLY)
 * Strictly recommends registered LearnLync users as teachers.
 * NEVER recommends Coursera, Udemy, YouTube, or external courses.
 */
export async function getAICourseAndSkillRecommendations(
  goal: string,
  userExperienceLevel: string = "beginner"
): Promise<{
  skills: SkillRecommendationResult[];
  explanation: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch all registered LearnLync peers
    let query = supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, bio, skills_offered");

    if (user) {
      query = query.neq("id", user.id);
    }

    const { data: rawProfiles, error: dbError } = await query;
    const profiles = rawProfiles || [];

    const availablePeersSummary = profiles.map((p) => ({
      id: p.id,
      name: p.full_name || p.username || "Learner",
      username: p.username,
      skills_offered: p.skills_offered || [],
    }));

    // 2. Strict Peer-Only Prompt for Gemini
    const systemPrompt = `You are LearnLync's Curriculum & Peer Learning Advisor.
CRITICAL MANDATE:
- All learning opportunities MUST come EXCLUSIVELY from registered LearnLync peers.
- NEVER recommend Coursera, Udemy, edX, YouTube, LinkedIn Learning, or any external courses/websites.
- Identify the essential skills required for the user's goal.
- Order the skills in a logical learning progression (stage 1, 2, 3...).
- For each skill, check the [REGISTERED LEARNLYNC TEACHERS] list to find registered users who offer that skill.
- If NO registered LearnLync user offers that skill, set available_teacher_ids to an empty list [].
- Never invent fictional teachers.`;

    const prompt = `User's Goal: "${goal}"
User's Experience Level: "${userExperienceLevel}"

[REGISTERED LEARNLYNC TEACHERS]:
${JSON.stringify(availablePeersSummary, null, 2)}

Return a JSON object with this exact shape:
{
  "overall_strategy": "Explanation of the learning roadmap and how peer exchanges will help",
  "recommended_skills": [
    {
      "skill": "Skill Name (e.g. Python, React, Docker)",
      "reason": "Why this skill is essential for this goal",
      "applications": "Real-world practical applications",
      "career_impact": "Career and project opportunities unlocked",
      "learning_order": 1,
      "available_teacher_ids": ["exact profile id from the teachers list if they offer this skill"]
    }
  ]
}`;

    const aiResponse = await generateAIStructuredOutput<{
      overall_strategy: string;
      recommended_skills: Array<{
        skill: string;
        reason: string;
        applications: string;
        career_impact: string;
        learning_order: number;
        available_teacher_ids: string[];
      }>;
    }>({
      prompt,
      systemInstruction: systemPrompt,
      temperature: 0.1,
    });

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const skills: SkillRecommendationResult[] = (aiResponse.recommended_skills || []).map((s) => {
      const teachers = (s.available_teacher_ids || [])
        .map((id) => profileMap.get(id))
        .filter(Boolean)
        .map((p) => ({
          id: p!.id,
          full_name: p!.full_name || p!.username || "Learner",
          username: p!.username || "peer",
          bio: p!.bio || "",
          avatar_url: p!.avatar_url || null,
        }));

      return {
        skill: s.skill,
        reason: s.reason,
        applications: s.applications,
        career_impact: s.career_impact,
        learning_order: s.learning_order,
        available_teachers: teachers,
      };
    });

    return {
      skills,
      explanation: aiResponse.overall_strategy || "Here is your tailored peer learning curriculum.",
    };
  } catch (err: any) {
    console.error("getAICourseAndSkillRecommendations error:", err?.message || err);
    return {
      skills: [],
      explanation: "",
      error: err?.message || "Failed to generate skill and course recommendations.",
    };
  }
}
