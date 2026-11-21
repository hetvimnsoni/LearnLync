"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChatPeerInfo, ChatMessage } from "@/types/chat";
import { MessageItem } from "./MessageItem";
import { useNexconn } from "@/components/providers/NexconnProvider";
import { useNotification } from "@/components/providers/NotificationProvider";
import {
  createDirectMessagesQuery,
  loadMessagePage,
  sendDirectTextMessage,
  subscribeDirectMessages,
  mergeAndSortMessages,
  clearDirectChannelUnread,
} from "@/lib/nexconn/chat";
import { MessagesQuery } from "@nexconn/chat";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  Key,
  BookOpen,
  GraduationCap,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

interface ChatRoomProps {
  peer: ChatPeerInfo;
  currentUserId: string;
}

export function ChatRoom({ peer, currentUserId }: ChatRoomProps) {
  const { isConnected, isConnecting, nexconnUserId: currentUserNexconnId, reconnect } = useNexconn();
  const { setActivePeerNexconnId, refreshCounts } = useNotification();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const queryRef = useRef<MessagesQuery | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Check if viewport is near the bottom (within 120px)
  const isNearBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return true;
    const threshold = 120;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Suppress outside toasts for this active peer while the component is mounted
  useEffect(() => {
    setActivePeerNexconnId(peer.nexconnUserId);
    return () => {
      setActivePeerNexconnId(null);
    };
  }, [peer.nexconnUserId, setActivePeerNexconnId]);

  // 1. Initialize message history query and load first page
  useEffect(() => {
    let isMounted = true;
    setIsLoadingHistory(true);
    setHistoryError(null);
    setMessages([]);

    const activeNexconnUserId = currentUserNexconnId || currentUserId.replace(/-/g, "").toLowerCase();

    // Create fresh query cursor for this peer
    const query = createDirectMessagesQuery(peer.nexconnUserId, 20);
    queryRef.current = query;

    loadMessagePage(query, activeNexconnUserId).then(({ messages: loaded, hasNext, error }) => {
      if (!isMounted) return;
      setIsLoadingHistory(false);

      if (error) {
        setHistoryError(error);
      } else {
        // Deterministically sort messages in chronological ascending order
        const chronological = mergeAndSortMessages([], loaded);
        setMessages(chronological);
        setHasMore(hasNext);
        setTimeout(() => scrollToBottom(false), 100);

        // Clear unread count for this peer conversation on the server and update global badge
        clearDirectChannelUnread(peer.nexconnUserId).then(() => {
          refreshCounts();
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [peer.nexconnUserId, currentUserNexconnId, currentUserId, scrollToBottom, refreshCounts]);

  // 2. Real-time message listener with strict deduplication and chronological ordering
  useEffect(() => {
    const activeNexconnUserId = currentUserNexconnId || currentUserId.replace(/-/g, "").toLowerCase();

    const unsubscribe = subscribeDirectMessages(
      peer.nexconnUserId,
      activeNexconnUserId,
      (incomingMsg) => {
        const wasNearBottom = isNearBottom();

        setMessages((prev) => mergeAndSortMessages(prev, [incomingMsg]));

        // Clear unread count for this active channel immediately
        clearDirectChannelUnread(peer.nexconnUserId).then(() => {
          refreshCounts();
        });

        // Only auto-scroll down if user was already at/near the bottom or if they sent the message
        if (wasNearBottom || incomingMsg.isSelf) {
          setTimeout(() => scrollToBottom(true), 50);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [peer.nexconnUserId, currentUserNexconnId, currentUserId, scrollToBottom, isNearBottom, refreshCounts]);

  // 3. Load older historical messages (pagination)
  const handleLoadEarlier = async () => {
    if (!queryRef.current || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const activeNexconnUserId = currentUserNexconnId || currentUserId.replace(/-/g, "").toLowerCase();

    // Save scroll height to preserve viewport position
    const container = chatContainerRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;

    const { messages: olderMessages, hasNext, error } = await loadMessagePage(
      queryRef.current,
      activeNexconnUserId
    );

    setIsLoadingMore(false);
    if (!error && olderMessages.length > 0) {
      setMessages((prev) => mergeAndSortMessages(prev, olderMessages));
      setHasMore(hasNext);

      // Restore scroll offset so view doesn't jump
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - previousScrollHeight;
        }
      });
    } else if (error) {
      setHistoryError(error);
    }
  };

  // 4. Send message handler with optimistic update
  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const activeNexconnUserId = currentUserNexconnId || currentUserId.replace(/-/g, "").toLowerCase();

    if (!isConnected) {
      setSendError("Cannot send message: Real-time chat is currently offline. Please reconnect.");
      return;
    }

    setSendError(null);
    setInputText("");

    // Create optimistic message entry
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      tempId,
      senderUserId: activeNexconnUserId,
      text: trimmed,
      sentTime: Date.now(),
      status: "sending",
      isSelf: true,
    };

    setMessages((prev) => mergeAndSortMessages(prev, [optimisticMsg]));
    setTimeout(() => scrollToBottom(true), 50);

    // Dispatch to Nexconn
    const result = await sendDirectTextMessage(
      peer.nexconnUserId,
      trimmed,
      activeNexconnUserId,
      tempId
    );

    if (result.success && result.message) {
      // Reconcile optimistic message with server-assigned message and maintain chronological sorting
      setMessages((prev) => mergeAndSortMessages(prev, [result.message!]));
    } else {
      // Mark as failed for user retry
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId
            ? { ...m, status: "failed", errorMessage: result.error || "Failed to deliver" }
            : m
        )
      );
      setSendError(result.error || "Message delivery failed.");
    }
  };

  // 5. Retry a failed message
  const handleRetryMessage = (failedMsg: ChatMessage) => {
    // Remove the failed entry and re-send
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    handleSendMessage(failedMsg.text);
  };

  // 6. Handle keyboard shortcut (Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const peerInitial = (peer.fullName || peer.username || "L").charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-brand-500/10 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/learners"
            className="p-2.5 rounded-2xl text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Back to Learner Discovery"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3">
            {peer.avatarUrl ? (
              <img
                src={peer.avatarUrl}
                alt={peer.fullName}
                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-brand-500/20">
                {peerInitial}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                  {peer.fullName}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 text-accent-amber" />
                  <span>Peer</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono">@{peer.username}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                  Direct 1-on-1 Chat
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Connection status badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Nexconn Live</span>
            </span>
          ) : isConnecting ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Connecting...</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => reconnect()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition"
              title="Click to reconnect"
            >
              <WifiOff className="w-3 h-3 text-red-500" />
              <span>Offline (Reconnect)</span>
            </button>
          )}
        </div>
      </div>

      {/* Disconnected / Reconnecting Notification Banner */}
      {!isConnected && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              {isConnecting
                ? "Connecting to real-time chat..."
                : "Real-time chat is disconnected. Messages cannot be sent until reconnected."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => reconnect()}
            disabled={isConnecting}
            className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 font-semibold hover:bg-amber-200 transition text-[11px]"
          >
            Reconnect Now
          </button>
        </div>
      )}

      {/* Message History & Stream Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50"
      >
        {/* Load Earlier Messages Button */}
        {hasMore && (
          <div className="text-center py-2">
            <button
              type="button"
              onClick={handleLoadEarlier}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingMore ? "animate-spin" : ""}`} />
              <span>{isLoadingMore ? "Loading earlier..." : "Load earlier messages"}</span>
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoadingHistory && (
          <div className="space-y-4 animate-pulse">
            <div className="flex justify-start">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/2" />
            </div>
            <div className="flex justify-end">
              <div className="h-12 bg-blue-100 dark:bg-blue-950/60 rounded-2xl w-2/5" />
            </div>
            <div className="flex justify-start">
              <div className="h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl w-3/5" />
            </div>
          </div>
        )}

        {/* History Error Banner */}
        {historyError && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Failed to load message history</p>
              <p className="text-[11px] opacity-90">{historyError}</p>
            </div>
          </div>
        )}

        {/* Empty Conversation Icebreaker State */}
        {!isLoadingHistory && messages.length === 0 && (
          <div className="max-w-md mx-auto my-8 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Start a conversation with {peer.fullName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Send a direct message over Nexconn to discuss skill exchanges and schedule peer learning sessions.
              </p>
            </div>

            {/* Skills Context */}
            <div className="text-left text-xs bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Skills they teach:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {peer.skillsOffered.length > 0 ? (
                  peer.skillsOffered.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">None listed</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            peerName={peer.fullName}
            peerInitial={peerInitial}
            onRetry={handleRetryMessage}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Send Error Notice */}
      {sendError && (
        <div className="px-5 py-2 bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{sendError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSendError(null)}
            className="text-red-600 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Message Composer Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex items-end gap-2.5"
        >
          <div className="flex-1 relative">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              placeholder={
                isConnected
                  ? `Message ${peer.fullName} (Press Enter to send, Shift+Enter for new line)...`
                  : "Connecting to real-time chat..."
              }
              maxLength={2000}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none disabled:opacity-60"
            />
            {inputText.length > 1500 && (
              <span className="absolute right-3 bottom-2 text-[10px] text-slate-400 font-mono">
                {inputText.length}/2000
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 transition disabled:opacity-50 shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

