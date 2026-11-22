"use client";

import Link from "next/link";
import { CategorizedRequests, SkillExchange } from "@/types/exchange";
import {
  Users,
  MessageSquare,
  ArrowLeftRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Send,
  Inbox,
  ShieldCheck,
  Zap,
  Award,
  FileCheck,
  Compass,
  BarChart2,
} from "lucide-react";
import { useNexconn } from "@/components/providers/NexconnProvider";

interface LearningSpaceProps {
  requestsData: CategorizedRequests;
  currentUserId: string;
}

export function LearningSpace({ requestsData, currentUserId }: LearningSpaceProps) {
  const { isConnected, isConnecting } = useNexconn();

  const acceptedCount = requestsData.accepted.length;
  const incomingCount = requestsData.pendingIncomingCount;
  const outgoingCount = requestsData.outgoing.filter((r) => r.status === "pending").length;
  const totalPending = incomingCount + outgoingCount;

  // Combine real database exchange events to create a true activity timeline
  const recentActivities = [
    ...requestsData.accepted.map((ex) => ({
      id: ex.id,
      type: "accepted" as const,
      exchange: ex,
      timestamp: new Date(ex.updated_at || ex.created_at).getTime(),
    })),
    ...requestsData.incoming
      .filter((ex) => ex.status === "pending")
      .map((ex) => ({
        id: ex.id,
        type: "incoming" as const,
        exchange: ex,
        timestamp: new Date(ex.created_at).getTime(),
      })),
    ...requestsData.outgoing
      .filter((ex) => ex.status === "pending")
      .map((ex) => ({
        id: ex.id,
        type: "outgoing" as const,
        exchange: ex,
        timestamp: new Date(ex.created_at).getTime(),
      })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Learning Space Header & Live Messaging Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Your Learning Space
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80">
              <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
              <span>Overview</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your reciprocal partnerships, live conversations, and active exchange proposals.
          </p>
        </div>

        {/* Real-time Messaging Availability Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isConnected ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Messaging Ready</span>
            </div>
          ) : isConnecting ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Connecting Chat...</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Messaging Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Metric 1: Learning Connections */}
        <div className="rounded-3xl border border-indigo-100/80 dark:border-slate-800 bg-gradient-to-br from-white/95 via-[#FCFAFF]/90 to-[#F4F8FF]/85 dark:from-slate-900/80 dark:via-slate-900/80 dark:to-slate-900/80 backdrop-blur-xl p-6 shadow-[0_4px_20px_-4px_rgba(112,70,232,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(112,70,232,0.08)] dark:shadow-sm dark:hover:shadow-md transition space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Partnerships
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {acceptedCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Active learning partner{acceptedCount === 1 ? "" : "s"}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/requests"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>View partnerships</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metric 2: Active Conversations */}
        <div className="rounded-3xl border border-indigo-100/80 dark:border-slate-800 bg-gradient-to-br from-white/95 via-[#FCFAFF]/90 to-[#F4F8FF]/85 dark:from-slate-900/80 dark:via-slate-900/80 dark:to-slate-900/80 backdrop-blur-xl p-6 shadow-[0_4px_20px_-4px_rgba(112,70,232,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(112,70,232,0.08)] dark:shadow-sm dark:hover:shadow-md transition space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Real-time Chat
            </span>
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {acceptedCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              1-on-1 chat channels unlocked
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/chat"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>Open messages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metric 3: Pending Proposals */}
        <div className="rounded-3xl border border-indigo-100/80 dark:border-slate-800 bg-gradient-to-br from-white/95 via-[#FCFAFF]/90 to-[#F4F8FF]/85 dark:from-slate-900/80 dark:via-slate-900/80 dark:to-slate-900/80 backdrop-blur-xl p-6 shadow-[0_4px_20px_-4px_rgba(112,70,232,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(112,70,232,0.08)] dark:shadow-sm dark:hover:shadow-md transition space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Exchange Proposals
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalPending}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {incomingCount} incoming • {outgoingCount} sent
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/requests"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>Manage requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* AI Learning Assistant Quick Launch Hub */}
      <div className="rounded-3xl border border-indigo-100/90 dark:border-brand-900/60 bg-gradient-to-br from-[#F3EEFF]/60 via-white to-[#EAF3FF]/50 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-brand-950/40 backdrop-blur-xl p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(112,70,232,0.06)] dark:shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6 text-accent-amber" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                LearnLync AI Assistant & Tools
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI-driven peer recommendations, personalized roadmaps, quizzes, and verified certificates.
              </p>
            </div>
          </div>

          <Link
            href="/ai"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition shadow-sm self-start sm:self-auto"
          >
            <span>Open AI Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <Link
            href="/ai?tab=peers"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-brand-500 transition space-y-1 shadow-2xs group"
          >
            <Users className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-900 dark:text-white">Find Peer Teacher</p>
            <p className="text-[10px] text-slate-400">Match skills needed/offered</p>
          </Link>

          <Link
            href="/ai?tab=roadmap"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-500 transition space-y-1 shadow-2xs group"
          >
            <Compass className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-900 dark:text-white">Learning Roadmap</p>
            <p className="text-[10px] text-slate-400">Step-by-step milestones</p>
          </Link>

          <Link
            href="/ai?tab=quiz"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500 transition space-y-1 shadow-2xs group"
          >
            <FileCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-900 dark:text-white">AI Quizzes</p>
            <p className="text-[10px] text-slate-400">Test & identify weak spots</p>
          </Link>

          <Link
            href="/certificates"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-amber-500 transition space-y-1 shadow-2xs group"
          >
            <Award className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-900 dark:text-white">Certificates</p>
            <p className="text-[10px] text-slate-400">Verified progress studio</p>
          </Link>
        </div>
      </div>

      {/* Recent Learning Activity Feed */}
      <div className="rounded-3xl border border-indigo-100/80 dark:border-slate-800 bg-gradient-to-br from-white/95 via-[#FCFAFF]/90 to-[#F4F8FF]/85 dark:from-slate-900/80 dark:via-slate-900/80 dark:to-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(112,70,232,0.06)] dark:shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" />
            <span>Recent Exchange Activity</span>
          </h3>
          <Link
            href="/requests"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            All Activity →
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <div className="p-8 text-center space-y-3 bg-slate-50/70 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                No recent activity yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browse peer learners, explore complementary skills, and send your first exchange proposal to get started!
              </p>
            </div>
            <Link
              href="/learners"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition shadow-sm"
            >
              <span>Explore Peers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((act) => {
              const ex = act.exchange;
              const isSender = ex.sender_id === currentUserId;
              const partner = isSender ? ex.receiver : ex.sender;
              const partnerId = isSender ? ex.receiver_id : ex.sender_id;
              const partnerName = partner?.full_name || "Learning Peer";

              return (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-brand-400/60 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-sm ${
                        act.type === "accepted"
                          ? "bg-gradient-to-tr from-emerald-500 to-teal-600"
                          : act.type === "incoming"
                          ? "bg-gradient-to-tr from-brand-600 to-indigo-600"
                          : "bg-gradient-to-tr from-purple-600 to-pink-600"
                      }`}
                    >
                      {act.type === "accepted" ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : act.type === "incoming" ? (
                        <Inbox className="w-5 h-5" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {act.type === "accepted" && (
                          <span>
                            Skill Exchange Confirmed with <strong>{partnerName}</strong>
                          </span>
                        )}
                        {act.type === "incoming" && (
                          <span>
                            Incoming Exchange Request from <strong>{partnerName}</strong>
                          </span>
                        )}
                        {act.type === "outgoing" && (
                          <span>
                            Exchange Proposal sent to <strong>{partnerName}</strong>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Teach: {isSender ? ex.skill_offered : ex.skill_wanted}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          Learn: {isSender ? ex.skill_wanted : ex.skill_offered}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {act.type === "accepted" ? (
                      <Link
                        href={`/chat/${partnerId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-500 transition shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat Now</span>
                      </Link>
                    ) : (
                      <Link
                        href="/requests"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-600 hover:text-white transition"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

