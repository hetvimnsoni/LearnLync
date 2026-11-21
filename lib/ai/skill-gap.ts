"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAIStructuredOutput } from "./gemini";
import { SkillGapData } from "@/types/ai";
import type { UserProfile } from "@/types/profile";

type SkillGapPeer = Pick<
  UserProfile,
  "id" | "full_name" | "username" | "skills_offered"
>;

/**
 * AI Skill-Gap Analysis
 * Compares user's current self-reported & demonstrated skills against a desired target role,
 * identifies missing skills, prioritizes learning order, and matches real LearnLync teachers.
 */
export async function analyzeSkillGaps(params: {
  targetRole: string;
  goalDescription?: string;
}): Promise<{ analysis: SkillGapData | null; error?: string }> {
  const { targetRole, goalDescription = "" } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch current user's profile skills
    let selfReportedSkills: string[] = [];
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("skills_offered, skills_needed")
        .eq("id", user.id)
        .single();

      if (profile && Array.isArray(profile.skills_offered)) {
        selfReportedSkills = profile.skills_offered;
      }
    }

    // 2. Fetch demonstrated/assessed skills from database
    let demonstratedSkills: string[] = [];
    if (user) {
      const { data: assessments } = await supabase
        .from("skill_assessments")
        .select("skill, verified, score_percentage")
        .eq("user_id", user.id)
        .eq("verified", true);

      if (assessments) {
        demonstratedSkills = (assessments as { skill: string }[]).map(
          (a) => a.skill
        );
      }
    }

    // 3. Fetch registered LearnLync peer teachers
    let peerQuery = supabase
      .from("profiles")
      .select("id, full_name, username, skills_offered");

    if (user) {
      peerQuery = peerQuery.neq("id", user.id);
    }

    const { data: rawPeers } = await peerQuery;
    const peers = (rawPeers || []) as unknown as SkillGapPeer[];
    const peersSummary = peers.map((p) => ({
      id: p.id,
      name: p.full_name || p.username || "Peer",
      username: p.username,
      skills_offered: p.skills_offered || [],
    }));

    // 4. Prompt Gemini to perform skill gap analysis
    const systemPrompt = `You are LearnLync's AI Skill-Gap Specialist.
Analyze the user's current competencies versus the requirements for the target role: "${targetRole}".

CRITICAL HONESTY RULES:
- Distinguish self-reported skills from demonstrated/verified skills.
- Do not assume mastery just because a skill is self-reported.
- Identify missing skills essential for ${targetRole}.
- Assign priority: 'high', 'medium', or 'low'.
- Suggest a recommended learning order.
- Link registered LearnLync teachers who offer those missing skills from [REGISTERED LEARNLYNC TEACHERS].
- Calculate a realistic progress percentage towards the role based on skills acquired.`;

    const prompt = `Target Role / Goal: "${targetRole}"
Additional Goal Details: "${goalDescription}"

User's Self-Reported Skills (from profile):
${JSON.stringify(selfReportedSkills)}

User's Demonstrated / Verified Skills (proven by assessments/exchanges):
${JSON.stringify(demonstratedSkills)}

[REGISTERED LEARNLYNC TEACHERS]:
${JSON.stringify(peersSummary, null, 2)}

Return a JSON object with this exact shape:
{
  "goal": "${goalDescription || targetRole}",
  "target_role": "${targetRole}",
  "missing_skills": [
    {
      "skill": "Skill Name",
      "priority": "high",
      "importance": "Why this skill is crucial for the role",
      "teacher_ids": ["exact id from registered teachers if available"]
    }
  ],
  "learning_order": ["Skill 1", "Skill 2"],
  "progress_percentage": 45
}`;

    const aiResult = await generateAIStructuredOutput<{
      goal: string;
      target_role: string;
      missing_skills: Array<{
        skill: string;
        priority: "high" | "medium" | "low";
        importance: string;
        teacher_ids: string[];
      }>;
      learning_order: string[];
      progress_percentage: number;
    }>({
      prompt,
      systemInstruction: systemPrompt,
      temperature: 0.2,
    });

    const peerMap = new Map<string, SkillGapPeer>(
      peers.map((p) => [p.id, p])
    );

    const formattedMissingSkills = (aiResult.missing_skills || []).map((ms) => ({
      skill: ms.skill,
      priority: ms.priority || "medium",
      importance: ms.importance,
      teachers_available: (ms.teacher_ids || [])
        .map((id) => peerMap.get(id))
        .filter(Boolean)
        .map((p) => ({
          id: p!.id,
          full_name: p!.full_name || p!.username || "Peer",
          username: p!.username || "peer",
        })),
    }));

    const result: SkillGapData = {
      goal: aiResult.goal || targetRole,
      target_role: aiResult.target_role || targetRole,
      current_skills_self_reported: selfReportedSkills,
      current_skills_demonstrated: demonstratedSkills,
      missing_skills: formattedMissingSkills,
      learning_order: aiResult.learning_order || [],
      progress_percentage: Math.min(100, Math.max(0, aiResult.progress_percentage || 20)),
    };

    return { analysis: result };
  } catch (err: any) {
    console.error("analyzeSkillGaps error:", err?.message || err);
    return { analysis: null, error: err?.message || "Failed to analyze skill gaps." };
  }
}
