"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LearnLyncLogo } from "@/components/brand/LearnLyncLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut } from "@/app/auth/actions";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

interface TopHeaderProps {
  user: { id: string; email?: string } | null;
  profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  showSidebarToggle?: boolean;
}

export function TopHeader({
  user,
  profile,
  onToggleSidebar,
  isSidebarOpen = false,
  showSidebarToggle = false,
}: TopHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Display user name: strictly default/fallback to "Learner" as required
  const displayName =
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "Learner";

  const displayUsername = profile?.username || "learner";
  const avatarUrl = profile?.avatar_url;
  const avatarInitial = (displayName || "P").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full h-14 min-[375px]:h-16 sm:h-20 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md transition-colors select-none">
      <div className="w-full h-full px-2.5 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* ===================================================================
            LEFT SECTION:
            - Hamburger menu button (☰ when closed, ✕ when open)
            - Official LearnLync logo and wordmark (fluid scaling)
            =================================================================== */}
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
          {showSidebarToggle && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 min-[375px]:p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 shrink-0"
              aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isSidebarOpen}
              title={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200" />
              )}
            </button>
          )}

          {/* Fluid scaling LearnLync Logo */}
          <LearnLyncLogo size="lg" href={user ? "/dashboard" : "/"} />
        </div>

        {/* ===================================================================
            RIGHT SECTION:
            - Light/Dark mode toggle
            - User profile picture
            - User name
            - Profile dropdown
            =================================================================== */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {user ? (
            /* User Profile Section with Dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 sm:gap-3 p-1 sm:px-3.5 sm:py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700/80"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {/* User Profile Picture */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm">
                    {avatarInitial}
                  </div>
                )}

                {/* Logged-in user's name */}
                <span className="hidden sm:inline-block text-xs sm:text-sm font-bold text-slate-900 dark:text-white max-w-[120px] md:max-w-[150px] truncate">
                  {displayName}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu (No Edit Profile option) */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0f1424] border border-slate-200/90 dark:border-slate-800 shadow-xl py-2 z-50 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Info Header */}
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                      @{displayUsername}
                    </p>
                  </div>

                  {/* Dropdown Navigation Actions */}
                  <div className="p-1 space-y-0.5">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                    >
                      <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <span>View Profile</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                    >
                      <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  <div className="p-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out Public Action Links */
            <div className="flex items-center gap-2 sm:gap-4">
              <nav className="hidden md:flex items-center gap-1 sm:gap-2 mr-2">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition"
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

              <div className="flex items-center gap-1.5 min-[375px]:gap-2">
                <Link
                  href="/login"
                  className="px-2.5 min-[375px]:px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-3 min-[375px]:px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-sm transition"
                >
                  <span>Get Started</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
