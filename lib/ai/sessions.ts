"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateAIStructuredOutput } from "./gemini";
import { SessionPrepData } from "@/types/ai";
import { issueExchangeCertificates } from "./certificates";

/**
 * AI Learning Session Preparation
 * Analyzes the skill exchange participants, skill taught/learned, and generates
 * a tailored agenda, learning objectives, suggested questions, and exercises.
 */
export async function prepareAISession(exchangeId: string): Promise<{
  prep: SessionPrepData | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { prep: null, error: "Authentication required." };
    }

    // 1. Fetch the exchange record
    const { data: exchange, error: exError } = await supabase
      .from("skill_exchanges")
      .select("*")
      .eq("id", exchangeId)
      .single();

    if (exError || !exchange) {
      return { prep: null, error: "Skill exchange not found." };
    }

    // 2. Fetch both profiles
    const { data: sender } = await supabase
      .from("profiles")
      .select("id, full_name, username, bio")
      .eq("id", exchange.sender_id)
      .single();

    const { data: receiver } = await supabase
      .from("profiles")
      .select("id, full_name, username, bio")
      .eq("id", exchange.receiver_id)
      .single();

    const senderName = sender?.full_name || sender?.username || "Learner 1";
    const receiverName = receiver?.full_name || receiver?.username || "Learner 2";

    const systemPrompt = `You are LearnLync's AI Session Coordinator.
Your role is to prepare an engaging, efficient, and well-structured 1-on-1 peer learning session.
Generate:
1. Clear learning objectives for this session.
2. A structured agenda with estimated time chunks (e.g. "10 mins", "20 mins").
3. Thoughtful, practical questions the learner can ask the teacher.
4. Hands-on exercises the participants can complete together.`;

    const prompt = `Skill Being Taught: "${exchange.skill_offered}"
Skill Wanted in Exchange: "${exchange.skill_wanted}"
Exchange Proposal Message: "${exchange.message || "Skill exchange"}"
Participant 1: ${senderName}
Participant 2: ${receiverName}

Generate a session preparation guide in JSON:
{
  "skill": "${exchange.skill_offered}",
  "teacher_name": "${senderName}",
  "learner_name": "${receiverName}",
  "learning_objectives": ["Objective 1", "Objective 2"],
  "agenda": [
    {
      "time_estimate": "10 mins",
      "topic": "Core Fundamentals & Setup",
      "description": "Walkthrough of concepts and environment"
    }
  ],
  "suggested_questions_for_learner": ["Question 1", "Question 2"],
  "hands_on_exercises": ["Exercise 1"]
}`;

    const aiResult = await generateAIStructuredOutput<SessionPrepData>({
      prompt,
      systemInstruction: systemPrompt,
      temperature: 0.3,
    });

    return { prep: aiResult };
  } catch (err: any) {
    console.error("prepareAISession error:", err?.message || err);
    return { prep: null, error: err?.message || "Failed to prepare session plan." };
  }
}

/**
 * Records session completion from a participant.
 * When both sender and receiver confirm completion, marks the exchange status as 'completed'
 * and automatically triggers certificate generation for both teacher and learner!
 */
export async function recordSessionCompletion(params: {
  exchangeId: string;
  topicsCovered: string;
  learnerUnderstanding: string;
  practiceNeeded: string;
  feedback: string;
}): Promise<{
  success: boolean;
  completed: boolean;
  message: string;
  error?: string;
}> {
  const { exchangeId, topicsCovered, learnerUnderstanding, practiceNeeded, feedback } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, completed: false, message: "", error: "Authentication required." };
    }

    const { data: exchange, error: exError } = await supabase
      .from("skill_exchanges")
      .select("*")
      .eq("id", exchangeId)
      .single();

    if (exError || !exchange) {
      return { success: false, completed: false, message: "", error: "Exchange not found." };
    }

    const isSender = exchange.sender_id === user.id;
    const isReceiver = exchange.receiver_id === user.id;

    if (!isSender && !isReceiver) {
      return { success: false, completed: false, message: "", error: "Unauthorized access to this exchange." };
    }

    const existingNotes = exchange.session_notes || {};
    const updatedNotes = {
      ...existingNotes,
      [isSender ? "sender_record" : "receiver_record"]: {
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        topics_covered: topicsCovered,
        learner_understanding: learnerUnderstanding,
        practice_needed: practiceNeeded,
        feedback,
      },
    };

    const isSenderComplete = isSender ? true : exchange.completed_by_sender;
    const isReceiverComplete = isReceiver ? true : exchange.completed_by_receiver;
    const bothComplete = isSenderComplete && isReceiverComplete;

    const updatePayload: any = {
      completed_by_sender: isSenderComplete,
      completed_by_receiver: isReceiverComplete,
      session_notes: updatedNotes,
    };

    if (bothComplete) {
      updatePayload.status = "completed";
      updatePayload.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("skill_exchanges")
      .update(updatePayload)
      .eq("id", exchangeId);

    if (updateError) {
      return { success: false, completed: false, message: "", error: updateError.message };
    }

    // If both completed, issue certificates for both participants!
    if (bothComplete) {
      await issueExchangeCertificates(exchangeId);
    }

    revalidatePath("/requests");
    revalidatePath("/dashboard");
    revalidatePath("/certificates");

    return {
      success: true,
      completed: bothComplete,
      message: bothComplete
        ? "Exchange successfully verified as completed by both learners! Your certificates have been generated."
        : "Your session completion record has been saved. Waiting for your peer's confirmation to finalize and issue certificates.",
    };
  } catch (err: any) {
    console.error("recordSessionCompletion error:", err?.message || err);
    return { success: false, completed: false, message: "", error: err?.message };
  }
}
