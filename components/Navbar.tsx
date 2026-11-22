import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPendingIncomingCount } from "@/app/requests/actions";
import { LearnLyncLogo } from "@/components/brand/LearnLyncLogo";
import { NavbarLinks } from "./NavbarLinks";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  let pendingCount = 0;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, username, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
    pendingCount = await getPendingIncomingCount();
  }

  return (
    <header className="sticky top-0 z-40 w-full h-14 min-[375px]:h-16 sm:h-20 border-b border-indigo-100/70 dark:border-slate-800 bg-gradient-to-r from-white/90 via-[#F8FAFF]/90 to-[#FAF7FF]/90 dark:from-[#0B0F19]/95 dark:via-[#0B0F19]/95 dark:to-[#0B0F19]/95 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(99,102,241,0.05)] dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Larger Official LearnLync Logo */}
        <LearnLyncLogo size="lg" href="/" />

        {/* Dynamic Navigation Actions with Live Badges */}
        <NavbarLinks
          user={user ? { id: user.id, email: user.email } : null}
          profile={profile}
          initialPendingCount={pendingCount}
        />
      </div>
    </header>
  );
}
