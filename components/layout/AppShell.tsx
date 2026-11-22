"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { TopHeader } from "@/components/header/TopHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface AppShellProps {
  user: { id: string; email?: string } | null;
  profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  initialPendingCount: number;
  children: React.ReactNode;
}

export function AppShell({
  user,
  profile,
  initialPendingCount,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  // Default state: Sidebar is closed when dashboard / page loads
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Automatically close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on pressing Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isLandingPage = pathname === "/";

  // Dedicated full-screen authentication experience (Login & Sign Up)
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Check if current view is an authenticated app section
  const isAppSection =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/learners") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/ai") ||
    pathname.startsWith("/certificates") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/meet") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings");

  // Show hamburger toggle for all authenticated app views (desktop and mobile)
  const showSidebarToggle = !isLandingPage && (user !== null || isAppSection);

  return (
    <div className="min-h-screen flex flex-col bg-transparent dark:bg-[var(--background)] text-[var(--foreground)] relative overflow-x-hidden">
      {/* ===================================================================
          1. TOP HEADER
          - LEFT: Hamburger menu button (☰ when closed, ✕ when open) + Larger LearnLync logo
          - RIGHT: Theme toggle, user avatar, "Prachi Patel", and profile dropdown
          =================================================================== */}
      <TopHeader
        user={user}
        profile={profile}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isSidebarOpen={sidebarOpen}
        showSidebarToggle={showSidebarToggle}
      />

      {/* ===================================================================
          2. COLLAPSIBLE SLIDING SIDEBAR OVERLAY & BACKDROP
          =================================================================== */}
      {showSidebarToggle && (
        <>
          {/* Subtle Dark Overlay Backdrop:
              Clicking anywhere outside the sidebar immediately closes it */}
          <div
            className={`fixed inset-0 z-40 bg-black/60 dark:bg-black/75 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
              sidebarOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Smooth Sliding Dark Navy Sidebar Drawer from the LEFT */}
          <div
            className={`fixed top-0 bottom-0 left-0 z-50 w-[min(20rem,85vw)] h-full shadow-2xl transition-transform duration-300 ease-in-out ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full pointer-events-none"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            <DashboardSidebar
              initialPendingCount={initialPendingCount}
              onNavigate={() => setSidebarOpen(false)}
              onClose={() => setSidebarOpen(false)}
              className="h-full w-full"
            />
          </div>
        </>
      )}

      {/* ===================================================================
          3. MAIN CONTENT:
          Expands across 100% of the available screen width when sidebar is closed
          =================================================================== */}
      <main className="w-full flex-1 min-w-0">{children}</main>
    </div>
  );
}
