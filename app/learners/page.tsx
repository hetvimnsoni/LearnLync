import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getLearnerPeers } from "@/lib/learners";
import { LearnersExplorer } from "@/components/learners/LearnersExplorer";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { Users, ArrowLeft, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearnersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/learners");
  }

  const { peers, currentUserId, error } = await getLearnerPeers();

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("skills_offered")
    .eq("id", user.id)
    .single();

  const mySkills: string[] = Array.isArray(myProfile?.skills_offered)
    ? myProfile.skills_offered
    : [];

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <FluidAtmosphere />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/80 dark:bg-slate-900/80 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80 backdrop-blur-md shadow-sm self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
            <span>Verified Peer Network</span>
          </div>
        </div>

        {/* Explorer Component with Real-time Search and Filtering */}
        <LearnersExplorer
          initialPeers={peers}
          currentUserId={currentUserId}
          currentUserSkillsOffered={mySkills}
          initialError={error}
          title="Explore Learner Peers"
          description="Search for LearnLync peers by skill, review their offered knowledge, and propose reciprocal skill exchanges."
        />
      </div>
    </div>
  );
}
