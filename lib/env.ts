
/**
 * Environment configuration and validation for LearnLync
 * (Supabase Auth, Nexconn Chat SDK and Google Gemini AI)
 */

export const env = {
  // Public client-safe credentials (Nexconn)
  NEXT_PUBLIC_NEXCONN_APP_KEY: process.env.NEXT_PUBLIC_NEXCONN_APP_KEY || "",

  // Private server-only credentials (Nexconn)
  get NEXCONN_APP_SECRET(): string {
    if (typeof window !== "undefined") {
      throw new Error(
        "CRITICAL SECURITY VIOLATION: NEXCONN_APP_SECRET cannot be accessed on the client side!"
      );
    }
    return process.env.NEXCONN_APP_SECRET || "";
  },

  // Nexconn Singapore data center endpoints
  NEXCONN_PRIMARY_API_URL:
    process.env.NEXCONN_API_ENDPOINT || "https://api.sg-light-api.com",
  NEXCONN_BACKUP_API_URL: "https://api-b.sg-light-api.com",

  // Supabase public configuration
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "",

  // Google Gemini AI Configuration (Server-side only)
  get GEMINI_API_KEY(): string {
    if (typeof window !== "undefined") {
      throw new Error(
        "CRITICAL SECURITY VIOLATION: GEMINI_API_KEY cannot be accessed on the client side!"
      );
    }
    return process.env.GEMINI_API_KEY || "";
  },
};

/**
 * Validate presence of required environment variables
 */
export function validateEnv() {
  const isServer = typeof window === "undefined";
  const missing: string[] = [];

  if (!env.NEXT_PUBLIC_NEXCONN_APP_KEY) {
    missing.push("NEXT_PUBLIC_NEXCONN_APP_KEY");
  }

  if (isServer && !process.env.NEXCONN_APP_SECRET) {
    missing.push("NEXCONN_APP_SECRET");
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!env.NEXT_PUBLIC_SUPABASE_KEY) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
