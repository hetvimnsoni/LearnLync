import { GoogleGenAI } from "@google/genai";

/**
 * Server-only Google Gemini AI Client initialization.
 * Automatically handles bounded retries, exponential backoff, and model fallbacks
 * when Google Gemini experiences temporary high-demand spikes (HTTP 503 UNAVAILABLE or 429).
 */

if (typeof window !== "undefined") {
  throw new Error("Security Violation: lib/ai/gemini.ts must only be loaded on the server.");
}

let aiClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

/**
 * Primary and fallback model definitions.
 * Verified against live Google Gemini API endpoints:
 * - gemini-3.5-flash: Fast, high throughput, active production model.
 * - gemini-3.5-flash-lite: Lightweight high-speed fallback.
 * - gemini-2.5-flash-lite: Established fallback tier.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const FALLBACK_GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash-lite",
] as const;

/**
 * Resolves the primary Gemini model name.
 * Allows override via GEMINI_MODEL in .env.local, defaulting to gemini-3.5-flash.
 */
export function getPrimaryGeminiModel(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();
  // If user configured a model that is known to return 503 during spikes,
  // we still attempt it first, but fallback gracefully.
  return envModel || DEFAULT_GEMINI_MODEL;
}

/**
 * Constructs the prioritized list of candidate models for fallback.
 */
function getModelCandidateChain(): string[] {
  const primary = getPrimaryGeminiModel();
  const candidates = [primary, ...FALLBACK_GEMINI_MODELS];
  // Deduplicate preserving order
  return Array.from(new Set(candidates));
}

/**
 * Safely resolves the Gemini API key from server environment variables.
 * Prioritizes GEMINI_API_KEY with standard Google AI SDK aliases.
 */
export function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENAI_API_KEY?.trim() ||
    ""
  );
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in your environment (.env.local). Please configure your Google Gemini API key to enable AI features."
    );
  }

  if (!aiClient || cachedApiKey !== apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
  }

  return aiClient;
}

/**
 * Checks whether an API error is transient and eligible for retry or fallback.
 * Targets HTTP 503 (UNAVAILABLE / high demand), 429 (rate limits / quota spikes), and 5xx errors.
 */
function isTransientGeminiError(err: any): boolean {
  const status = err?.status || err?.code || (err?.error?.code ? Number(err.error.code) : undefined);
  const msg = (err?.message || "").toLowerCase();

  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("temporary") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate_limit") ||
    msg.includes("quota") ||
    msg.includes("fetch failed") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout")
  );
}

/**
 * Executes a Gemini API call with bounded retries and automatic fallback to
 * supported alternative models if the primary model is experiencing high demand (503/429).
 */
async function executeWithRetryAndFallback<T>(
  operation: (ai: GoogleGenAI, modelName: string) => Promise<T>,
  operationName: string = "AI Generation"
): Promise<T> {
  const ai = getGeminiClient();
  const models = getModelCandidateChain();

  let lastError: any = null;
  const maxRetriesPerModel = 2; // Initial attempt + 1 bounded backoff retry

  for (const model of models) {
    for (let attempt = 0; attempt < maxRetriesPerModel; attempt++) {
      try {
        return await operation(ai, model);
      } catch (err: any) {
        lastError = err;
        const isTransient = isTransientGeminiError(err);
        const status = err?.status || err?.code || "unknown";

        console.warn(
          `[Gemini ${operationName}] Model "${model}" attempt ${attempt + 1}/${maxRetriesPerModel} failed (status: ${status}): ${err?.message?.slice(0, 160) || err}`
        );

        // If it's a non-transient model not found or deprecated error (404), immediately try next model
        if (!isTransient) {
          break;
        }

        // Bounded exponential backoff with jitter before retrying the same model
        if (attempt < maxRetriesPerModel - 1) {
          const baseDelay = 900;
          const jitter = Math.floor(Math.random() * 350);
          const delayMs = baseDelay * Math.pow(1.5, attempt) + jitter;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    console.info(
      `[Gemini ${operationName}] Falling back from "${model}" to next candidate model...`
    );
  }

  // If all candidate models and retries were exhausted, provide a clean user-facing error
  console.error(
    `[Gemini ${operationName}] All model candidates failed. Last error:`,
    lastError?.message || lastError
  );

  if (isTransientGeminiError(lastError)) {
    throw new Error(
      "The AI service is currently experiencing high demand across model endpoints. Please wait a few seconds and try again."
    );
  }

  throw new Error(
    `AI generation error: ${lastError?.message || "Failed to generate AI response."}`
  );
}

/**
 * Legacy export for backward compatibility with existing imports.
 */
export const GEMINI_MODEL = DEFAULT_GEMINI_MODEL;

/**
 * Generates structured JSON output from Gemini using response format / JSON parsing.
 * Includes bounded retries, exponential backoff, and model fallbacks.
 */
export async function generateAIStructuredOutput<T>(params: {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
}): Promise<T> {
  const { prompt, systemInstruction, temperature = 0.2 } = params;

  const fullPrompt = `${systemInstruction ? `[SYSTEM INSTRUCTIONS]:\n${systemInstruction}\n\n` : ""}[USER REQUEST]:\n${prompt}\n\nCRITICAL: Reply with VALID RAW JSON ONLY. Do NOT wrap in markdown \`\`\`json or backticks. Return the JSON object directly.`;

  return executeWithRetryAndFallback(async (ai, model) => {
    const response = await ai.models.generateContent({
      model,
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
  }, "Structured Output");
}

/**
 * Generates conversational response with multi-turn chat context.
 * Includes bounded retries, exponential backoff, and model fallbacks.
 */
export async function generateAIChatReply(params: {
  prompt: string;
  systemInstruction: string;
  history?: Array<{ role: "user" | "assistant" | "model"; content: string }>;
  temperature?: number;
}): Promise<string> {
  const { prompt, systemInstruction, history = [], temperature = 0.7 } = params;

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

  return executeWithRetryAndFallback(async (ai, model) => {
    const response = await ai.models.generateContent({
      model,
      contents: contents as any,
      config: {
        systemInstruction,
        temperature,
      },
    });

    return (
      response.text ||
      "I apologize, but I could not formulate a response. Please try asking again."
    );
  }, "Chat Reply");
}
