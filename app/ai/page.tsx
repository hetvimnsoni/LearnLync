import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRoadmaps } from "@/lib/ai/roadmaps";
import { getUserQuizHistory } from "@/lib/ai/quizzes";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { UnifiedAIHub } from "@/components/ai/UnifiedAIHub";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

interface AIPageProps {
  searchParams: {
    tab?: string;
    query?: string;
    goal?: string;
  };
}

export default async function AIPage({ searchParams }: AIPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userSkillsOffered: string[] = [];
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills_offered")
      .eq("id", user.id)
      .single();
    if (profile?.skills_offered) {
      userSkillsOffered = profile.skills_offered;
    }
  }

  // Pre-fetch user's roadmaps and quiz attempts if logged in
  const roadmaps = user ? await getUserRoadmaps() : [];
  const quizAttempts = user ? await getUserQuizHistory() : [];

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <FluidAtmosphere />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80">
                <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
                <span>AI Learning Ecosystem</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              LearnLync AI Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Discover verified peers, solve learning doubts, track roadmaps, generate quizzes, and analyze your skill gaps.
            </p>
          </div>
        </div>

        {/* Client Interactive AI Hub */}
        <UnifiedAIHub
          currentUserId={user?.id || null}
          currentUserSkillsOffered={userSkillsOffered}
          initialRoadmaps={roadmaps}
          initialQuizAttempts={quizAttempts}
          initialTab={searchParams.tab || "chat"}
          initialQuery={searchParams.query || searchParams.goal || ""}
        />
      </div>
    </div>
  );
}
