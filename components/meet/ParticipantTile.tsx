"use client";

import { useEffect, useRef } from "react";
import { MicOff, Pin, PinOff, User } from "lucide-react";

interface ParticipantTileProps {
  stream: MediaStream | null;
  name: string;
  avatarUrl?: string | null;
  isSelf?: boolean;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  isSpeaking?: boolean;
  isScreenShare?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export function ParticipantTile({
  stream,
  name,
  avatarUrl,
  isSelf = false,
  isAudioMuted = false,
  isVideoMuted = false,
  isSpeaking = false,
  isScreenShare = false,
  isPinned = false,
  onTogglePin,
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVideoMuted]);

  const initial = (name || "U").charAt(0).toUpperCase();

  return (
    <div
      className={`relative w-full h-full rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center transition-all duration-200 border-2 ${
        isSpeaking && !isAudioMuted
          ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
          : "border-slate-800"
      }`}
    >
      {/* Video Element */}
      {stream && !isVideoMuted ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf} // Self must always be muted to prevent acoustic feedback loop
          className={`w-full h-full ${isScreenShare ? "object-contain bg-black" : "object-cover"} ${
            isSelf && !isScreenShare ? "transform -scale-x-100" : ""
          }`}
        />
      ) : (
        /* Avatar Fallback View */
        <div className="flex flex-col items-center justify-center space-y-3 select-none">
          <div className="relative">
            {isSpeaking && !isAudioMuted && (
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping duration-1000" />
            )}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-xl border-2 border-slate-700">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                initial
              )}
            </div>
          </div>
          <span className="text-sm font-semibold text-slate-300">{name}</span>
        </div>
      )}

      {/* Participant Name Badge & Mic Status (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/70 backdrop-blur-md text-white text-xs font-medium border border-white/10 shadow-sm max-w-[80%]">
        <span className="truncate">{isSelf ? `${name} (You)` : name}</span>
        {isAudioMuted && (
          <span className="p-0.5 rounded-full bg-red-500/80 text-white shrink-0" title="Microphone muted">
            <MicOff className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Pin Tile Action (Top Right) */}
      {onTogglePin && (
        <button
          type="button"
          onClick={onTogglePin}
          className={`absolute top-3 right-3 z-10 p-2 rounded-xl backdrop-blur-md transition ${
            isPinned
              ? "bg-blue-600 text-white"
              : "bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-950/80"
          }`}
          title={isPinned ? "Unpin participant" : "Pin participant to spotlight"}
        >
          {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}
