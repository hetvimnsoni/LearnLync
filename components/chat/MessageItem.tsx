"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  ChatMessage,
  parseVoiceMessage,
  parseAttachmentMessage,
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
} from "lucide-react";

interface MessageItemProps {
  message: ChatMessage;
  peerName: string;
  peerInitial: string;
  onRetry?: (msg: ChatMessage) => void;
  onDeleteRequest?: (msg: ChatMessage) => void;
}

export function MessageItem({
  message,
  peerName,
  peerInitial,
  onRetry,
  onDeleteRequest,
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
