"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/components/providers/NotificationProvider";
import { MessageSquare, ArrowLeftRight, Info, X } from "lucide-react";

export function NotificationToasts() {
  const router = useRouter();
  const { toasts, dismissToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isChat = toast.type === "chat";
        const isExchange = toast.type === "exchange";

        const handleClick = () => {
          if (toast.href) {
            router.push(toast.href);
          }
          dismissToast(toast.id);
        };

        return (
          <div
            key={toast.id}
            onClick={handleClick}
            className="pointer-events-auto group relative flex items-start gap-3 p-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 cursor-pointer transition-all hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-600 animate-in slide-in-from-bottom-5 fade-in duration-200"
            role="alert"
          >
            {/* Avatar or Icon */}
            {toast.avatarUrl ? (
              <img
                src={toast.avatarUrl}
                alt=""
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${
                  isChat
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                    : isExchange
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : "bg-gradient-to-br from-slate-600 to-slate-800"
                }`}
              >
                {toast.initial ? (
                  toast.initial
                ) : isChat ? (
                  <MessageSquare className="w-5 h-5" />
                ) : isExchange ? (
                  <ArrowLeftRight className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
            )}

            {/* Content Preview */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isChat ? "bg-blue-500" : isExchange ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {toast.title}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {toast.description}
              </p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 inline-block group-hover:underline">
                Tap to view &rarr;
              </span>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

