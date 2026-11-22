"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  PhoneOff,
  MessageSquare,
  Users,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

interface MeetingControlsProps {
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isRosterOpen: boolean;
  unreadChatCount: number;
  participantCount: number;
  roomCode: string;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleRoster: () => void;
  onLeaveMeeting: () => void;
}

export function MeetingControls({
  isMicMuted,
  isCameraOff,
  isScreenSharing,
  isChatOpen,
  isRosterOpen,
  unreadChatCount,
  participantCount,
  roomCode,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onToggleRoster,
  onLeaveMeeting,
}: MeetingControlsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/meet/${roomCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-20 bg-slate-950/90 border-t border-slate-800 px-2 sm:px-8 flex items-center justify-between text-white shrink-0 z-20 pb-[env(safe-area-inset-bottom,0px)]">
      {/* Left: Meeting Info & Quick Copy */}
      <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-300">
        <span className="font-bold text-slate-200">{roomCode}</span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1"
          title="Copy meeting join link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-sans">Copied link</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-sans">Share link</span>
            </>
          )}
        </button>
      </div>

      {/* Center: Core A/V and Screen Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 mx-auto md:mx-0">
        {/* Mic Toggle */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`p-2.5 sm:p-3.5 rounded-full transition shadow-md ${
            isMicMuted
              ? "bg-red-600 text-white hover:bg-red-500"
              : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
          }`}
          title={isMicMuted ? "Turn on microphone" : "Turn off microphone"}
        >
          {isMicMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          type="button"
          onClick={onToggleCamera}
          className={`p-2.5 sm:p-3.5 rounded-full transition shadow-md ${
            isCameraOff
              ? "bg-red-600 text-white hover:bg-red-500"
              : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
          }`}
          title={isCameraOff ? "Turn on camera" : "Turn off camera"}
        >
          {isCameraOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Screen Share Toggle */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          className={`p-2.5 sm:p-3.5 rounded-full transition shadow-md ${
            isScreenSharing
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
          }`}
          title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
        >
          {isScreenSharing ? (
            <ScreenShareOff className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <ScreenShare className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Leave / End Meeting (Red Pill Button) */}
        <button
          type="button"
          onClick={onLeaveMeeting}
          className="px-3 sm:px-6 py-2.5 sm:py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-red-600/30 transition transform hover:scale-105 ml-1 sm:ml-2"
          title="Leave meeting"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Right: Drawer Toggles (People & In-Meeting Chat) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* People / Participants Roster */}
        <button
          type="button"
          onClick={onToggleRoster}
          className={`p-2.5 sm:p-3 rounded-2xl relative transition ${
            isRosterOpen
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          }`}
          title="Participants"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-700 text-[10px] font-bold border border-slate-600 text-white">
            {participantCount}
          </span>
        </button>

        {/* In-Meeting Chat */}
        <button
          type="button"
          onClick={onToggleChat}
          className={`p-2.5 sm:p-3 rounded-2xl relative transition ${
            isChatOpen
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          }`}
          title="Meeting Chat"
        >
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold text-white animate-pulse">
              {unreadChatCount > 9 ? "9+" : unreadChatCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
