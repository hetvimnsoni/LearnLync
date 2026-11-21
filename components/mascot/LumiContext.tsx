"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

export type LumiAnimationMode =
  | "idle"
  | "greeting"
  | "thinking"
  | "explaining"
  | "listening"
  | "celebration"
  | "encouragement"
  | "reading"
  | "analysis"
  | "goodbye";

interface LumiContextType {
  mode: LumiAnimationMode;
  triggerMode: (newMode: LumiAnimationMode, durationMs?: number, speechMessage?: string) => void;
  message: string | null;
  setMessage: (msg: string | null) => void;
  isChatOpen: boolean;
  openChat: (initialQuery?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  initialQuery: string;
}

const LumiContext = createContext<LumiContextType | undefined>(undefined);

export function LumiProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<LumiAnimationMode>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerMode = useCallback((newMode: LumiAnimationMode, durationMs?: number, speechMessage?: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setMode(newMode);
    if (speechMessage !== undefined) {
      setMessage(speechMessage);
    }

    // Auto-return to idle for transient animation states
    const autoDurations: Partial<Record<LumiAnimationMode, number>> = {
      greeting: 4000,
      celebration: 5000,
      encouragement: 4500,
      goodbye: 2500,
      explaining: 5000,
      analysis: 5000,
      reading: 5000,
    };

    const finalDuration = durationMs || autoDurations[newMode];

    if (finalDuration && newMode !== "idle") {
      timeoutRef.current = setTimeout(() => {
        setMode("idle");
        if (speechMessage !== undefined) {
          setMessage(null);
        }
        timeoutRef.current = null;
      }, finalDuration);
    }
  }, []);

  const openChat = useCallback((query?: string) => {
    if (query) setInitialQuery(query);
    setIsChatOpen(true);
    triggerMode("greeting");
  }, [triggerMode]);

  const closeChat = useCallback(() => {
    triggerMode("goodbye", 1200);
    setTimeout(() => {
      setIsChatOpen(false);
      triggerMode("idle");
    }, 1200);
  }, [triggerMode]);

  const toggleChat = useCallback(() => {
    if (isChatOpen) {
      closeChat();
    } else {
      openChat();
    }
  }, [isChatOpen, openChat, closeChat]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <LumiContext.Provider
      value={{
        mode,
        triggerMode,
        message,
        setMessage,
        isChatOpen,
        openChat,
        closeChat,
        toggleChat,
        initialQuery,
      }}
    >
      {children}
    </LumiContext.Provider>
  );
}

export function useLumi() {
  const context = useContext(LumiContext);
  if (!context) {
    throw new Error("useLumi must be used within a LumiProvider");
  }
  return context;
}
