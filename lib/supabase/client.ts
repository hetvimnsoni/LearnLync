import { createBrowserClient } from "@supabase/ssr";
import { DEMO_PROFILES, getDemoProfile } from "@/lib/demo";

// Safe fallback placeholder values to avoid unhandled runtime crashes when env variables are not yet populated
const FALLBACK_SUPABASE_URL = "https://placeholder-project.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_anon_key";

function getClientDemoCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)learnlync_demo_user=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

let cachedBrowserClient: ReturnType<typeof createBrowserClient> | null = null;
let cachedMockClient: ReturnType<typeof createBrowserClient> | null = null;
let cachedDemoCookie: string | null = null;

export function createClient(): ReturnType<typeof createBrowserClient> {
  const demoCookie = getClientDemoCookie();
  if (demoCookie && DEMO_PROFILES[demoCookie.toLowerCase()]) {
    if (cachedMockClient && cachedDemoCookie === demoCookie) {
      return cachedMockClient;
    }
    const demoProfile = getDemoProfile(demoCookie);
    const demoUser = {
      id: demoProfile.id,
      email: demoProfile.email,
      user_metadata: {
        full_name: demoProfile.full_name,
        avatar_url: demoProfile.avatar_url,
      },
    };

    const mockClient = {
      auth: {
        getUser: async () => ({
          data: { user: demoUser as any },
          error: null,
        }),
        onAuthStateChange: (callback: any) => {
          callback("SIGNED_IN", { user: demoUser });
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signOut: async () => {
          document.cookie =
            "learnlync_demo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          window.location.href = "/login";
          return { error: null };
        },
      },
      from: (table: string) => ({
        select: () => ({
          eq: (col: string, val: string) => ({
            single: async () => ({
              data: table === "profiles" ? getDemoProfile(val) : null,
              error: null,
            }),
          }),
          neq: () => ({
            order: async () => ({
              data: Object.values(DEMO_PROFILES).filter(
                (p) => p.id !== demoProfile.id
              ),
              error: null,
            }),
          }),
        }),
      }),
    };

    cachedDemoCookie = demoCookie;
    cachedMockClient = mockClient as unknown as ReturnType<typeof createBrowserClient>;
    return cachedMockClient;
  }

  if (cachedBrowserClient) {
    return cachedBrowserClient;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_ANON_KEY;

  cachedBrowserClient = createBrowserClient(supabaseUrl, supabaseKey);
  return cachedBrowserClient;
}
