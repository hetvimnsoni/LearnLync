import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { ArrowLeft } from "lucide-react";
import { ProfileClientView } from "@/components/profile/ProfileClientView";
import { getProfileStats } from "./actions";
import { UserProfile } from "@/types/profile";
import { getDemoProfile } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  // Fetch profile record and profile stats in parallel
  const [{ data: dbProfile }, stats] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    getProfileStats(user.id),
  ]);

  // If in demo mode or db profile fallback
  const demoFallback = getDemoProfile(user.id);
  const profile: UserProfile = {
    ...demoFallback,
    ...(dbProfile || {}),
    id: user.id,
    email: user.email || demoFallback.email,
    full_name: dbProfile?.full_name || demoFallback.full_name || "LearnLync Learner",
    username: dbProfile?.username || demoFallback.username || "learner",
    avatar_url: dbProfile?.avatar_url || demoFallback.avatar_url,
    bio: dbProfile?.bio || demoFallback.bio,
    skills_offered: dbProfile?.skills_offered || demoFallback.skills_offered || [],
    skills_needed: dbProfile?.skills_needed || demoFallback.skills_needed || [],
    created_at: dbProfile?.created_at || demoFallback.created_at || new Date().toISOString(),
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <FluidAtmosphere />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>

          <span className="text-xs font-mono text-slate-500 dark:text-slate-500">
            LearnLync Digital Identity • ID: {profile.id.slice(0, 8)}...
          </span>
        </div>

        {/* Full Rich Profile Experience */}
        <ProfileClientView
          initialProfile={profile}
          initialStats={stats}
          isOwner={true}
        />
      </div>
    </div>
  );
}
