"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Keyboard, Plus, Sparkles, Shield, ScreenShare, MessageSquare, ArrowRight } from "lucide-react";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";

export default function MeetLobbyPage() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Generate a random Google Meet-style 3-part code: e.g. "learn-meet-x8q"
  const generateMeetingCode = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const segment = (len: number) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `meet-${segment(3)}-${segment(3)}`;
  };

  const handleStartInstantMeeting = () => {
    setIsCreating(true);
    const newCode = generateMeetingCode();
    router.push(`/meet/${newCode}`);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = meetingCode.trim().toLowerCase().replace(/https?:\/\/[^\/]+\/meet\//, "");
    if (!cleanCode) return;
    router.push(`/meet/${cleanCode}`);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden">
      <FluidAtmosphere />

      <div className="relative z-10 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Heading, Instant Meeting, and Join Form */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Real-Time WebRTC Peer Learning</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Video calls and meetings for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                skill exchange
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Connect 1-on-1 or gather your cohort for interactive learning sessions. Includes HD audio/video, high-framerate screen sharing, and real-time in-meeting chat.
            </p>
          </div>

          {/* Action Row: New Meeting & Join by Code */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            {/* Instant New Meeting */}
            <button
              type="button"
              onClick={handleStartInstantMeeting}
              disabled={isCreating}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              <Video className="w-4 h-4" />
              <span>{isCreating ? "Creating Room..." : "New Meeting"}</span>
            </button>

            {/* Join with a Code */}
            <form onSubmit={handleJoinByCode} className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Keyboard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  placeholder="Enter a code or link"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={!meetingCode.trim()}
                className="px-5 py-3 rounded-2xl text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 disabled:opacity-40 disabled:hover:bg-transparent transition"
              >
                Join
              </button>
            </form>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800" />

          {/* Value Props Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Secure peer-to-peer encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <ScreenShare className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Fluid screen sharing</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-500 shrink-0" />
              <span>Instant in-meeting chat</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Preview Card */}
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 p-8 text-white border border-slate-800 shadow-2xl space-y-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Simulated Meeting Tiles Preview */}
            <div className="grid grid-cols-2 gap-3 aspect-video">
              <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-3 flex flex-col justify-between shadow-inner">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">● Live 1080p</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 mx-auto flex items-center justify-center font-bold text-xs">
                  E
                </div>
                <span className="text-[11px] font-medium text-slate-300 truncate">Elena (Python / ML)</span>
              </div>

              <div className="rounded-2xl bg-slate-800/90 border border-slate-700/80 p-3 flex flex-col justify-between shadow-inner border-emerald-500/80">
                <span className="text-[10px] font-mono text-blue-400 font-bold">Speaking...</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 mx-auto flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500">
                  M
                </div>
                <span className="text-[11px] font-medium text-slate-300 truncate">Marcus (React / TS)</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-base text-white">Direct Peer Collaboration</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Study together, review code, share presentations, or run live whiteboard sessions without leaving LearnLync.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
