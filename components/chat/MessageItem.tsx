"use client";

import { ChatMessage } from "@/types/chat";
import { Check, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface MessageItemProps {
  message: ChatMessage;
  peerName: string;
  peerInitial: string;
  onRetry?: (msg: ChatMessage) => void;
}

export function MessageItem({
  message,
  peerName,
  peerInitial,
  onRetry,
}: MessageItemProps) {
  const isSelf = message.isSelf;

  const formatTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className={`flex w-full ${isSelf ? "justify-end" : "justify-start"} group`}>
      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
        {/* Peer Avatar Initial (only for incoming messages) */}
        {!isSelf && (
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mb-1 shadow-2xs"
            title={peerName}
          >
            {peerInitial}
          </div>
        )}

        <div className="space-y-1">
          {/* Message Bubble */}
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap shadow-2xs ${
              isSelf
                ? "bg-blue-600 text-white rounded-br-xs"
                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs"
            }`}
          >
            {message.text}
          </div>

          {/* Timestamp and Delivery Status */}
          <div
            className={`flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 px-1 ${
              isSelf ? "justify-end" : "justify-start"
            }`}
          >
            <span>{formatTime(message.sentTime)}</span>

            {isSelf && (
              <>
                {message.status === "sending" && (
                  <span className="flex items-center gap-0.5 text-amber-500" title="Sending...">
                    <Clock className="w-3 h-3 animate-spin" />
                  </span>
                )}

                {message.status === "sent" && (
                  <span className="flex items-center gap-0.5 text-emerald-500" title="Delivered via Nexconn">
                    <Check className="w-3 h-3" />
                  </span>
                )}

                {message.status === "failed" && (
                  <div className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    <span>Failed</span>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={() => onRetry(message)}
                        className="inline-flex items-center gap-0.5 text-blue-500 hover:text-blue-600 underline font-semibold ml-1"
                        title={message.errorMessage || "Retry sending"}
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

