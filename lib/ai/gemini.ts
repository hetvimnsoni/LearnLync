import { GoogleGenAI } from "@google/genai";

/**
 * Server-only Google Gemini AI Client initialization.
 * Uses official @google/genai SDK with modern gemini-3.8-flash model.
 */

if (typeof window !== "undefined") {
  throw new Error("Security Violation: lib/ai/gemini.ts must only be loaded on the server.");
}

const apiKey = process.env.GEMINI_API_KEY || "";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in your environment (.env.local). Please configure your Google Gemini API key to enable AI features."
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export const GEMINI_MODEL = "gemini-3.8-flash";

/**
 * Generates structured JSON output from Gemini using response format / JSON parsing.
 */
export async function generateAIStructuredOutput<T>(params: {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
}): Promise<T> {
  const { prompt, systemInstruction, temperature = 0.2 } = params;
  const ai = getGeminiClient();

  try {
    const fullPrompt = `${systemInstruction ? `[SYSTEM INSTRUCTIONS]:\n${systemInstruction}\n\n` : ""}[USER REQUEST]:\n${prompt}\n\nCRITICAL: Reply with VALID RAW JSON ONLY. Do NOT wrap in markdown \`\`\`json or backticks. Return the JSON object directly.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: fullPrompt,
      config: {
        temperature,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    // Clean potential markdown backticks defensively
    const cleanedText = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    return JSON.parse(cleanedText) as T;
  } catch (err: any) {
    console.error("Gemini Structured Output Error:", err?.message || err);
    throw new Error(
      `AI generation error: ${err?.message || "Failed to generate structured AI response"}`
    );
  }
}

/**
 * Generates conversational response with multi-turn chat context.
 */
export async function generateAIChatReply(params: {
  prompt: string;
  systemInstruction: string;
  history?: Array<{ role: "user" | "assistant" | "model"; content: string }>;
  temperature?: number;
}): Promise<string> {
  const { prompt, systemInstruction, history = [], temperature = 0.7 } = params;
  const ai = getGeminiClient();

  try {
    // Format conversation history for Gemini API
    const formattedHistory = history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    }));

    const contents = [
      ...formattedHistory,
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents as any,
      config: {
        systemInstruction: systemInstruction,
        temperature,
      },
    });

    return response.text || "I apologize, but I could not formulate a response. Please try asking again.";
  } catch (err: any) {
    console.error("Gemini Chat Error:", err?.message || err);
    throw new Error(`AI Chat error: ${err?.message || "Failed to generate response"}`);
  }
}
