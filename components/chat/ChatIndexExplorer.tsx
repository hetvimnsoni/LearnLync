"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Users, Sparkles, ArrowRight, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { PeerProfile } from "@/types/learner";
import { useNexconn } from "@/components/providers/NexconnProvider";
import { fetchUnreadChannelsMap } from "@/lib/nexconn/chat";
import { toNexconnUserId } from "@/lib/nexconn/identity";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";

interface ChatIndexExplorerProps {
  currentUserId: string;
  peers: PeerProfile[];
}

export function ChatIndexExplorer({ currentUserId, peers }: ChatIndexExplorerProps) {
  const { isConnected } = useNexconn();
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isConnected) {
      fetchUnreadChannelsMap().then((map) => {
        setUnreadMap(map);
      });
    }
  }, [isConnected]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <FluidAtmosphere />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Messages
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/80 dark:bg-slate-900/80 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80 backdrop-blur-md shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
                <span>Nexconn Real-Time Active</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Direct real-time peer messaging with your accepted skill exchange partners.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/requests"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-sm"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Requests</span>
            </Link>
            <Link
              href="/learners"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:from-brand-500 hover:to-indigo-500 transition shadow-md shadow-brand-500/20"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Discover Peers</span>
            </Link>
          </div>
        </div>

        {/* Conversations List */}
        {peers.length === 0 ? (
          <div className="p-10 sm:p-14 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No active conversations yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exchange skill requests with peers or browse the learner directory to start a direct chat.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/learners"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 transition shadow-md shadow-brand-500/20"
              >
                <Users className="w-4 h-4" />
                <span>Explore Peers</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {peers.map((peer) => {
              const peerNexconnId = toNexconnUserId(peer.id);
              const unreadCount = unreadMap[peerNexconnId] || 0;
              const peerInitial = (peer.full_name || peer.username || "P").charAt(0).toUpperCase();

              return (
                <Link
                  key={peer.id}
                  href={`/chat/${peer.id}`}
                  className="group flex items-center justify-between p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-brand-500/60 dark:hover:border-brand-500/60 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {peer.avatar_url ? (
                        <img
                          src={peer.avatar_url}
                          alt={peer.full_name || "Peer avatar"}
                          className="w-13 h-13 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                          {peerInitial}
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Peer Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                          {peer.full_name}
                        </h3>
                        <span className="font-mono text-xs text-slate-400">@{peer.username}</span>
                      </div>

                      {/* Skills pills */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {peer.skills_offered && peer.skills_offered.length > 0 && (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                            Teaches: {peer.skills_offered.slice(0, 2).join(", ")}
                          </span>
                        )}
                        {peer.skills_needed && peer.skills_needed.length > 0 && (
                          <span className="text-[11px] text-brand-700 dark:text-brand-300 font-semibold bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-lg border border-brand-200/60 dark:border-brand-800/40">
                            Learns: {peer.skills_needed.slice(0, 2).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {unreadCount > 0 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 animate-pulse">
                        {unreadCount} new
                      </span>
                    ) : null}
                    <div className="p-2.5 rounded-2xl text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 transition">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
