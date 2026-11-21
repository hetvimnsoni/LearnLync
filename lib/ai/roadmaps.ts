"use server";
import type { UserProfile } from "@/types/profile";
import { createClient } from "@/lib/supabase/server";
import { generateAIStructuredOutput } from "./gemini";
import { RoadmapData, RoadmapMilestone } from "@/types/ai";



type RoadmapPeer = Pick<
  UserProfile,
  "id" | "full_name" | "username" | "skills_offered"
>;

/**
 * Generates an AI Learning Roadmap broken into structured stages,
 * with milestones and links to real registered LearnLync teachers.
 */
export async function generateAILearningRoadmap(params: {
  goal: string;
  currentLevel?: "beginner" | "intermediate" | "advanced";
}): Promise<{ roadmap: RoadmapData | null; error?: string }> {
  const { goal, currentLevel = "beginner" } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch available registered LearnLync peers
    let peerQuery = supabase
      .from("profiles")
      .select("id, full_name, username, skills_offered");

    if (user) {
      peerQuery = peerQuery.neq("id", user.id);
    }

    const { data: rawPeers } = await peerQuery;
    const peers = (rawPeers || []) as unknown as RoadmapPeer[];

    const peersSummary = peers.map((p) => ({
      id: p.id,
      name: p.full_name || p.username || "Peer",
      username: p.username,
      skills_offered: p.skills_offered || [],
    }));

    // 2. Instruct Gemini to generate ordered stages and link registered peers
    const systemPrompt = `You are LearnLync's Master Curriculum & Roadmap Architect.
Design a step-by-step learning journey for the user's goal.
CRITICAL RULES:
1. Divide the learning path into 3 to 5 progressive stages.
2. Order them logically from foundational concepts to advanced production skills.
3. For each stage, link registered LearnLync peers who offer those skills from [REGISTERED LEARNLYNC TEACHERS].
4. If no registered peer teaches a specific skill in that stage, provide an empty list [] for suggested_peer_ids. Never invent fictional accounts.`;

    const prompt = `Goal: "${goal}"
Current Experience Level: "${currentLevel}"

[REGISTERED LEARNLYNC TEACHERS]:
${JSON.stringify(peersSummary, null, 2)}

Output a JSON object matching this exact shape:
{
  "title": "Short Descriptive Title (e.g., Full-Stack Web Development Roadmap)",
  "goal": "${goal}",
  "current_level": "${currentLevel}",
  "stages": [
    {
      "id": "stage-1",
      "title": "Stage 1: Title",
      "description": "What the learner will master in this phase",
      "skills_to_learn": ["Skill A", "Skill B"],
      "learning_order": 1,
      "suggested_peer_ids": ["exact id from registered teachers if available"]
    }
  ]
}`;

    const aiResult = await generateAIStructuredOutput<{
      title: string;
      goal: string;
      current_level: "beginner" | "intermediate" | "advanced";
      stages: Array<{
        id: string;
        title: string;
        description: string;
        skills_to_learn: string[];
        learning_order: number;
        suggested_peer_ids: string[];
      }>;
    }>({
      prompt,
      systemInstruction: systemPrompt,
      temperature: 0.2,
    });

    const peerMap = new Map<string, RoadmapPeer>(
      peers.map((p) => [p.id, p])
    );

    const formattedStages: RoadmapMilestone[] = (aiResult.stages || []).map((s, idx) => ({
      id: s.id || `stage-${idx + 1}`,
      title: s.title,
      description: s.description,
      skills_to_learn: s.skills_to_learn || [],
      learning_order: s.learning_order || idx + 1,
      status: idx === 0 ? "in_progress" : "pending",
      suggested_peers: (s.suggested_peer_ids || [])
        .map((id) => peerMap.get(id))
        .filter(Boolean)
        .map((p) => ({
          id: p!.id,
          full_name: p!.full_name || p!.username || "Peer",
          username: p!.username || "peer",
          skills_offered: p!.skills_offered || [],
        })),
    }));

    const roadmapData: RoadmapData = {
      title: aiResult.title || `${goal} Roadmap`,
      goal,
      current_level: currentLevel,
      stages: formattedStages,
      progress_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to database if user is logged in
    if (user) {
      const { data: dbRoadmap } = await supabase
        .from("learning_roadmaps")
        .insert({
          user_id: user.id,
          title: roadmapData.title,
          goal: roadmapData.goal,
          current_level: roadmapData.current_level,
          stages: roadmapData.stages,
          progress_percentage: 0,
        })
        .select("id")
        .single();

      if (dbRoadmap) roadmapData.id = dbRoadmap.id;
    }

    return { roadmap: roadmapData };
  } catch (err: any) {
    console.error("generateAILearningRoadmap error:", err?.message || err);
    return { roadmap: null, error: err?.message || "Failed to generate learning roadmap." };
  }
}

/**
 * Updates stage completion status and calculates overall progress percentage.
 */
export async function updateRoadmapStage(params: {
  roadmapId: string;
  stageId: string;
  newStatus: "pending" | "in_progress" | "completed";
}): Promise<{ success: boolean; progressPercentage: number; error?: string }> {
  const { roadmapId, stageId, newStatus } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, progressPercentage: 0, error: "Authentication required." };
    }

    const { data: roadmap, error: fetchError } = await supabase
      .from("learning_roadmaps")
      .select("*")
      .eq("id", roadmapId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !roadmap) {
      return { success: false, progressPercentage: 0, error: "Roadmap not found." };
    }

    const stages: RoadmapMilestone[] = roadmap.stages || [];
    let completedCount = 0;

    const updatedStages = stages.map((st) => {
      if (st.id === stageId) {
        st.status = newStatus;
      }
      if (st.status === "completed") {
        completedCount++;
      }
      return st;
    });

    const progressPercentage = Math.round((completedCount / updatedStages.length) * 100);

    const { error: updateError } = await supabase
      .from("learning_roadmaps")
      .update({
        stages: updatedStages,
        progress_percentage: progressPercentage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roadmapId)
      .eq("user_id", user.id);

    if (updateError) {
      return { success: false, progressPercentage: 0, error: updateError.message };
    }

    return { success: true, progressPercentage };
  } catch (err: any) {
    console.error("updateRoadmapStage error:", err?.message || err);
    return { success: false, progressPercentage: 0, error: err?.message };
  }
}

/**
 * Fetches user's saved learning roadmaps.
 */
export async function getUserRoadmaps(): Promise<RoadmapData[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: roadmaps } = await supabase
      .from("learning_roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    return ((roadmaps || []) as RoadmapData[]).map((r) => ({
      id: r.id,
      title: r.title,
      goal: r.goal,
      current_level: r.current_level,
      stages: r.stages || [],
      progress_percentage: r.progress_percentage || 0,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  } catch (err) {
    console.error("getUserRoadmaps error:", err);
    return [];
  }
}
