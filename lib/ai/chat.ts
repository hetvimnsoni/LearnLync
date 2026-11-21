"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAIChatReply } from "./gemini";
import { AIChatMessage, AIChatRole } from "@/types/ai";

export interface ChatAssistantResponse {
  message: string;
  conversationId: string;
  suggestedFollowUps: string[];
  error?: string;
}

/**
 * AI Doubt-Solving Assistant & Study Buddy
 * Multi-turn, contextual learning assistant that explains difficult concepts,
 * provides step-by-step guidance, code/practical examples, and adapts to user level.
 */
export async function sendAIChatMessage(params: {
  message: string;
  mode?: "doubt_solver" | "study_buddy";
  conversationId?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  userLevel?: "beginner" | "intermediate" | "advanced";
}): Promise<ChatAssistantResponse> {
  const {
    message,
    mode = "doubt_solver",
    conversationId: existingConversationId,
    history = [],
    userLevel = "intermediate",
  } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch user's profile context if available
    let userContext = "";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, skills_offered, skills_needed")
        .eq("id", user.id)
        .single();

      if (profile) {
        userContext = `Learner Profile:
- Name: ${profile.full_name || "Learner"}
- Skills Offered: ${(profile.skills_offered || []).join(", ")}
- Skills Needed: ${(profile.skills_needed || []).join(", ")}
- Knowledge Level: ${userLevel}`;
      }
    }

    // 2. Formulate specialized System Instructions based on mode
    let systemInstruction = "";
    if (mode === "study_buddy") {
      systemInstruction = `You are the LearnLync AI Study Buddy — an encouraging, friendly, and highly knowledgeable learning companion.
Your mission:
- Help users revise previously learned concepts.
- Challenge them with thought-provoking questions and micro-exercises.
- If they are confused, explain the concept using vivid analogies and real-world examples.
- Encourage them to articulate their understanding in their own words.
- Provide step-by-step explanations suited to a ${userLevel} learner.
- Suggest revision activities or practice projects.
${userContext}`;
    } else {
      systemInstruction = `You are the LearnLync AI Doubt-Solving Assistant — a patient, world-class technical mentor and tutor.
Your mission:
- Answer learning doubts with crystal-clear, accurate, and easy-to-digest explanations.
- Adapt your vocabulary and depth for a ${userLevel} learner.
- Always include practical, real-world examples or code snippets when applicable.
- Break down multi-step or complex problems into simple, digestible milestones.
- If the user is stuck, identify the core misunderstanding and guide them through it.
- Keep the tone encouraging, inspiring, and focused on peer mastery.
${userContext}`;
    }

    // 3. Generate AI response
    const aiText = await generateAIChatReply({
      prompt: message,
      systemInstruction,
      history,
      temperature: 0.7,
    });

    // 4. Extract suggested follow-ups
    const followUps: string[] = [];
    if (mode === "study_buddy") {
      followUps.push("Give me a practice problem on this");
      followUps.push("Can you explain this with a real-world analogy?");
      followUps.push("What is the next topic I should study?");
    } else {
      followUps.push("Can you give a code or practical example?");
      followUps.push("How would you simplify this for a complete beginner?");
      followUps.push("What are the most common mistakes to avoid here?");
    }

    // 5. Persist to database if authenticated and conversation exists/created
    let conversationId = existingConversationId || "";
    if (user) {
      if (!conversationId) {
        const { data: conv } = await supabase
          .from("ai_chat_conversations")
          .insert({
            user_id: user.id,
            title: message.slice(0, 50) || "Learning Session",
          })
          .select("id")
          .single();
        if (conv) conversationId = conv.id;
      }

      if (conversationId) {
        // Save user message
        await supabase.from("ai_chat_messages").insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: "user",
          content: message,
        });

        // Save assistant message
        await supabase.from("ai_chat_messages").insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: "assistant",
          content: aiText,
          metadata: { mode, followUps },
        });
      }
    }

    return {
      message: aiText,
      conversationId,
      suggestedFollowUps: followUps,
    };
  } catch (err: any) {
    console.error("sendAIChatMessage error:", err?.message || err);
    return {
      message: "",
      conversationId: existingConversationId || "",
      suggestedFollowUps: [],
      error: err?.message || "Failed to communicate with AI Assistant.",
    };
  }
}

/**
 * Retrieves existing conversation messages for the user.
 */
export async function getConversationHistory(
  conversationId: string
): Promise<AIChatMessage[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: messages, error } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error || !messages) return [];

    return messages.map((m) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      role: m.role as AIChatRole,
      content: m.content,
      metadata: m.metadata,
      created_at: m.created_at,
    }));
  } catch (err) {
    console.error("getConversationHistory error:", err);
    return [];
  }
}
