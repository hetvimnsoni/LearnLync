"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, FastForward } from "lucide-react";

interface VoiceMessagePlayerProps {
  url: string;
  duration?: number; // Duration in seconds (hint from metadata)
  isSelf?: boolean;
}

export function VoiceMessagePlayer({
  url,
  duration: hintedDuration = 0,
  isSelf = false,
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(hintedDuration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [url]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().catch((err) => console.warn("Audio playback interrupted:", err));
      setIsPlaying(true);
    }
  }, [isPlaying, playbackRate]);

  const cyclePlaybackRate = useCallback(() => {
    const rates = [1.0, 1.5, 2.0];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  }, [playbackRate]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Fixed simulated waveform bars for aesthetic WhatsApp styling
  const waveformBars = [
    25, 45, 60, 30, 75, 90, 65, 40, 80, 50, 35, 70, 85, 95, 60, 45, 75, 40, 60, 30, 50, 20,
  ];

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-2xl w-64 sm:w-72 select-none ${
        isSelf ? "text-white" : "text-slate-800 dark:text-slate-100"
      }`}
    >
      {/* Play / Pause Circular Button */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoading}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition shadow-sm ${
          isSelf
            ? "bg-white text-blue-600 hover:bg-slate-100"
            : "bg-blue-600 text-white hover:bg-blue-500"
        } disabled:opacity-50`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {/* Interactive Waveform Visualizer */}
        <div className="relative h-7 flex items-center gap-[2.5px] cursor-pointer group">
          {waveformBars.map((heightPercent, idx) => {
            const barPosition = (idx / waveformBars.length) * 100;
            const isPlayed = barPosition <= progressPercent;

            return (
              <span
                key={idx}
                style={{ height: `${heightPercent}%` }}
                className={`flex-1 rounded-full transition-colors ${
                  isSelf
                    ? isPlayed
                      ? "bg-white"
                      : "bg-blue-300/40"
                    : isPlayed
                    ? "bg-blue-600"
                    : "bg-slate-300 dark:bg-slate-700"
                }`}
              />
            );
          })}

          {/* Invisible Range Input for Precise Touch/Mouse Scrubbing */}
          <input
            type="range"
            min={0}
            max={totalDuration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Duration Label and Progress */}
        <div className="flex items-center justify-between text-[11px] font-medium opacity-80 px-0.5">
          <span>{isPlaying ? formatTime(currentTime) : formatTime(totalDuration)}</span>
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-3 h-3 opacity-60" />
            <span>Voice Note</span>
          </div>
        </div>
      </div>

      {/* Speed Multiplier Button (1x, 1.5x, 2x) */}
      <button
        type="button"
        onClick={cyclePlaybackRate}
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition border ${
          isSelf
            ? "border-white/30 hover:bg-white/20 text-white"
            : "border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        }`}
        title="Change playback speed"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
