"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isPlaceholderSupabase } from "@/lib/demo";

export type AuthState = {
  error?: string;
  success?: string;
};

/**
 * Sign In instantly as a Demo Learner (Elena or Marcus)
 */
export async function signInAsDemoUser(demoId: "elena" | "marcus" = "elena"): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set("learnlync_demo_user", demoId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Sign In with Email and Password
 */
export async function signIn(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = (formData.get("email") as string) || "";
  const password = (formData.get("password") as string) || "";
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard";

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  // Handle placeholder mode defensively:
  if (isPlaceholderSupabase()) {
    if (email.toLowerCase().includes("elena")) {
      await signInAsDemoUser("elena");
      return {};
    }
    if (email.toLowerCase().includes("marcus")) {
      await signInAsDemoUser("marcus");
      return {};
    }
    return {
      error:
        "Supabase is not connected yet (using placeholder-project). Click 'Continue as Demo Learner' above to test immediately, or add your real Supabase URL to .env.local.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

/**
 * Sign Up with Email, Password, and Full Name
 */
export async function signUp(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = (formData.get("email") as string) || "";
  const password = (formData.get("password") as string) || "";
  const fullName = (formData.get("fullName") as string) || "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (isPlaceholderSupabase()) {
    return {
      error:
        "Supabase is not connected yet (using placeholder-project). Click 'Continue as Demo Learner' to test immediately, or add your real Supabase URL to .env.local.",
    };
  }

  const supabase = await createClient();
  const headersList = headers();
  const origin = headersList.get("origin") || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split("@")[0],
      },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Check if email confirmation is required by the Supabase project
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  } else {
    return {
      success:
        "Registration successful! Please check your email inbox to confirm your account before logging in (or disable 'Confirm email' in Supabase Auth settings for instant testing).",
    };
  }
}

/**
 * Sign Out
 */
export async function signOut() {
  const cookieStore = cookies();
  cookieStore.delete("learnlync_demo_user");

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore signout errors in demo mode
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Initiate Google OAuth Sign In
 */
export async function getGoogleOAuthUrl(redirectTo?: string) {
  if (isPlaceholderSupabase()) {
    throw new Error(
      "Google Sign-In requires a live Supabase project. Please update NEXT_PUBLIC_SUPABASE_URL in .env.local with your real project URL, or click 'Continue as Demo Learner' below."
    );
  }

  const supabase = await createClient();
  const headersList = headers();
  const origin = headersList.get("origin") || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo || "/dashboard")}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.url;
}

/**
 * Update User Profile
 */
export async function updateProfile(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized. Please log in again." };
  }

  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const bio = formData.get("bio") as string;
  const skillsOfferedStr = formData.get("skillsOffered") as string;
  const skillsNeededStr = formData.get("skillsNeeded") as string;

  const skillsOffered = skillsOfferedStr
    ? skillsOfferedStr.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const skillsNeeded = skillsNeededStr
    ? skillsNeededStr.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      username: username || undefined,
      bio,
      skills_offered: skillsOffered,
      skills_needed: skillsNeeded,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: "Profile updated successfully!" };
}
