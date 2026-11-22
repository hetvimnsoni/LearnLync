"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  ChatMessage,
  parseVoiceMessage,
  parseAttachmentMessage,
  parseCallMessage,
  isDeletedForEveryonePayload,
} from "@/types/chat";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { ImageGallery } from "./ImageGallery";
import { FileCard } from "./FileCard";
import { isImageFile } from "@/lib/supabase/chatStorage";
import {
  Check,
  Clock,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Trash2,
  Ban,
  PhoneMissed,
  PhoneCall,
  PhoneOff,
  Phone,
  Video,
} from "lucide-react";

interface MessageItemProps {
  message: ChatMessage;
  peerName: string;
  peerInitial: string;
  onRetry?: (msg: ChatMessage) => void;
  onDeleteRequest?: (msg: ChatMessage) => void;
  onCallPeer?: (callType: "video" | "audio") => void;
}

export function MessageItem({
  message,
  peerName,
  peerInitial,
  onRetry,
  onDeleteRequest,
  onCallPeer,
}: MessageItemProps) {
  const isSelf = message.isSelf;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Check if message is deleted for everyone
  const isDeleted =
    message.isDeletedForEveryone || isDeletedForEveryonePayload(message.text);

  const voiceData = useMemo(() => {
    if (isDeleted) return null;
    return message.voiceData || parseVoiceMessage(message.text);
  }, [message.voiceData, message.text, isDeleted]);

  const attachmentData = useMemo(() => {
    if (isDeleted) return null;
    return message.attachmentData || parseAttachmentMessage(message.text);
  }, [message.attachmentData, message.text, isDeleted]);

  const callData = useMemo(() => {
    if (isDeleted) return null;
    return message.callData || parseCallMessage(message.text);
  }, [message.callData, message.text, isDeleted]);

  const { imageFiles, docFiles } = useMemo(() => {
    if (!attachmentData) return { imageFiles: [], docFiles: [] };
    const images = attachmentData.files.filter((f) => isImageFile(f.type, f.name));
    const docs = attachmentData.files.filter((f) => !isImageFile(f.type, f.name));
    return { imageFiles: images, docFiles: docs };
  }, [attachmentData]);

  const formatTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatCallDateTime = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (isToday) return `Today at ${timeStr}`;
      return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
    } catch {
      return "";
    }
  };

  const formatCallDuration = (secs: number) => {
    if (!secs || secs <= 0) return "0 sec";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m === 0) return `${s} sec`;
    if (s === 0) return `${m} min`;
    return `${m} min ${s} sec`;
  };

  // Render Call Record Card if this message is a call log
  if (callData) {
    const isCallSelf = isSelf;
    const isVideo = callData.callType === "video";
    const isMissed =
      callData.status === "missed" || (callData.status === "no_answer" && !isCallSelf);
    const isCompleted = callData.status === "completed";
    const isDeclined = callData.status === "declined";
    const isUnansweredOut = callData.status === "no_answer" && isCallSelf;

    let title = isVideo ? "Video Call" : "Audio Call";
    if (isMissed) {
      title = isVideo ? "Missed video call" : "Missed audio call";
    } else if (isCompleted) {
      title = isVideo ? "Video call completed" : "Audio call completed";
    } else if (isDeclined) {
      title = isCallSelf
        ? isVideo ? "Video call declined" : "Audio call declined"
        : isVideo ? "Declined video call" : "Declined audio call";
    } else if (isUnansweredOut) {
      title = isVideo ? "Outgoing video call (No answer)" : "Outgoing audio call (No answer)";
    }

    const callTimeStr = formatCallDateTime(callData.timestamp || message.sentTime);
    const durationStr = formatCallDuration(callData.duration);

    return (
      <div className="flex justify-center w-full my-3 px-2">
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xs max-w-sm sm:max-w-md w-full transition-all ${
            isMissed
              ? "bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200"
              : isCompleted
              ? "bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200"
              : "bg-slate-50/90 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
              isMissed
                ? "bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300"
                : isCompleted
                ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300"
                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            {isMissed ? (
              <PhoneMissed className="w-5 h-5" />
            ) : isCompleted ? (
              isVideo ? <Video className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />
            ) : (
              <PhoneOff className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold truncate">{title}</span>
              <span className="text-[11px] font-medium opacity-75 shrink-0">{callTimeStr}</span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-[11px] opacity-75">
                {isCompleted ? durationStr : isMissed ? "No answer" : "Call ended"}
              </span>
              {onCallPeer && (
                <button
                  type="button"
                  onClick={() => onCallPeer(callData.callType)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1.5 ${
                    isMissed
                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs"
                      : "bg-brand-600 hover:bg-brand-700 text-white shadow-2xs"
                  }`}
                >
                  {isVideo ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                  <span>Call back</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isSelf ? "justify-end" : "justify-start"} group relative`}>
      <div
        className={`flex items-end gap-2 max-w-[88%] sm:max-w-[75%] ${
          isSelf ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Peer Avatar Initial (only for incoming messages) */}
        {!isSelf && (
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mb-1 shadow-2xs"
            title={peerName}
          >
            {peerInitial}
          </div>
        )}

        {/* Message Bubble & Three-dot menu trigger */}
        <div className="space-y-1 relative group/bubble">
          {/* Individual Message 3-Dot Action Button */}
          {!isDeleted && onDeleteRequest && message.status !== "sending" && (
            <div
              ref={menuRef}
              className={`absolute top-1 z-20 ${
                isSelf ? "-left-8" : "-right-8"
              } opacity-0 group-hover/bubble:opacity-100 transition-opacity`}
            >
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition"
                title="Message options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* Individual Message Menu Popover */}
              {isMenuOpen && (
                <div
                  className={`absolute top-full mt-1 w-36 bg-white dark:bg-slate-900 rounded-xl p-1 shadow-xl border border-slate-200 dark:border-slate-800 z-30 animate-in fade-in zoom-in-95 duration-100 ${
                    isSelf ? "right-0" : "left-0"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDeleteRequest(message);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition group/btn"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover/btn:scale-105 transition-transform" />
                    <span>Delete Message</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Message Bubble: Deleted Placeholder, Voice, Attachments, or Text */}
          <div
            className={`rounded-2xl text-sm leading-relaxed break-words shadow-2xs ${
              isDeleted
                ? "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60 italic px-3 py-2"
                : isSelf
                ? "bg-blue-600 text-white rounded-br-xs"
                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs"
            } ${
              !isDeleted && voiceData
                ? "p-1"
                : !isDeleted && attachmentData
                ? "p-2 sm:p-2.5 space-y-2"
                : !isDeleted
                ? "px-4 py-2.5 whitespace-pre-wrap"
                : ""
            }`}
          >
            {isDeleted ? (
              <div className="flex items-center gap-2 select-none">
                <Ban className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="text-xs">This message was deleted</span>
              </div>
            ) : voiceData ? (
              <VoiceMessagePlayer
                url={voiceData.url}
                duration={voiceData.duration}
                isSelf={isSelf}
              />
            ) : attachmentData ? (
              <div className="space-y-2">
                {/* Images Grid */}
                {imageFiles.length > 0 && (
                  <ImageGallery files={imageFiles} isSelf={isSelf} />
                )}

                {/* Documents List */}
                {docFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {docFiles.map((doc) => (
                      <FileCard key={doc.id} file={doc} isSelf={isSelf} />
                    ))}
                  </div>
                )}

                {/* Optional Caption */}
                {attachmentData.caption && (
                  <p className="px-1 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal">
                    {attachmentData.caption}
                  </p>
                )}
              </div>
            ) : (
              message.text
            )}
          </div>

          {/* Timestamp and Delivery Status */}
          <div
            className={`flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 px-1 ${
              isSelf ? "justify-end" : "justify-start"
            }`}
          >
            <span>{formatTime(message.sentTime)}</span>

            {isSelf && !isDeleted && (
              <>
                {message.status === "sending" && (
                  <span className="flex items-center gap-0.5 text-amber-500" title="Sending...">
                    <Clock className="w-3 h-3 animate-spin" />
                  </span>
                )}

                {message.status === "sent" && (
                  <span className="flex items-center gap-0.5 text-emerald-500" title="Delivered via Nexconn">
                    <Check className="w-3 h-3" />
                  </span>
                )}

                {message.status === "failed" && (
                  <div className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    <span>Failed</span>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={() => onRetry(message)}
                        className="inline-flex items-center gap-0.5 text-blue-500 hover:text-blue-600 underline font-semibold ml-1"
                        title={message.errorMessage || "Retry sending"}
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
