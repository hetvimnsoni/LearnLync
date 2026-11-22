"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CategorizedRequests, SkillExchange, ExchangeStatus } from "@/types/exchange";
import { respondToRequest, cancelRequest, getExchangeRequests } from "@/app/requests/actions";
import { useNotification } from "@/components/providers/NotificationProvider";
import {
  ArrowLeftRight,
  Inbox,
  Send,
  Sparkles,
  Check,
  X,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Calendar,
  RefreshCw,
  User,
  Zap,
  Award,
} from "lucide-react";
import { SessionPrepModal } from "./SessionPrepModal";
import { SessionCompleteModal } from "./SessionCompleteModal";

interface RequestsExplorerProps {
  initialData: CategorizedRequests;
  currentUserId: string;
}

export function RequestsExplorer({ initialData, currentUserId }: RequestsExplorerProps) {
  const { refreshCounts } = useNotification();
  const [data, setData] = useState<CategorizedRequests>(initialData);
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing" | "accepted">("incoming");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  const [prepModalReq, setPrepModalReq] = useState<SkillExchange | null>(null);
  const [completeModalReq, setCompleteModalReq] = useState<SkillExchange | null>(null);

  const handleRefresh = () => {
    startRefresh(async () => {
      setActionError(null);
      setActionSuccess(null);
      const fresh = await getExchangeRequests();
      setData(fresh);
      refreshCounts();
    });
  };

  const handleRespond = async (requestId: string, action: "accept" | "reject") => {
    setProcessingId(requestId);
    setActionError(null);
    setActionSuccess(null);

    const result = await respondToRequest(requestId, action);
    setProcessingId(null);

    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess(result.message || `Request ${action}ed successfully.`);
      const fresh = await getExchangeRequests();
      setData(fresh);
      refreshCounts();
    }
  };

  const handleCancel = async (requestId: string) => {
    setProcessingId(requestId);
    setActionError(null);
    setActionSuccess(null);

    const result = await cancelRequest(requestId);
    setProcessingId(null);

    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess(result.message || "Request cancelled.");
      const fresh = await getExchangeRequests();
      setData(fresh);
      refreshCounts();
    }
  };

  const getStatusBadge = (status: ExchangeStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Pending Review</span>
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Accepted • Chat Active</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Completed • Verified</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <X className="w-3.5 h-3.5" />
            <span>Declined</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <span>Cancelled</span>
          </span>
        );
    }
  };

  const currentList =
    activeTab === "incoming"
      ? data.incoming
      : activeTab === "outgoing"
      ? data.outgoing
      : data.accepted;

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <span>Skill Exchange Requests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your peer learning proposals, accept invitations, and launch one-to-one chats.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Global Alerts */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-indigo-100/80 dark:border-slate-800 w-full sm:max-w-md overflow-x-auto no-scrollbar shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("incoming")}
          className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "incoming"
              ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Incoming</span>
          {data.pendingIncomingCount > 0 && (
            <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[10px] font-extrabold bg-brand-600 text-white animate-pulse">
              {data.pendingIncomingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("outgoing")}
          className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "outgoing"
              ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Sent ({data.outgoing.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("accepted")}
          className={`flex-1 min-w-[95px] flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "accepted"
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
          <span>Accepted ({data.accepted.length})</span>
        </button>
      </div>

      {/* Requests Stream */}
      {currentList.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center">
            {activeTab === "incoming" ? (
              <Inbox className="w-7 h-7" />
            ) : activeTab === "outgoing" ? (
              <Send className="w-7 h-7" />
            ) : (
              <Sparkles className="w-7 h-7 text-emerald-500" />
            )}
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {activeTab === "incoming"
                ? "No incoming requests yet"
                : activeTab === "outgoing"
                ? "No sent requests"
                : "No accepted exchanges yet"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeTab === "incoming"
                ? "When fellow learners discover your profile and propose an exchange, they will appear here."
                : activeTab === "outgoing"
                ? "Browse the learner peer directory to propose skill exchanges to learners."
                : "Once an exchange request is accepted by either party, it unlocks live 1-on-1 Nexconn chat here."}
            </p>
          </div>
          <Link
            href="/learners"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition shadow-sm"
          >
            <span>Explore Peers</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((req) => {
            const isSender = req.sender_id === currentUserId;
            const otherUser = isSender ? req.receiver : req.sender;
            const otherUserId = isSender ? req.receiver_id : req.sender_id;
            const otherName = otherUser?.full_name || "Learner Peer";
            const initial = otherName.charAt(0).toUpperCase();
            const isProcessing = processingId === req.id;

            return (
              <div
                key={req.id}
                className="rounded-3xl border border-indigo-100/80 dark:border-slate-800 bg-gradient-to-br from-white/95 via-[#FCFAFF]/90 to-[#F4F8FF]/85 dark:from-slate-900/80 dark:via-slate-900/80 dark:to-slate-900/80 backdrop-blur-xl p-6 shadow-[0_4px_20px_-4px_rgba(112,70,232,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(112,70,232,0.08)] dark:shadow-sm dark:hover:shadow-md transition space-y-4"
              >
                {/* Header: User Info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {otherUser?.avatar_url ? (
                      <img
                        src={otherUser.avatar_url}
                        alt={otherName}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {initial}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {otherName}
                        </h3>
                        <span className="text-xs font-mono text-slate-400">
                          @{otherUser?.username || "peer"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(req.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                {/* Reciprocal Skills Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{isSender ? "You Offer to Teach" : `${otherName} Offers`}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {req.skill_offered}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isSender ? "You Want to Learn" : `${otherName} Wants to Learn`}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {req.skill_wanted}
                    </div>
                  </div>
                </div>

                {/* Custom Message if provided */}
                {req.message && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 italic p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    &ldquo;{req.message}&rdquo;
                  </div>
                )}

                {/* Actions Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500">
                    {req.status === "accepted" ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mutual exchange active
                      </span>
                    ) : isSender ? (
                      <span>You sent this request</span>
                    ) : (
                      <span>Awaiting your decision</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Receiver actions on pending */}
                    {!isSender && req.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRespond(req.id, "reject")}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(req.id, "accept")}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isProcessing ? "Accepting..." : "Accept Exchange"}</span>
                        </button>
                      </>
                    )}

                    {/* Sender action on pending: Cancel */}
                    {isSender && req.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleCancel(req.id)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 hover:bg-red-100 transition disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isProcessing ? "Cancelling..." : "Cancel Request"}</span>
                      </button>
                    )}

                    {/* Accepted: Actions for Chat, AI Session Prep, and Session Completion */}
                    {req.status === "accepted" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPrepModalReq(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-accent-amber" />
                          <span>AI Session Prep</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCompleteModalReq(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition shadow-2xs"
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Complete & Verify</span>
                        </button>

                        <Link
                          href={`/chat/${otherUserId}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 text-white hover:from-brand-500 hover:to-indigo-500 transition shadow-md shadow-brand-500/20"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open 1:1 Nexconn Chat</span>
                        </Link>
                      </div>
                    )}

                    {/* Completed: Link to Chat & View Certificates */}
                    {req.status === "completed" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href="/certificates"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition shadow-md"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>View Certificates</span>
                        </Link>

                        <Link
                          href={`/chat/${otherUserId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat History</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Session Preparation Modal */}
      {prepModalReq && (
        <SessionPrepModal
          exchangeId={prepModalReq.id}
          skillOffered={prepModalReq.skill_offered}
          peerName={
            (prepModalReq.sender_id === currentUserId
              ? prepModalReq.receiver?.full_name
              : prepModalReq.sender?.full_name) || "Learner"
          }
          isOpen={true}
          onClose={() => setPrepModalReq(null)}
        />
      )}

      {/* Post-Session Completion & Verification Modal */}
      {completeModalReq && (
        <SessionCompleteModal
          exchangeId={completeModalReq.id}
          skillOffered={completeModalReq.skill_offered}
          peerName={
            (completeModalReq.sender_id === currentUserId
              ? completeModalReq.receiver?.full_name
              : completeModalReq.sender?.full_name) || "Learner"
          }
          isOpen={true}
          onClose={() => setCompleteModalReq(null)}
          onCompleteSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
