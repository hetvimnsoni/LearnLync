"use client";

import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";
import { CallerInfo, CallType } from "@/hooks/useOneToOneCall";

interface IncomingCallDialogProps {
  caller: CallerInfo | null;
  onAccept: (callType?: CallType) => void;
  onDecline: () => void;
}

export function IncomingCallDialog({
  caller,
  onAccept,
  onDecline,
}: IncomingCallDialogProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play gentle synthesized telephone ring using Web Audio API
  useEffect(() => {
    if (!caller) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const playTone = () => {
          if (ctx.state === "suspended") {
            ctx.resume();
          }
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(440, ctx.currentTime); // 440 Hz
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(480, ctx.currentTime); // 480 Hz

          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(ctx.currentTime + 1.2);
          osc2.stop(ctx.currentTime + 1.2);
        };

        playTone();
        ringIntervalRef.current = setInterval(playTone, 2800);
      }
    } catch (e) {
      console.warn("Ringtone synthesizer skipped:", e);
    }

    return () => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [caller]);

  if (!caller) return null;

  const isVideo = caller.callType === "video";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 text-center space-y-6">
        {/* Caller Avatar with Pulse Ring */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping duration-1000" />
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold">
            {caller.avatarUrl ? (
              <img
                src={caller.avatarUrl}
                alt={caller.name}
                className="w-full h-full object-cover"
              />
            ) : (
              caller.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* Title & Call Type */}
        <div className="space-y-1">
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">
            {caller.name}
          </h3>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5">
            {isVideo ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>Incoming {isVideo ? "Video" : "Audio"} Call...</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 pt-2">
          {/* Decline */}
          <button
            type="button"
            onClick={onDecline}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition transform hover:scale-105"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Accept Video (if video call) */}
          {isVideo && (
            <button
              type="button"
              onClick={() => onAccept("video")}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition transform hover:scale-105"
              title="Accept with Video"
            >
              <Video className="w-6 h-6" />
            </button>
          )}

          {/* Accept Audio Only */}
          <button
            type="button"
            onClick={() => onAccept("audio")}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition transform hover:scale-105"
            title="Accept Audio"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
