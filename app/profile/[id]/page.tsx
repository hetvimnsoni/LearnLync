import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { ArrowLeft, Lock } from "lucide-react";
import { ProfileClientView } from "@/components/profile/ProfileClientView";
import { getProfileStats } from "../actions";
import { UserProfile } from "@/types/profile";
import { DEMO_PROFILES, getDemoProfile } from "@/lib/demo";

export const dynamic = "force-dynamic";

interface PeerProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PeerProfilePage({ params }: PeerProfilePageProps) {
  const { id } = await params;
  const targetKey = decodeURIComponent(id);
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Try fetching by UUID or username
  let targetProfile: UserProfile | null = null;

  // 1. Check Demo Profiles
  const demoMatch = getDemoProfile(targetKey);
  if (
    demoMatch &&
    (demoMatch.id === targetKey ||
      demoMatch.username?.toLowerCase() === targetKey.toLowerCase() ||
      demoMatch.email?.toLowerCase() === targetKey.toLowerCase())
  ) {
    targetProfile = demoMatch;
  }

  // 2. Check Supabase DB
  if (!targetProfile) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      targetKey
    );
    const query = supabase.from("profiles").select("*");
    const { data: dbData } = isUuid
      ? await query.eq("id", targetKey).single()
      : await query.eq("username", targetKey).single();

    if (dbData) {
      targetProfile = dbData as UserProfile;
    }
  }

  if (!targetProfile) {
    notFound();
  }

  // If viewer is viewing their own profile via public route, redirect to self profile
  if (currentUser && currentUser.id === targetProfile.id) {
    redirect("/profile");
  }

  // Check Privacy Visibility
  if (targetProfile.is_public === false || targetProfile.privacy_settings?.is_public === false) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors">
        <FluidAtmosphere />
        <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-8 text-center space-y-4 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Private Profile</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This learner has configured their LearnLync profile to private mode. Only approved learning partners can view their details.
          </p>
          <div className="pt-2">
            <Link
              href="/learners"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore Active Peers</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = await getProfileStats(targetProfile.id);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <FluidAtmosphere />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/learners"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition group"
          >
            <ArrowLeft className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Peer Explorer</span>
          </Link>

          <span className="text-xs font-mono text-slate-500 dark:text-slate-500">
            Viewing @{targetProfile.username || "learner"}
          </span>
        </div>

        <ProfileClientView
          initialProfile={targetProfile}
          initialStats={stats}
          isOwner={false}
        />
      </div>
    </div>
  );
}
