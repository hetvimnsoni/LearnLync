"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAIStructuredOutput } from "./gemini";
import { QuizData, QuizQuestion, QuizAttempt } from "@/types/ai";
type QuizAttemptRow = Pick<
  QuizAttempt,
  | "id"
  | "quiz_id"
  | "user_id"
  | "score"
  | "total_questions"
  | "user_answers"
  | "weak_topics"
  | "revision_suggestions"
  | "completed_at"
>;

/**
 * Generates an AI-powered quiz tailored to a topic and difficulty level.
 * Supports Multiple Choice, True/False, and Short Answer questions.
 */
export async function generateAIQuiz(params: {
  topic: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  questionCount?: number;
}): Promise<{ quiz: QuizData | null; error?: string }> {
  const { topic, difficulty = "intermediate", questionCount = 5 } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const systemPrompt = `You are LearnLync's AI Quiz Master.
Your goal is to test learners on peer-exchanged skills with fair, high-yield, and educational questions.
Question types to include:
- 'multiple_choice' (4 distinct options A, B, C, D)
- 'true_false' (options: ["True", "False"])
- 'short_answer' (concise 1-4 word expected answer with clear keywords)

Always provide:
1. 'question': Clear question prompt.
2. 'type': 'multiple_choice' | 'true_false' | 'short_answer'
3. 'options': Array of option strings (for multiple_choice and true_false). Omit or empty for short_answer.
4. 'correct_answer': The exact correct answer string.
5. 'explanation': Detailed breakdown explaining why this answer is correct and common pitfalls.
6. 'topic': Subtopic tag within "${topic}".`;

    const prompt = `Topic: "${topic}"
Difficulty Level: "${difficulty}"
Number of Questions: ${questionCount}

Generate a comprehensive quiz in JSON matching this exact structure:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "What is...",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Option 1",
      "explanation": "Because...",
      "topic": "Fundamentals"
    }
  ]
}`;

    const aiResult = await generateAIStructuredOutput<QuizData>({
      prompt,
      systemInstruction: systemPrompt,
      temperature: 0.2,
    });

    if (!aiResult.questions || aiResult.questions.length === 0) {
      return { quiz: null, error: "AI could not generate questions for this topic." };
    }

    // Save quiz to Supabase if user is logged in
    let savedQuizId: string | undefined = undefined;
    if (user) {
      const { data: dbQuiz } = await supabase
        .from("quizzes")
        .insert({
          user_id: user.id,
          topic: aiResult.topic || topic,
          difficulty: aiResult.difficulty || difficulty,
          questions: aiResult.questions,
        })
        .select("id")
        .single();

      if (dbQuiz) savedQuizId = dbQuiz.id;
    }

    return {
      quiz: {
        ...aiResult,
        id: savedQuizId,
      },
    };
  } catch (err: any) {
    console.error("generateAIQuiz error:", err?.message || err);
    return { quiz: null, error: err?.message || "Failed to generate quiz." };
  }
}

/**
 * Automatically evaluates a completed quiz attempt, scores it,
 * identifies weak topics, generates revision suggestions,
 * and records verified skill assessments if mastered.
 */
export async function submitQuizAttempt(params: {
  quizId?: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
  userAnswers: Record<string, string>;
}): Promise<{ attempt: QuizAttempt | null; error?: string }> {
  const { quizId, topic, difficulty, questions, userAnswers } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let score = 0;
    const weakTopicsSet = new Set<string>();

    // Evaluate answers
    for (const q of questions) {
      const userAnswer = (userAnswers[q.id] || "").trim().toLowerCase();
      const correctAnswer = (q.correct_answer || "").trim().toLowerCase();

      let isCorrect = false;
      if (q.type === "multiple_choice" || q.type === "true_false") {
        isCorrect = userAnswer === correctAnswer;
      } else {
        // Short answer lenient comparison
        isCorrect =
          userAnswer === correctAnswer ||
          userAnswer.includes(correctAnswer) ||
          correctAnswer.includes(userAnswer);
      }

      if (isCorrect) {
        score += 1;
      } else {
        weakTopicsSet.add(q.topic || topic);
      }
    }

    const weakTopics = Array.from(weakTopicsSet);
    const scorePercentage = Math.round((score / questions.length) * 100);

    // Generate revision suggestions
    let revisionSuggestions: string[] = [];
    if (weakTopics.length > 0) {
      revisionSuggestions = [
        `Review the core principles of ${weakTopics.slice(0, 2).join(" and ")}.`,
        `Ask the AI Study Buddy to explain ${weakTopics[0] || topic} with practical analogies.`,
        `Practice building a mini project applying ${topic} concepts.`,
      ];
    } else {
      revisionSuggestions = [
        `Outstanding! You achieved a perfect score in ${topic}.`,
        `Consider finding a peer in LearnLync to teach these ${topic} concepts to reinforce your mastery.`,
      ];
    }

    const attemptResult: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      quiz_id: quizId || "adhoc_quiz",
      user_id: user?.id || "guest",
      score,
      total_questions: questions.length,
      user_answers: userAnswers,
      weak_topics: weakTopics,
      revision_suggestions: revisionSuggestions,
      completed_at: new Date().toISOString(),
    };

    // Save attempt and update skill assessment in database if authenticated
    if (user && quizId) {
      const { data: dbAttempt } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          score,
          total_questions: questions.length,
          user_answers: userAnswers,
          weak_topics: weakTopics,
          revision_suggestions: revisionSuggestions,
        })
        .select("id")
        .single();

      if (dbAttempt) attemptResult.id = dbAttempt.id;

      // Update skill assessment: record demonstrated proficiency
      const isVerified = scorePercentage >= 70;
      const proficiency =
        scorePercentage >= 90
          ? "advanced"
          : scorePercentage >= 70
            ? "intermediate"
            : "beginner";

      await supabase.from("skill_assessments").upsert(
        {
          user_id: user.id,
          skill: topic,
          source: "quiz",
          proficiency_level: proficiency,
          verified: isVerified,
          score_percentage: scorePercentage,
          last_assessed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,skill,source" }
      );
    }

    return { attempt: attemptResult };
  } catch (err: any) {
    console.error("submitQuizAttempt error:", err?.message || err);
    return { attempt: null, error: err?.message || "Failed to evaluate quiz attempt." };
  }
}

/**
 * Retrieves past quiz attempts for the authenticated user.
 */
export async function getUserQuizHistory(): Promise<QuizAttempt[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(20);

    return ((attempts || []) as QuizAttemptRow[]).map((a) => ({
      id: a.id,
      quiz_id: a.quiz_id,
      user_id: a.user_id,
      score: a.score,
      total_questions: a.total_questions,
      user_answers: a.user_answers || {},
      weak_topics: a.weak_topics || [],
      revision_suggestions: a.revision_suggestions || [],
      completed_at: a.completed_at,
    }));
  } catch (err) {
    console.error("getUserQuizHistory error:", err);
    return [];
  }
}
