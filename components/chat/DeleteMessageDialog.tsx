"use client";

import { Trash2, X, Ban, ShieldAlert } from "lucide-react";
import { ChatMessage } from "@/types/chat";

interface DeleteMessageDialogProps {
  isOpen: boolean;
  message: ChatMessage | null;
  isSelf: boolean;
  isDeleting?: boolean;
  onDeleteForMe: () => void;
  onDeleteForEveryone?: () => void;
  onCancel: () => void;
}

export function DeleteMessageDialog({
  isOpen,
  message,
  isSelf,
  isDeleting = false,
  onDeleteForMe,
  onDeleteForEveryone,
  onCancel,
}: DeleteMessageDialogProps) {
  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-message-title"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 id="delete-message-title" className="text-lg font-bold text-slate-900 dark:text-white">
            Delete Message?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Choose how you want to delete this message. Only this individual message will be affected.
          </p>

          {/* Snippet preview of message */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 max-h-20 overflow-hidden line-clamp-2 italic">
            &ldquo;{message.attachmentData ? `[Attachment: ${message.attachmentData.files[0]?.name || "Media"}]` : message.voiceData ? "[Voice Note]" : message.text}&rdquo;
          </div>
        </div>

        {/* Action Options */}
        <div className="flex flex-col gap-2 pt-2">
          {/* Delete for Everyone (only if current user sent this message) */}
          {isSelf && onDeleteForEveryone && (
            <button
              type="button"
              onClick={onDeleteForEveryone}
              disabled={isDeleting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-500/20 transition disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              <span>{isDeleting ? "Deleting..." : "Delete for Everyone"}</span>
            </button>
          )}

          {/* Delete for Me (always available) */}
          <button
            type="button"
            onClick={onDeleteForMe}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-slate-500" />
            <span>Delete for Me</span>
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full py-2.5 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
