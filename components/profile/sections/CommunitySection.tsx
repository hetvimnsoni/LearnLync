"use client";

import Link from "next/link";
import { UserProfile } from "@/types/profile";
import { Users, Sparkles, MessageCircle, ArrowLeftRight, Heart, Globe, Shield } from "lucide-react";
import { DEMO_PROFILES } from "@/lib/demo";

interface CommunitySectionProps {
  profile: UserProfile;
  isOwner: boolean;
}

const STUDY_ROOMS = [
  { id: "sr1", name: "Next.js 14 & React 19 Core Guild", members: 42, tag: "Web Architecture" },
  { id: "sr2", name: "PyTorch & Deep Transformers Study", members: 28, tag: "AI/ML" },
  { id: "sr3", name: "Kubernetes & Cloud Native Operators", members: 19, tag: "DevOps" },
  { id: "sr4", name: "Modern Flutter & Native Swift Exchange", members: 15, tag: "Mobile" },
];

export function CommunitySection({ profile, isOwner }: CommunitySectionProps) {
  // Pull peer connections from demo or default peers
  const peerList = Object.values(DEMO_PROFILES).filter((p) => p.id !== profile.id);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Community Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Connections
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">12</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Mutual learning partners</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Followers
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">84</span>
          <span className="text-[10px] text-brand-600 dark:text-brand-400">Following journey</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Following
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">47</span>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Active peers tracked</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Study Rooms
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">4</span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400">Joined communities</span>
        </div>
      </div>

      {/* Verified Learning Partners */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Learning Partners & Connections</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peers you have exchanged skills with or collaborated in study sessions
              </p>
            </div>
          </div>
          <Link
            href="/learners"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition"
          >
            Find New Peers →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {peerList.map((peer) => (
            <div
              key={peer.id}
              className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/40 transition duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={peer.avatar_url || ""}
                  alt={peer.full_name || ""}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{peer.full_name}</h4>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400">@{peer.username}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-1">{peer.profession}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Offers
                </span>
                <div className="flex flex-wrap gap-1">
                  {peer.skills_offered.slice(0, 2).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <Link
                  href={`/profile/${peer.username || peer.id}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent transition"
                >
                  View Profile
                </Link>
                <Link
                  href={`/chat/${peer.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Message</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group Study Rooms */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-xl space-y-5">
        <h3 className="font-bold text-slate-900 dark:text-white text-base">Joined Communities & Group Rooms</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STUDY_ROOMS.map((room) => (
            <div
              key={room.id}
              className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-0.5">
                  {room.tag}
                </span>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{room.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{room.members} active learners</p>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
