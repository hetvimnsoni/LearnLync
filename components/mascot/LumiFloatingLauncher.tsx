"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLumi } from "./LumiContext";
import { LumiCharacter } from "./LumiCharacter";
import { Sparkles, X, MessageSquare, ArrowRight, Bot } from "lucide-react";

export function LumiFloatingLauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, triggerMode, isChatOpen, openChat, closeChat, toggleChat } = useLumi();
  const [hasPromptedGreeting, setHasPromptedGreeting] = useState(false);
  const [speechText, setSpeechText] = useState<string | null>(null);

  // Friendly prompt on initial landing page load
  useEffect(() => {
    if (!hasPromptedGreeting) {
      const timer = setTimeout(() => {
        setSpeechText("Hi! What would you like to learn today?");
        triggerMode("greeting", 3500);
        setHasPromptedGreeting(true);

        setTimeout(() => setSpeechText(null), 5000);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [hasPromptedGreeting, triggerMode]);

  // If user is already on /ai, they have the full screen interface, but floating launcher can still show quick status!
  const isOnAIPage = pathname === "/ai";

  const handleLauncherClick = () => {
    if (isOnAIPage) {
      // Focus or trigger greeting
      triggerMode("greeting", 2500);
      setSpeechText("I'm right here with you!");
      setTimeout(() => setSpeechText(null), 3000);
    } else {
      // Navigate to /ai or toggle floating quick drawer
      router.push("/ai");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Interactive Floating Mascot Button */}
      <div className="relative group">
        {/* Soft Lavender Halo Glow */}
        <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-purple-600/30 via-indigo-500/25 to-purple-400/35 blur-xl group-hover:blur-2xl transition-all duration-500 pointer-events-none" />

        <button
          type="button"
          onClick={handleLauncherClick}
          className="relative flex items-center justify-center p-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-purple-300/80 dark:border-purple-600/80 shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400/40"
          title="Meet Lumi — LearnLync AI Companion"
        >
          {/* Small 3D Character Rendering with state animation */}
          <LumiCharacter
            size="sm"
            mode={mode}
            interactive={false}
            showSpeechBubble={Boolean(speechText)}
            speechText={speechText || undefined}
          />

          {/* Quick sparkle indicator badge */}
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </span>
        </button>

        {/* Hover Speech Prompt (when no speechText is active) */}
        {!speechText && (
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-purple-200 dark:border-purple-800 text-slate-800 dark:text-slate-100 text-xs font-bold shadow-xl shadow-purple-500/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <span>Ask Lumi Anything</span>
            <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white/95 dark:bg-slate-900/95 border-t border-r border-purple-200 dark:border-purple-800 rotate-45" />
          </div>
        )}
      </div>
    </div>
  );
}
