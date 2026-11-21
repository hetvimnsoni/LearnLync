"use client";

import { Mic, Video, ShieldAlert, X, ExternalLink } from "lucide-react";

interface MediaPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "audio" | "video" | "both";
}

export function MediaPermissionModal({
  isOpen,
  onClose,
  type = "both",
}: MediaPermissionModalProps) {
  if (!isOpen) return null;

  const title =
    type === "audio"
      ? "Microphone Permission Required"
      : type === "video"
      ? "Camera Permission Required"
      : "Camera & Microphone Access Required";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            {type === "audio" ? (
              <Mic className="w-6 h-6" />
            ) : type === "video" ? (
              <Video className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              LearnLync needs access to connect live audio and video with your peer.
            </p>
          </div>
        </div>

        {/* Browser instructions */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">
            How to unblock in your browser:
          </p>
          <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-slate-600 dark:text-slate-400">
            <li>
              Click the <strong>Lock / Settings icon (🔒)</strong> located on the left side of your browser address bar.
            </li>
            <li>
              Look for <strong>Microphone</strong> {type !== "audio" && "and Camera"} settings.
            </li>
            <li>
              Change permission to <strong>Allow</strong>.
            </li>
            <li>
              Reload or re-click the call button to begin communicating.
            </li>
          </ol>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition shadow-md shadow-blue-500/20"
        >
          Got it, I&apos;ll Allow It
        </button>
      </div>
    </div>
  );
}
