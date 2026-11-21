"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Maximize2,
  Minimize2,
  Volume2,
} from "lucide-react";
import { CallerInfo, CallType, CallStatus } from "@/hooks/useOneToOneCall";

interface ActiveCallModalProps {
  callStatus: CallStatus;
  callType: CallType;
  peerInfo: CallerInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

export function ActiveCallModal({
  callStatus,
  callType,
  peerInfo,
  localStream,
  remoteStream,
  isMicMuted,
  isCameraOff,
  isScreenSharing,
  callDuration,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
}: ActiveCallModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOff, isMinimized]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isMinimized]);

  if (callStatus === "idle" || callStatus === "incoming") {
    return null;
  }

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const isConnecting = callStatus === "calling" || callStatus === "connecting";
  const peerName = peerInfo?.name || "Peer Learner";

  // Minimized Floating PiP Mode
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-72 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden p-3 space-y-3 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold truncate">{peerName}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="font-mono text-[11px] text-slate-400">
              {formatDuration(callDuration)}
            </span>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:text-blue-400 text-slate-300"
              title="Expand call"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onToggleMic}
            className={`p-2 rounded-xl text-xs ${
              isMicMuted ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-white"
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onToggleCamera}
            className={`p-2 rounded-xl text-xs ${
              isCameraOff ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-white"
            }`}
          >
            {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onEndCall}
            className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white"
            title="End Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Full Screen Call Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between">
        {/* Top Header Bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {peerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">{peerName}</h3>
              <p className="text-xs text-slate-300 font-mono">
                {isConnecting
                  ? "Calling / Negotiating..."
                  : `${callType === "video" ? "Video" : "Audio"} • ${formatDuration(callDuration)}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
            title="Minimize to Picture-in-Picture"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Video / Call Center Stage */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
          {/* Remote Video Stream */}
          {remoteStream && callType === "video" ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            /* Audio Call / Avatar Hero View */
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                {!isConnecting && (
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping duration-1000" />
                )}
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-700 text-white flex items-center justify-center text-4xl font-extrabold shadow-2xl border-4 border-slate-800">
                  {peerInfo?.avatarUrl ? (
                    <img
                      src={peerInfo.avatarUrl}
                      alt={peerName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    peerName.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-white">{peerName}</h4>
                <p className="text-xs text-slate-400">
                  {isConnecting ? "Connecting to peer..." : "Call in progress"}
                </p>
              </div>
            </div>
          )}

          {/* Local Video Picture-in-Picture (Bottom-Right) */}
          {callType === "video" && localStream && (
            <div className="absolute bottom-24 right-5 z-20 w-32 sm:w-44 aspect-video rounded-2xl bg-slate-800 border-2 border-slate-700 shadow-2xl overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraOff ? "hidden" : ""}`}
              />
              {isCameraOff && (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-semibold bg-slate-800">
                  Camera Off
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Call Controls Toolbar */}
        <div className="relative z-20 flex items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={onToggleMic}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-md ${
              isMicMuted
                ? "bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
                : "bg-slate-800 border border-slate-700 text-white hover:bg-slate-700"
            }`}
            title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Camera (Video call only) */}
          {callType === "video" && (
            <button
              type="button"
              onClick={onToggleCamera}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-md ${
                isCameraOff
                  ? "bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
                  : "bg-slate-800 border border-slate-700 text-white hover:bg-slate-700"
              }`}
              title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Screen Share */}
          {callType === "video" && (
            <button
              type="button"
              onClick={onToggleScreenShare}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-md ${
                isScreenSharing
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-slate-800 border border-slate-700 text-white hover:bg-slate-700"
              }`}
              title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
            >
              {isScreenSharing ? (
                <ScreenShareOff className="w-5 h-5" />
              ) : (
                <ScreenShare className="w-5 h-5" />
              )}
            </button>
          )}

          {/* End Call Button */}
          <button
            type="button"
            onClick={onEndCall}
            className="w-14 h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition transform hover:scale-105"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
