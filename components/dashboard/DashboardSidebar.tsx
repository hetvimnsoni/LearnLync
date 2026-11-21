"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotification } from "@/components/providers/NotificationProvider";
import { signOut } from "@/app/auth/actions";
import { LearnLyncLogo } from "@/components/brand/LearnLyncLogo";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  ArrowLeftRight,
  User,
  Settings,
  LogOut,
  X,
} from "lucide-react";

interface DashboardSidebarProps {
  initialPendingCount?: number;
  onNavigate?: () => void;
  onClose?: () => void;
  className?: string;
}

export function DashboardSidebar({
  initialPendingCount = 0,
  onNavigate,
  onClose,
  className = "",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { unreadMessagesCount, pendingRequestsCount } = useNotification();

  const displayPending = pendingRequestsCount ?? initialPendingCount;

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
      badge: null,
    },
    {
      name: "Find Peers",
      href: "/learners",
      icon: Users,
      isActive: pathname === "/learners",
      badge: null,
    },
    {
      name: "Messages",
      href: "/chat",
      icon: MessageSquare,
      isActive: pathname.startsWith("/chat"),
      badge:
        unreadMessagesCount > 0 ? (
          <span
            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold bg-brand-600 text-white animate-pulse"
            title={`${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? "s" : ""}`}
          >
            {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
          </span>
        ) : null,
    },
    {
      name: "Requests",
      href: "/requests",
      icon: ArrowLeftRight,
      isActive: pathname === "/requests",
      badge:
        displayPending > 0 ? (
          <span
            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white animate-pulse"
            title={`${displayPending} pending exchange request${displayPending > 1 ? "s" : ""}`}
          >
            {displayPending > 99 ? "99+" : displayPending}
          </span>
        ) : null,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      isActive: pathname.startsWith("/profile"),
      badge: null,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      isActive: pathname === "/settings",
      badge: null,
    },
  ];

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside
      className={`w-72 sm:w-80 bg-[#0B0F19] text-slate-300 border-r border-slate-800/90 flex flex-col justify-between shrink-0 select-none overflow-y-auto ${className}`}
    >
      <div>
        {/* =====================================================================
            INTERNAL SIDEBAR HEADER WITH BRANDING & CLOSE (X) BUTTON
            ===================================================================== */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <LearnLyncLogo size="md" href="/dashboard" />
          <button
            type="button"
            onClick={onClose || onNavigate}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =====================================================================
            TOP TAGLINE BLOCK: EXACT PLACEMENT ABOVE DASHBOARD NAVIGATION ITEM
            ===================================================================== */}
        <div className="px-5 pt-6 pb-6 text-center border-b border-white/5 space-y-1.5 bg-gradient-to-b from-indigo-950/30 via-slate-900/10 to-transparent">
          {/* Main Tagline: Bold, attractive typography with subtle purple/blue accents */}
          <h2 className="text-[14px] font-extrabold tracking-tight text-white leading-tight">
            <span>Learn Together. </span>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Grow Together.
            </span>
          </h2>

          {/* Secondary Tagline: Slightly smaller, elegant italic typography */}
          <p className="text-[12px] italic tracking-wide text-indigo-300/85 font-medium">
            Exchange. Explore. Evolve.
          </p>
        </div>

        {/* =====================================================================
            7 PRESERVED NAVIGATION ITEMS IN EXACT ORDER
            ===================================================================== */}
        <nav className="p-3.5 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={`group flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  item.isActive
                    ? "bg-gradient-to-r from-brand-600/25 to-purple-600/20 text-white font-semibold border-l-4 border-brand-500 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      item.isActive
                        ? "text-brand-400"
                        : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Item 7: Logout Navigation Item */}
      <div className="p-4 border-t border-white/5">
        <form
          action={signOut}
          onSubmit={() => {
            if (onNavigate) onNavigate();
          }}
        >
          <button
            type="submit"
            className="w-full group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/25 transition-all duration-200 text-left"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-400 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
