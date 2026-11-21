"use client";

import React, { useState, useRef, useEffect } from "react";
import { sendAIChatMessage } from "@/lib/ai/chat";
import { AIChatMessage } from "@/types/ai";
import { LumiCharacter } from "@/components/mascot/LumiCharacter";
import { useLumi } from "@/components/mascot/LumiContext";
import {
  Send,
  Sparkles,
  Bot,
  User,
  BookOpen,
  HelpCircle,
  Compass,
  FileCheck,
  BarChart2,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  Target,
  Mic,
  MicOff,
  FileText,
} from "lucide-react";

interface UnifiedAIChatProps {
  onSelectFeatureTab?: (tab: string, initialPrompt?: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Compass,
    label: "Find Python Teacher",
    text: "Find someone who can teach me Python.",
    tab: "peers",
  },
  {
    icon: Target,
    label: "AI Engineer Roadmap",
    text: "What skills should I learn to become an AI engineer?",
    tab: "courses",
  },
  {
    icon: Lightbulb,
    label: "Explain Machine Learning",
    text: "Explain machine learning in simple words.",
    tab: "chat",
  },
  {
    icon: FileCheck,
    label: "HTML & CSS Quiz",
    text: "Create a quiz on HTML and CSS.",
    tab: "quiz",
  },
  {
    icon: BookOpen,
    label: "Web Dev Roadmap",
    text: "Create a roadmap for becoming a web developer.",
    tab: "roadmap",
  },
  {
    icon: BarChart2,
    label: "Analyze Skill Gaps",
    text: "Analyze my skill gaps.",
    tab: "skillgap",
  },
  {
    icon: HelpCircle,
    label: "Prepare Teaching Session",
    text: "Help me prepare for my next teaching session.",
    tab: "requests",
  },
];

export function UnifiedAIChat({ onSelectFeatureTab }: UnifiedAIChatProps) {
  const { mode: lumiMode, triggerMode: triggerLumi } = useLumi();
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; followUps?: string[] }>
  >([
    {
      role: "assistant",
      content:
        "Hey! What would you like to learn today? I am Lumi, your LearnLync AI Companion. You can ask me to solve doubts, recommend peer teachers, generate personalized roadmaps, or create practice quizzes!",
      followUps: [
        "Explain machine learning in simple words",
        "Find someone who can teach me Python",
        "Create a roadmap for becoming a web developer",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"doubt_solver" | "study_buddy">("doubt_solver");
  const [userLevel, setUserLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Greet user when chatbot loads
  useEffect(() => {
    triggerLumi("greeting", 3500);
  }, [triggerLumi]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isTyping) return;

    // Check if the prompt directly targets a dedicated tab
    const matchedStarter = STARTER_PROMPTS.find(
      (p) => p.text.toLowerCase() === textToSend.toLowerCase()
    );
    if (matchedStarter && onSelectFeatureTab && matchedStarter.tab !== "chat") {
      onSelectFeatureTab(matchedStarter.tab, textToSend);
      return;
    }

    setInput("");
    const newHistory = [...messages, { role: "user" as const, content: textToSend }];
    setMessages(newHistory);
    setIsTyping(true);

    // Lumi enters Thinking Mode
    triggerLumi("thinking");

    try {
      const res = await sendAIChatMessage({
        message: textToSend,
        mode,
        userLevel,
        conversationId,
        history: messages.slice(-6),
      });

      if (res.conversationId) setConversationId(res.conversationId);

      // Lumi transitions smoothly from thinking to explaining mode!
      triggerLumi("explaining", 6000);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.message || res.error || "Sorry, I could not complete your request.",
          followUps: res.suggestedFollowUps,
        },
      ]);
    } catch (err: any) {
      triggerLumi("idle");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue. Please make sure your Gemini API key is configured.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleToggleVoice = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      triggerLumi("idle");
    } else {
      setIsListeningVoice(true);
      triggerLumi("listening", 8000);

      const SpeechRecognition =
        typeof window !== "undefined"
          ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = "en-US";
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListeningVoice(false);
            triggerLumi("idle");
          };
          recognition.onerror = () => {
            setIsListeningVoice(false);
            triggerLumi("idle");
          };
          recognition.onend = () => {
            setIsListeningVoice(false);
          };
          recognition.start();
        } catch {
          setIsListeningVoice(false);
        }
      } else {
        setTimeout(() => {
          setIsListeningVoice(false);
          triggerLumi("idle");
        }, 4000);
      }
    }
  };

  const handleAnalyzeNotes = () => {
    triggerLumi("reading", 6000);
    setInput(
      "Please analyze my study notes and explain the core concepts step-by-step: "
    );
  };

  return (
    <div className="flex flex-col h-[700px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Header featuring Lumi 3D Mascot & Mode Switcher */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <LumiCharacter
              size="sm"
              mode={lumiMode}
              interactive={true}
              onHover={() => triggerLumi("greeting", 2500)}
            />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Meet Lumi</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                LearnLync Companion
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === "doubt_solver"
                ? "Doubt-Solving Assistant • Step-by-step guidance & conceptual breakdowns"
                : "Study Buddy • Revision activities, testing & alternate explanations"}
            </p>
          </div>
        </div>

        {/* Mode Selector & Knowledge Level */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode("doubt_solver")}
              className={`px-3 py-1.5 rounded-lg transition ${
                mode === "doubt_solver"
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Doubt Solver
            </button>
            <button
              type="button"
              onClick={() => setMode("study_buddy")}
              className={`px-3 py-1.5 rounded-lg transition ${
                mode === "study_buddy"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Study Buddy
            </button>
          </div>

          <select
            value={userLevel}
            onChange={(e) => setUserLevel(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Messages Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in`}
            >
              {!isUser && (
                <div className="shrink-0 -mt-1">
                  <LumiCharacter
                    size="xs"
                    mode={isTyping && idx === messages.length - 1 ? "thinking" : "idle"}
                    interactive={false}
                  />
                </div>
              )}

              <div className={`space-y-2 max-w-[85%] sm:max-w-[75%]`}>
                <div
                  className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-xs shadow-md"
                      : "bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/70 dark:border-slate-700/60"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>

                {/* Follow-up suggestions */}
                {!isUser && m.followUps && m.followUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.followUps.map((f, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        onClick={() => handleSend(f)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-300 border border-slate-200 dark:border-slate-700 hover:border-brand-300 transition shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-accent-amber" />
                        <span>{f}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
            <span>Lumi is formulating an answer...</span>
          </div>
        )}
      </div>

      {/* Starter Prompts Carousel / Pills */}
      {messages.length <= 2 && (
        <div className="p-3 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Suggested Prompts
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {STARTER_PROMPTS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(p.text)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition shrink-0 shadow-2xs"
                >
                  <Icon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Analyze Notes / Reading Mode Button */}
          <button
            type="button"
            onClick={handleAnalyzeNotes}
            title="Analyze Notes / Document (Reading Mode)"
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition shadow-2xs shrink-0"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Voice Input / Listening Mode Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            title={isListeningVoice ? "Listening to your voice..." : "Voice Input (Listening Mode)"}
            className={`p-3 rounded-2xl border transition shadow-2xs shrink-0 ${
              isListeningVoice
                ? "border-purple-500 bg-purple-600 text-white animate-pulse"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50"
            }`}
          >
            {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "doubt_solver"
                ? "Ask a doubt or paste code (e.g. 'How does async/await work in JavaScript?')"
                : "Tell Lumi what you want to revise or practice..."
            }
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs sm:text-sm hover:from-brand-500 hover:to-indigo-500 transition shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
