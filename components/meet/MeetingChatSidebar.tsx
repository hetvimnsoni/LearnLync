"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, Users, MessageSquare, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { MeetingMessage, MeetingPresenceState } from "@/types/meeting";
import { createClient } from "@/lib/supabase/client";

interface MeetingChatSidebarProps {
  roomCode: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
  isOpen: boolean;
  activeTab: "chat" | "people";
  participants: MeetingPresenceState[];
  onClose: () => void;
  onTabChange: (tab: "chat" | "people") => void;
  onNewMessageAlert: () => void;
}

export function MeetingChatSidebar({
  roomCode,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isOpen,
  activeTab,
  participants,
  onClose,
  onTabChange,
  onNewMessageAlert,
}: MeetingChatSidebarProps) {
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const supabase = useRef(createClient()).current;

  // Realtime subscription for In-Meeting Chat Messages
  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase
      .channel(`meet_chat_${roomCode}`)
      .on("broadcast", { event: "new_chat_message" }, (payload: any) => {
        const msg = payload.payload as MeetingMessage;
        if (!msg) return;

        setMessages((prev) => [...prev, { ...msg, is_self: msg.sender_id === currentUserId }]);

        if (msg.sender_id !== currentUserId) {
          onNewMessageAlert();
        }

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, currentUserId, onNewMessageAlert, supabase]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newMsg: MeetingMessage = {
      id: `mmsg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      room_id: roomCode,
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_avatar: currentUserAvatar,
      content: trimmed,
      created_at: new Date().toISOString(),
      is_self: true,
    };

    // Optimistically update local message list
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Broadcast message to everyone in the meeting room
    const channel = supabase.channel(`meet_chat_${roomCode}`);
    channel.send({
      type: "broadcast",
      event: "new_chat_message",
      payload: newMsg,
    });

    // Also persist asynchronously to database if meeting_messages table exists
    supabase
      .from("meeting_messages")
      .insert({
        room_id: roomCode,
        sender_id: currentUserId,
        content: trimmed,
      })
      .then(
        () => {},
        () => {}
      );

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-full sm:w-80 md:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-30 shadow-2xl shrink-0">
      {/* Top Header & Tabs */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {/* Tab switchers */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onTabChange("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === "chat"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>In-call Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("people")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === "people"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>People ({participants.length})</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Chat View */}
      {activeTab === "chat" ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 opacity-40" />
                <p className="text-xs leading-relaxed">
                  Messages can only be seen by people in the call and are deleted when the call ends.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {m.is_self ? "You" : m.sender_name}
                    </span>
                    <span className="text-[10px]">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-800 text-slate-100 text-xs leading-relaxed break-words">
                    {m.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send a message to everyone..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition shadow-sm"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* Body: People Roster */
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          {participants.map((p) => (
            <div
              key={p.userId}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-800 text-xs text-white"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    p.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="truncate font-medium">
                  {p.userId === currentUserId ? `${p.name} (You)` : p.name}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                {p.isAudioMuted ? (
                  <span title="Muted">
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                  </span>
                ) : (
                  <span title="Audio on">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                )}
                {p.isVideoMuted ? (
                  <span title="Camera off">
                    <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                ) : (
                  <span title="Camera on">
                    <Video className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
