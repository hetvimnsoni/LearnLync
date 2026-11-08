import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import { User, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <FluidAtmosphere />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-10 shadow-2xl">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-brand-500/20">
              {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Edit Your Profile
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your personal info and LearnLync exchange skills
              </p>
            </div>
          </div>

          <ProfileForm user={user} profile={profile} />
        </div>
      </div>
    </div>
  );
}
