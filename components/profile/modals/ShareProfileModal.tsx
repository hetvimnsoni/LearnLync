"use client";

import { useState } from "react";
import { UserProfile } from "@/types/profile";
import { X, Copy, Check, QrCode, Share2, Twitter, Linkedin, ExternalLink } from "lucide-react";

interface ShareProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export function ShareProfileModal({ profile, onClose }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);

  // Derive profile share URL
  const origin = typeof window !== "undefined" ? window.location.origin : "https://learnlync.dev";
  const shareUrl = `${origin}/profile/${profile.username || profile.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const tweetText = encodeURIComponent(
    `Check out ${profile.full_name || profile.username}'s learning profile and peer skill exchanges on LearnLync! 🚀`
  );
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(
    shareUrl
  )}`;
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Share Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Share your digital learning identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Vector QR Code Display */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
            {/* SVG Matrix QR Representation */}
            <svg
              className="w-40 h-40"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Corner position markers */}
              <rect x="5" y="5" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="9" y="9" width="18" height="18" rx="2" fill="#ffffff" />
              <rect x="13" y="13" width="10" height="10" rx="1" fill="#4f46e5" />

              <rect x="69" y="5" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="73" y="9" width="18" height="18" rx="2" fill="#ffffff" />
              <rect x="77" y="13" width="10" height="10" rx="1" fill="#4f46e5" />

              <rect x="5" y="69" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="9" y="73" width="18" height="18" rx="2" fill="#ffffff" />
              <rect x="13" y="77" width="10" height="10" rx="1" fill="#4f46e5" />

              {/* Data dots simulating encoded profile hash */}
              <circle cx="40" cy="15" r="2.5" fill="#1e1b4b" />
              <circle cx="48" cy="20" r="2.5" fill="#4f46e5" />
              <circle cx="56" cy="15" r="2.5" fill="#1e1b4b" />
              <circle cx="45" cy="28" r="2.5" fill="#4f46e5" />
              <circle cx="55" cy="28" r="2.5" fill="#1e1b4b" />

              <circle cx="15" cy="45" r="2.5" fill="#1e1b4b" />
              <circle cx="25" cy="40" r="2.5" fill="#4f46e5" />
              <circle cx="20" cy="55" r="2.5" fill="#1e1b4b" />
              <circle cx="30" cy="50" r="2.5" fill="#4f46e5" />

              {/* Center decorative LearnLync logo dot */}
              <rect x="42" y="42" width="16" height="16" rx="4" fill="#6366f1" />
              <circle cx="50" cy="50" r="3.5" fill="#ffffff" />

              <circle cx="70" cy="45" r="2.5" fill="#4f46e5" />
              <circle cx="80" cy="42" r="2.5" fill="#1e1b4b" />
              <circle cx="75" cy="55" r="2.5" fill="#4f46e5" />
              <circle cx="85" cy="52" r="2.5" fill="#1e1b4b" />

              <circle cx="40" cy="75" r="2.5" fill="#1e1b4b" />
              <circle cx="50" cy="70" r="2.5" fill="#4f46e5" />
              <circle cx="45" cy="85" r="2.5" fill="#1e1b4b" />
              <circle cx="60" cy="80" r="2.5" fill="#4f46e5" />
              <circle cx="75" cy="75" r="2.5" fill="#1e1b4b" />
              <circle cx="85" cy="85" r="2.5" fill="#4f46e5" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono text-center">
            Scan to view @{profile.username || "learner"} on LearnLync
          </p>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Shareable Profile Link
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-transparent px-3 text-xs text-slate-700 dark:text-slate-300 font-mono focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-brand-600 hover:bg-brand-500 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Share Shortcuts */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <a
            href={twitterShareUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition"
          >
            <Twitter className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>Share to X</span>
          </a>
          <a
            href={linkedInShareUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition"
          >
            <Linkedin className="w-4 h-4 text-blue-600 dark:text-blue-500" />
            <span>Post to LinkedIn</span>
          </a>
        </div>
      </div>
    </div>
  );
}
