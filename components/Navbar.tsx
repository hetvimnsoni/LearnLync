import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPendingIncomingCount } from "@/app/requests/actions";
import { MessageSquare } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 dark:text-white">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="tracking-tight">Learn<span className="text-blue-600">Lync</span></span>
        </Link>

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

