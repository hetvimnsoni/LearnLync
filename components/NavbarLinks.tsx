"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotification } from "@/components/providers/NotificationProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ArrowLeftRight,
  LogOut,
  Sparkles,
  Compass,
  Award,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";

interface NavbarLinksProps {
  user: { id: string; email?: string } | null;
  profile: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
  initialPendingCount: number;
}

export function NavbarLinks({ user, profile, initialPendingCount }: NavbarLinksProps) {
  const pathname = usePathname();
  const { unreadMessagesCount, pendingRequestsCount } = useNotification();

  const displayPending = pendingRequestsCount ?? initialPendingCount;

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Public Landing Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 mr-2">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
              pathname === "/"
                ? "text-brand-600 dark:text-brand-400 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
            }`}
          >
            Home
          </Link>
          <Link
            href="/#how-it-works"
            className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition"
          >
            How It Works
          </Link>
          <Link
            href="/#skills"
            className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition"
          >
            Explore Skills
          </Link>
        </nav>

        {/* Light/Dark Mode Toggle */}
        <ThemeToggle />

        {/* Auth Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-sm shadow-brand-500/25 transition-all hover:scale-105 active:scale-95"
          >
            <span>Get Started</span>
          </Link>
        </div>
      </div>
    );
  }

  const avatarInitial = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      {/* Dashboard */}
      <Link
        href="/dashboard"
        className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
          pathname === "/dashboard"
            ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <LayoutDashboard className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        <span>Dashboard</span>
      </Link>

      {/* Find Peers */}
      <Link
        href="/learners"
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
          pathname === "/learners"
            ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <Users className="w-4 h-4 text-indigo-500" />
        <span className="hidden sm:inline">Find Peers</span>
        <span className="sm:hidden">Peers</span>
      </Link>

      {/* Messages / Chat Navigation Item with Unread Badge */}
      <Link
        href="/chat"
        className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
          pathname.startsWith("/chat")
            ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        title="Direct messages"
      >
        <MessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        <span className="hidden sm:inline">Messages</span>
        {unreadMessagesCount > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-brand-600 text-white animate-pulse"
            title={`${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? "s" : ""}`}
          >
            {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
          </span>
        )}
      </Link>

      {/* Requests Navigation Item with Incoming Pending Count Badge */}
      <Link
        href="/requests"
        className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
          pathname === "/requests"
            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        title="Skill exchange requests"
      >
        <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span className="hidden sm:inline">Requests</span>
        {displayPending > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white animate-pulse"
            title={`${displayPending} pending exchange request${displayPending > 1 ? "s" : ""}`}
          >
            {displayPending > 99 ? "99+" : displayPending}
          </span>
        )}
      </Link>

      {/* AI Assistant Navigation Link */}
      <Link
        href="/ai"
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
          pathname.startsWith("/ai")
            ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold ring-1 ring-brand-500/20"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        title="AI Learning Assistant"
      >
        <Sparkles className="w-4 h-4 text-accent-amber animate-pulse" />
        <span className="hidden sm:inline font-bold bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-300 bg-clip-text text-transparent">
          AI Hub
        </span>
        <span className="sm:hidden font-bold text-brand-600 dark:text-brand-400">AI</span>
      </Link>

      {/* Certificates Navigation Link */}
      <Link
        href="/certificates"
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition ${
          pathname.startsWith("/certificates")
            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
        title="Verified Certificates of Progress"
      >
        <Award className="w-4 h-4 text-amber-500" />
        <span className="hidden md:inline">Certificates</span>
      </Link>

      {/* Light/Dark Mode Toggle */}
      <ThemeToggle />

      {/* Profile Avatar */}
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || "Profile"}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
          />
        ) : (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-coral text-white flex items-center justify-center text-xs font-bold shadow-2xs">
            {avatarInitial}
          </div>
        )}
        <span className="hidden lg:inline max-w-[100px] truncate text-xs font-medium text-slate-700 dark:text-slate-200">
          {profile?.full_name || user.email?.split("@")[0]}
        </span>
      </Link>

      {/* Sign Out */}
      <form action={signOut}>
        <button
          type="submit"
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
