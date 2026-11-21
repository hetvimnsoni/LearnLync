
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DEMO_PROFILES, getDemoProfile } from "@/lib/demo";

// Safe fallback placeholder values to avoid unhandled runtime crashes
// when environment variables are not yet populated.
const FALLBACK_SUPABASE_URL = "https://placeholder-project.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key";

export async function createClient(): Promise<ReturnType<typeof createServerClient>> {
  const cookieStore = await cookies();
  const demoCookie = cookieStore.get("learnlync_demo_user")?.value;

  // If in demo mode via demo cookie, return a mock Supabase client.
  if (demoCookie && DEMO_PROFILES[demoCookie.toLowerCase()]) {
    const demoProfile = getDemoProfile(demoCookie);
    const demoUser = {
      id: demoProfile.id,
      email: demoProfile.email,
      user_metadata: {
        full_name: demoProfile.full_name,
        avatar_url: demoProfile.avatar_url,
      },
      app_metadata: {},
      aud: "authenticated",
      created_at: demoProfile.created_at,
    };

    const mockServerClient = {
      auth: {
        getUser: async () => ({
          data: { user: demoUser as any },
          error: null,
        }),
        getSession: async () => ({
          data: {
            session: {
              user: demoUser,
              access_token: "demo_token",
            } as any,
          },
          error: null,
        }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({
          data: { user: demoUser, session: {} },
          error: null,
        }),
        signInWithOAuth: async () => {
          throw new Error("OAuth unavailable in demo mode");
        },
      },
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (col: string, val: any) => ({
            single: async () => {
              if (table === "profiles") {
                const found = getDemoProfile(val);
                return { data: found, error: null };
              }
              return { data: null, error: null };
            },
            eq: async () => ({ count: 0, data: [], error: null }),
          }),
          neq: (col: string, val: any) => ({
            order: async () => {
              if (table === "profiles") {
                const list = Object.values(DEMO_PROFILES).filter(
                  (p) => p.id !== val
                );
                return { data: list, error: null };
              }
              return { data: [], error: null };
            },
          }),
          order: async () => {
            if (table === "profiles") {
              return { data: Object.values(DEMO_PROFILES), error: null };
            }
            return { data: [], error: null };
          },
          or: () => ({
            order: async () => ({ data: [], error: null }),
          }),
          in: (col: string, values: any[]) => {
            if (table === "profiles") {
              const list = Object.values(DEMO_PROFILES).filter((p) =>
                values.includes(p.id)
              );
              return Promise.resolve({ data: list, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
        insert: async (data: any) => ({
          data: { ...data, id: "demo-req-1" },
          error: null,
        }),
        update: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  single: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
        upsert: async () => ({ error: null }),
      }),
    };

    return mockServerClient as unknown as ReturnType<typeof createServerClient>;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_ANON_KEY;

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Safe to ignore in Server Components when middleware refreshes sessions.
        }
      },
    },
  });
}
