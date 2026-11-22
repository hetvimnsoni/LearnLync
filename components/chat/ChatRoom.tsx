"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChatPeerInfo,
  ChatMessage,
  formatVoiceMessagePayload,
  formatAttachmentPayload,
  AttachmentFile,
  parseAttachmentMessage,
  parseVoiceMessage,
  parseCallMessage,
} from "@/types/chat";
import { MessageItem } from "./MessageItem";
import { AttachmentMenu } from "./AttachmentMenu";
import { AttachmentPreviewTray, StagedFile } from "./AttachmentPreviewTray";
import { DeleteChatDialog } from "./DeleteChatDialog";
import { DeleteMessageDialog } from "./DeleteMessageDialog";
import { useNexconn } from "@/components/providers/NexconnProvider";
import { useNotification } from "@/components/providers/NotificationProvider";
import { createClient } from "@/lib/supabase/client";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useOneToOneCall } from "@/hooks/useOneToOneCall";
import { IncomingCallDialog } from "@/components/calling/IncomingCallDialog";
import { ActiveCallModal } from "@/components/calling/ActiveCallModal";
import {
  uploadChatFile,
  validateFile,
  isImageFile,
  CHAT_STORAGE_BUCKET,
} from "@/lib/supabase/chatStorage";
import { hideChatForUser, unhideChatForUser } from "@/lib/supabase/hiddenChats";
import {
  deleteMessageForMe,
  deleteMessageForEveryone,
  fetchAllDeletedIds,
} from "@/lib/supabase/messageDeletion";
import {
  fetchSupabaseMessages,
  saveSupabaseMessage,
  subscribeSupabaseMessages,
} from "@/lib/supabase/chatMessages";
import {
  createDirectMessagesQuery,
  loadMessagePage,
  sendDirectTextMessage,
  subscribeDirectMessages,
  mergeAndSortMessages,
  clearDirectChannelUnread,
} from "@/lib/nexconn/chat";
import { MessagesQuery } from "@nexconn/chat";
import {
  ArrowLeft,
  Send,
  Sparkles,
  WifiOff,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Mic,
  Phone,
  Video,
  Trash2,
  Loader2,
  Paperclip,
  MoreVertical,
  GraduationCap,
} from "lucide-react";

interface ChatRoomProps {
  peer: ChatPeerInfo;
  currentUserId: string;
  currentUserName?: string;
  currentUserAvatar?: string | null;
  onBack?: () => void;
  autoStartCall?: "video" | "audio" | null;
}

export function ChatRoom({
  peer,
  currentUserId,
  currentUserName = "You",
  currentUserAvatar = null,
  onBack,
  autoStartCall = null,
}: ChatRoomProps) {
  const router = useRouter();
  const { isConnected, isConnecting, nexconnUserId: currentUserNexconnId, reconnect } = useNexconn();
  const { setActivePeerNexconnId, refreshCounts } = useNotification();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  // Advanced Attachment & Staging State
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Individual Message Deletion State
  const [deletedForMeSet, setDeletedForMeSet] = useState<Set<string>>(new Set());
  const [deletedForEveryoneSet, setDeletedForEveryoneSet] = useState<Set<string>>(new Set());
  const [selectedMessageForDelete, setSelectedMessageForDelete] = useState<ChatMessage | null>(null);
  const [isMessageDeleteDialogOpen, setIsMessageDeleteDialogOpen] = useState(false);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  // Header 3-dot dropdown & Delete Chat State (Whole conversation)
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  // File Input Refs
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const otherFileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);

  // Audio recording hook
  const {
    isRecording,
    recordingTime,
    audioLevels,
    startRecording,
    stopRecording,
    cancelRecording,
    error: recorderError,
  } = useAudioRecorder();

  const handleSendMessageRef = useRef<(text: string, preParsedAttachment?: any) => Promise<void>>((() => {}) as any);

  // One-to-One calling hook (WebRTC + Supabase Realtime signaling)
  const call = useOneToOneCall({
    currentUserId,
    currentUserName,
    currentUserAvatar,
    onCallEvent: (targetPeerId, payload) => {
      if (targetPeerId === peer.id) {
        handleSendMessageRef.current?.(payload);
      }
    },
  });

  // Handle auto-starting a call if requested
  useEffect(() => {
    if (autoStartCall) {
      const timer = setTimeout(() => {
        call.startCall(peer, autoStartCall);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoStartCall]);

  const queryRef = useRef<MessagesQuery | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Check if viewport is near the bottom (within 120px)
  const isNearBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return true;
    const threshold = 120;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Close header 3-dot menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Suppress outside toasts for this active peer while the component is mounted
  useEffect(() => {
    setActivePeerNexconnId(peer.nexconnUserId);
    return () => {
      setActivePeerNexconnId(null);
    };
  }, [peer.nexconnUserId, setActivePeerNexconnId]);

  // Load deleted message IDs (Delete for Me & Delete for Everyone)
  useEffect(() => {
    fetchAllDeletedIds(currentUserId, peer.id).then(({ deletedForMe, deletedForEveryone }) => {
      setDeletedForMeSet(deletedForMe);
      setDeletedForEveryoneSet(deletedForEveryone);
    });
  }, [currentUserId, peer.id]);

  // Realtime listener for message deletions from peer
  useEffect(() => {
    const supabase = createClient();
    const conversationKey = [currentUserId, peer.id].sort().join("_");
    const channel = supabase.channel(`chat_direct_${conversationKey}`);

    channel
      .on("broadcast", { event: "message_deleted_for_everyone" }, ({ payload }: { payload: { messageId?: string } }) => {
        if (typeof payload?.messageId === "string") {
          setDeletedForEveryoneSet((prev) => new Set(prev).add(payload.messageId as string));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.messageId
                ? { ...m, isDeletedForEveryone: true, text: "🚫 This message was deleted" }
                : m
            )
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, peer.id]);

  // 1. Initialize message history query and load first page from Nexconn + Supabase
  useEffect(() => {
    let isMounted = true;
    setIsLoadingHistory(true);
    setHistoryError(null);
    setMessages([]);

    const activeNexconnUserId = currentUserNexconnId || currentUserId.replace(/-/g, "").toLowerCase();

    // Create fresh query cursor for this peer
    const query = createDirectMessagesQuery(peer.nexconnUserId, 20);
    queryRef.current = query;

    // Fetch from both Nexconn and Supabase in parallel
    Promise.allSettled([
      loadMessagePage(query, activeNexconnUserId),
      fetchSupabaseMessages(currentUserId, peer.id, activeNexconnUserId),
    ]).then(([nexconnRes, supabaseRes]) => {
      if (!isMounted) return;
      setIsLoadingHistory(false);

      const nexconnLoaded =
        nexconnRes.status === "fulfilled" && !nexconnRes.value.error
          ? nexconnRes.value.messages
          : [];
      const supabaseLoaded =
        supabaseRes.status === "fulfilled" ? supabaseRes.value : [];

      const combined = mergeAndSortMessages(supabaseLoaded, nexconnLoaded);
      setMessages(combined);

      if (nexconnRes.status === "fulfilled") {
        setHasMore(nexconnRes.value.hasNext);
        if (nexconnRes.value.error && combined.length === 0) {
          setHistoryError(nexconnRes.value.error);
        }
      }

      setTimeout(() => scrollToBottom(false), 100);

      clearDirectChannelUnread(peer.nexconnUserId).then(() => {
        refreshCounts();
      });
    });

    return () => {
      isMounted = false;
    };
  }, [peer.nexconnUserId, peer.id, currentUserNexconnId, currentUserId, scrollToBottom, refreshCounts]);

  // 2. Real-time message listener with strict deduplication (Nexconn + Supabase Realtime)
  useEffect(() => {
    const activeNexconnUserId = currentUserNexconnId || currentUserId.replace(/-/g, "").toLowerCase();

    const handleIncomingMessage = (incomingMsg: ChatMessage) => {
      const wasNearBottom = isNearBottom();

      setMessages((prev) => mergeAndSortMessages(prev, [incomingMsg]));

      clearDirectChannelUnread(peer.nexconnUserId).then(() => {
        refreshCounts();
      });

      if (wasNearBottom || incomingMsg.isSelf) {
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    // 2a. Nexconn subscription
    const unsubscribeNexconn = subscribeDirectMessages(
      peer.nexconnUserId,
      activeNexconnUserId,
      handleIncomingMessage
    );

    // 2b. Supabase Realtime direct channel subscription
    const unsubscribeSupabase = subscribeSupabaseMessages(
      currentUserId,
      peer.id,
      activeNexconnUserId,
      handleIncomingMessage
    );

    return () => {
      unsubscribeNexconn();
      unsubscribeSupabase();
    };
  }, [peer.nexconnUserId, peer.id, currentUserNexconnId, currentUserId, scrollToBottom, isNearBottom, refreshCounts]);

  // 3. Load older historical messages (pagination)
  const handleLoadEarlier = async () => {
    if (!queryRef.current || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const activeNexconnUserId = currentUserNexconnId || currentUserId.replace(/-/g, "").toLowerCase();

    const container = chatContainerRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;

    const { messages: olderMessages, hasNext, error } = await loadMessagePage(
      queryRef.current,
      activeNexconnUserId
    );

    setIsLoadingMore(false);
    if (!error && olderMessages.length > 0) {
      setMessages((prev) => mergeAndSortMessages(prev, olderMessages));
      setHasMore(hasNext);

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - previousScrollHeight;
        }
      });
    } else if (error) {
      setHistoryError(error);
    }
  };

  // 4. Send message handler with optimistic update
  const handleSendMessage = async (textToSend: string, preParsedAttachment?: any) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const activeNexconnUserId = currentUserNexconnId || currentUserId.replace(/-/g, "").toLowerCase();
    const isCallMsg = trimmed.includes('"type":"call"') || trimmed.includes('"type": "call"');

    if (!isConnected && !isCallMsg) {
      setSendError("Cannot send message: Real-time chat is currently offline. Please reconnect.");
      return;
    }

    setSendError(null);
    setInputText("");

    // Create optimistic message entry with instant attachment / call preview
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      tempId,
      senderUserId: activeNexconnUserId,
      text: trimmed,
      sentTime: Date.now(),
      status: "sending",
      isSelf: true,
      attachmentData: preParsedAttachment || parseAttachmentMessage(trimmed) || undefined,
      voiceData: parseVoiceMessage(trimmed) || undefined,
      callData: parseCallMessage(trimmed) || undefined,
    };

    setMessages((prev) => mergeAndSortMessages(prev, [optimisticMsg]));
    setTimeout(() => scrollToBottom(true), 50);

    // Auto unhide conversation when user sends a message
    unhideChatForUser(currentUserId, peer.id).catch(() => {});

    // Save to Supabase chat_messages table and broadcast via Realtime
    const supabaseSavePromise = saveSupabaseMessage({
      id: tempId,
      senderId: currentUserId,
      receiverId: peer.id,
      text: trimmed,
    });

    // Dispatch to Nexconn if connected
    let nexconnSuccess = false;
    let nexconnMsg: ChatMessage | null = null;
    let nexconnError = "";

    if (isConnected) {
      const result = await sendDirectTextMessage(
        peer.nexconnUserId,
        trimmed,
        activeNexconnUserId,
        tempId
      );
      nexconnSuccess = result.success;
      nexconnMsg = result.message || null;
      nexconnError = result.error || "";
    }

    const supabaseOk = await supabaseSavePromise.catch(() => false);

    if (nexconnSuccess && nexconnMsg) {
      setMessages((prev) => mergeAndSortMessages(prev, [nexconnMsg!]));
    } else if (supabaseOk) {
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: "sent" } : m))
      );
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId
            ? { ...m, status: "failed", errorMessage: nexconnError || "Failed to deliver" }
            : m
        )
      );
      setSendError(nexconnError || "Message delivery failed.");
    }
  };

  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  });

  // 5. Retry a failed message
  const handleRetryMessage = (failedMsg: ChatMessage) => {
    setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    handleSendMessage(failedMsg.text);
  };

  // 6. Send recorded voice message
  const handleSendVoiceMessage = async () => {
    const duration = recordingTime;
    const blob = await stopRecording();
    if (!blob || blob.size === 0) return;

    setIsUploadingVoice(true);
    try {
      const supabase = createClient();
      const fileName = `${currentUserId}/voice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from(CHAT_STORAGE_BUCKET)
        .upload(fileName, blob, {
          contentType: blob.type || "audio/webm",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Generate short-lived signed URL (2 hours) for private bucket access
      let audioUrl = "";
      const { data: signedData } = await supabase.storage
        .from(CHAT_STORAGE_BUCKET)
        .createSignedUrl(fileName, 60 * 60 * 2);

      if (signedData?.signedUrl) {
        audioUrl = signedData.signedUrl;
      } else {
        const { data: pubData } = supabase.storage.from(CHAT_STORAGE_BUCKET).getPublicUrl(fileName);
        audioUrl = pubData.publicUrl;
      }

      // Record metadata in chat_attachments table for recipient access before dispatching message
      try {
        await supabase.from("chat_attachments").insert({
          sender_id: currentUserId,
          receiver_id: peer.id,
          file_name: `Voice note (${duration}s)`,
          file_type: blob.type || "audio/webm",
          file_size: blob.size,
          storage_path: fileName,
          public_url: audioUrl,
        });
      } catch (metaErr) {
        console.warn("Could not record voice attachment metadata:", metaErr);
      }

      const payload = formatVoiceMessagePayload(audioUrl, duration, blob.type, fileName);
      await handleSendMessage(payload);
    } catch (err: any) {
      console.error("Voice message upload error:", err);
      setSendError(err?.message || "Failed to upload voice message. Ensure 'chat-attachments' bucket exists.");
    } finally {
      setIsUploadingVoice(false);
    }
  };

  // 7. Handle File Selection for Staging
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newStaged: StagedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const validation = validateFile(f);
      if (!validation.valid) {
        setSendError(validation.error || `File ${f.name} is invalid.`);
        continue;
      }

      const isImg = isImageFile(f.type, f.name);
      newStaged.push({
        file: f,
        previewUrl: isImg ? URL.createObjectURL(f) : undefined,
        isImage: isImg,
      });
    }

    if (newStaged.length > 0) {
      setStagedFiles((prev) => [...prev, ...newStaged]);
      setSendError(null);
    }
  };

  // 8. Remove Staged File
  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles((prev) => {
      const removed = prev[index];
      if (removed && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  // 9. Cancel Active Upload
  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploadingAttachment(false);
    setUploadProgress(0);
  };

  // 10. Upload & Send Staged Attachments
  const handleSendAttachments = async () => {
    if (stagedFiles.length === 0) return;

    setIsUploadingAttachment(true);
    setUploadProgress(10);
    setSendError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const uploadedFiles: AttachmentFile[] = [];
      const totalFiles = stagedFiles.length;

      for (let i = 0; i < stagedFiles.length; i++) {
        if (controller.signal.aborted) break;

        const staged = stagedFiles[i];
        const uploaded = await uploadChatFile(
          staged.file,
          currentUserId,
          peer.id,
          (percent) => {
            const overall = ((i + percent / 100) / totalFiles) * 100;
            setUploadProgress(Math.min(95, overall));
          },
          controller.signal
        );

        uploadedFiles.push(uploaded);
      }

      if (uploadedFiles.length > 0) {
        setUploadProgress(100);
        const caption = inputText.trim() || undefined;
        const payload = formatAttachmentPayload(uploadedFiles, caption);

        // Pre-parse attachment data for immediate optimistic rendering
        const preParsed = {
          type: "attachment" as const,
          files: uploadedFiles,
          caption,
        };

        // Clean up staged preview URLs
        stagedFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setStagedFiles([]);
        setInputText("");

        await handleSendMessage(payload, preParsed);
      }
    } catch (err: any) {
      if (err.name !== "AbortError" && err.message !== "Upload cancelled") {
        console.error("Attachment upload error:", err);
        setSendError(err?.message || "Failed to upload attachments. Please check connection and try again.");
      }
    } finally {
      setIsUploadingAttachment(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  };

  // 11. Handle INDIVIDUAL Message Deletion ("Delete for Me")
  const handleConfirmDeleteMessageForMe = async () => {
    if (!selectedMessageForDelete) return;
    const msgId = selectedMessageForDelete.id;

    // Optimistically update set immediately
    setDeletedForMeSet((prev) => new Set(prev).add(msgId));
    setIsMessageDeleteDialogOpen(false);
    setSelectedMessageForDelete(null);

    await deleteMessageForMe(currentUserId, msgId);
  };

  // 12. Handle INDIVIDUAL Message Deletion ("Delete for Everyone")
  const handleConfirmDeleteMessageForEveryone = async () => {
    if (!selectedMessageForDelete) return;
    const msgId = selectedMessageForDelete.id;

    // Optimistically update state immediately
    setDeletedForEveryoneSet((prev) => new Set(prev).add(msgId));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, isDeletedForEveryone: true, text: "🚫 This message was deleted" }
          : m
      )
    );
    setIsMessageDeleteDialogOpen(false);
    setSelectedMessageForDelete(null);

    await deleteMessageForEveryone(currentUserId, peer.id, msgId);
  };

  // 13. Handle Conversation-Level Deletion ("Delete Chat")
  const handleConfirmDeleteChat = async () => {
    setIsDeletingChat(true);
    await hideChatForUser(currentUserId, peer.id);
    setIsDeletingChat(false);
    setIsDeleteDialogOpen(false);
    router.push("/chat");
  };

  // 14. Handle keyboard shortcut (Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (stagedFiles.length > 0) {
        handleSendAttachments();
      } else {
        handleSendMessage(inputText);
      }
    }
  };

  const peerInitial = (peer.fullName || peer.username || "L").charAt(0).toUpperCase();

  // Filter out messages that were deleted for me
  const visibleMessages = messages.filter((m) => !deletedForMeSet.has(m.id));

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-brand-500/10 overflow-hidden">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = "";
        }}
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = "";
        }}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.csv"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={otherFileInputRef}
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = "";
        }}
        multiple
        className="hidden"
      />

      {/* Chat Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="p-2 sm:p-2.5 rounded-2xl text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition md:hidden shrink-0"
              title="Back to conversation list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link
              href="/chat"
              className="p-2 sm:p-2.5 rounded-2xl text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition md:hidden shrink-0"
              title="Back to Messages"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}

          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {peer.avatarUrl ? (
              <img
                src={peer.avatarUrl}
                alt={peer.fullName}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 shrink-0">
                {peerInitial}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-base leading-tight truncate">
                  {peer.fullName}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 text-accent-amber" />
                  <span>Peer</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500">
                <span className="font-mono truncate">@{peer.username}</span>
                <span className="hidden xs:inline text-slate-300 dark:text-slate-700">•</span>
                <span className="hidden xs:inline text-[11px] text-brand-600 dark:text-brand-400 font-medium truncate">
                  Direct Chat
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Audio Call, Video Call, Connection Status, and 3-dot Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Audio Call Trigger */}
          <button
            type="button"
            onClick={() => call.startCall(peer, "audio")}
            className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 text-xs font-bold transition shadow-xs hover:scale-105 active:scale-95"
            title={`Start audio call with ${peer.fullName}`}
          >
            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">Audio</span>
          </button>

          {/* Video Call Trigger */}
          <button
            type="button"
            onClick={() => call.startCall(peer, "video")}
            className="inline-flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/25 hover:scale-105 active:scale-95"
            title={`Start video call with ${peer.fullName}`}
          >
            <Video className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Video Call</span>
          </button>

          {/* Connection status badge */}
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Nexconn Live</span>
            </span>
          ) : isConnecting ? (
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Connecting...</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => reconnect()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 transition"
              title="Click to reconnect"
            >
              <WifiOff className="w-3 h-3 text-red-500" />
              <span>Offline (Reconnect)</span>
            </button>
          )}

          {/* Conversation 3-Dot More Menu */}
          <div ref={headerMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsHeaderMenuOpen((prev) => !prev)}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Conversation options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isHeaderMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-2xl border border-slate-200 dark:border-slate-800 z-30 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition group"
                >
                  <Trash2 className="w-4 h-4 text-red-500 group-hover:scale-105 transition-transform" />
                  <span>Delete Chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disconnected / Reconnecting Notification Banner */}
      {!isConnected && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              {isConnecting
                ? "Connecting to real-time chat..."
                : "Real-time chat is disconnected. Messages cannot be sent until reconnected."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => reconnect()}
            disabled={isConnecting}
            className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 font-semibold hover:bg-amber-200 transition text-[11px]"
          >
            Reconnect Now
          </button>
        </div>
      )}

      {/* Message History & Stream Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50"
      >
        {/* Load Earlier Messages Button */}
        {hasMore && (
          <div className="text-center py-2">
            <button
              type="button"
              onClick={handleLoadEarlier}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingMore ? "animate-spin" : ""}`} />
              <span>{isLoadingMore ? "Loading earlier..." : "Load earlier messages"}</span>
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoadingHistory && (
          <div className="space-y-4 animate-pulse">
            <div className="flex justify-start">
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/2" />
            </div>
            <div className="flex justify-end">
              <div className="h-12 bg-blue-100 dark:bg-blue-950/60 rounded-2xl w-2/5" />
            </div>
            <div className="flex justify-start">
              <div className="h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl w-3/5" />
            </div>
          </div>
        )}

        {/* History Error Banner */}
        {historyError && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Failed to load message history</p>
              <p className="text-[11px] opacity-90">{historyError}</p>
            </div>
          </div>
        )}

        {/* Empty Conversation Icebreaker State */}
        {!isLoadingHistory && visibleMessages.length === 0 && (
          <div className="max-w-md mx-auto my-8 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Start a conversation with {peer.fullName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Send a direct message over Nexconn to discuss skill exchanges and schedule peer learning sessions.
              </p>
            </div>

            {/* Skills Context */}
            <div className="text-left text-xs bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Skills they teach:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {peer.skillsOffered.length > 0 ? (
                  peer.skillsOffered.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">None listed</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Individual Message Bubbles */}
        {visibleMessages.map((msg) => {
          const isEveryoneDeleted =
            deletedForEveryoneSet.has(msg.id) || msg.isDeletedForEveryone;

          return (
            <MessageItem
              key={msg.id}
              message={{
                ...msg,
                isDeletedForEveryone: isEveryoneDeleted,
              }}
              peerName={peer.fullName}
              peerInitial={peerInitial}
              onRetry={handleRetryMessage}
              onDeleteRequest={(targetMsg) => {
                setSelectedMessageForDelete(targetMsg);
                setIsMessageDeleteDialogOpen(true);
              }}
              onCallPeer={(type) => call.startCall(peer, type)}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Send Error Notice */}
      {sendError && (
        <div className="px-5 py-2 bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{sendError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSendError(null)}
            className="text-red-600 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Staged Attachment Preview Tray */}
      <AttachmentPreviewTray
        files={stagedFiles}
        onRemove={handleRemoveStagedFile}
        isUploading={isUploadingAttachment}
        uploadProgress={uploadProgress}
        onCancelUpload={handleCancelUpload}
      />

      {/* Message Composer Footer */}
      <div className="p-2.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
        {isRecording ? (
          <div className="flex items-center gap-2 sm:gap-3 p-2 bg-red-50/80 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 rounded-2xl animate-in fade-in duration-200">
            {/* Blinking indicator & timer */}
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="font-mono text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">
                {Math.floor(recordingTime / 60)}:
                {(recordingTime % 60) < 10 ? "0" : ""}
                {recordingTime % 60}
              </span>
            </div>

            {/* Live Audio Visualizer Bars */}
            <div className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 h-8">
              {audioLevels.map((lvl, idx) => (
                <span
                  key={idx}
                  style={{ height: `${Math.max(15, lvl * 100)}%` }}
                  className="w-1 bg-red-500/80 dark:bg-red-400 rounded-full transition-all duration-75"
                />
              ))}
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 sm:p-3 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition"
              title="Cancel recording"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Stop & Send Button */}
            <button
              type="button"
              onClick={handleSendVoiceMessage}
              disabled={isUploadingVoice}
              className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-500/25 transition disabled:opacity-50 shrink-0"
              title="Send voice note"
            >
              {isUploadingVoice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (stagedFiles.length > 0) {
                handleSendAttachments();
              } else {
                handleSendMessage(inputText);
              }
            }}
            className="flex items-end gap-2 sm:gap-2.5 relative"
          >
            {/* Attachment Button & Popover Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAttachmentMenuOpen((prev) => !prev)}
                disabled={!isConnected || isUploadingAttachment}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 transition shadow-2xs shrink-0 disabled:opacity-60"
                title="Attach photos or documents"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <AttachmentMenu
                isOpen={isAttachmentMenuOpen}
                onClose={() => setIsAttachmentMenuOpen(false)}
                onSelectPhotos={() => imageInputRef.current?.click()}
                onSelectDocuments={() => docInputRef.current?.click()}
                onSelectOtherFiles={() => otherFileInputRef.current?.click()}
              />
            </div>

            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isConnected || isUploadingAttachment}
                placeholder={
                  !isConnected
                    ? "Connecting to real-time chat..."
                    : stagedFiles.length > 0
                    ? "Add a caption (optional)..."
                    : `Message ${peer.fullName}...`
                }
                maxLength={2000}
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-base sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition resize-none disabled:opacity-60"
              />
              {inputText.length > 1500 && (
                <span className="absolute right-3 bottom-2 text-[10px] text-slate-400 font-mono">
                  {inputText.length}/2000
                </span>
              )}
            </div>

            {/* Send / Mic Button */}
            {stagedFiles.length > 0 ? (
              <button
                type="submit"
                disabled={!isConnected || isUploadingAttachment}
                className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 transition disabled:opacity-50 shrink-0"
                title="Send attachments"
              >
                {isUploadingAttachment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            ) : inputText.trim() ? (
              <button
                type="submit"
                disabled={!isConnected}
                className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 transition disabled:opacity-50 shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={!isConnected || isUploadingVoice || isUploadingAttachment}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition shadow-2xs shrink-0"
                title="Record voice message"
              >
                {isUploadingVoice ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}
          </form>
        )}
      </div>

      {/* INDIVIDUAL Message Deletion Confirmation Dialog */}
      <DeleteMessageDialog
        isOpen={isMessageDeleteDialogOpen}
        message={selectedMessageForDelete}
        isSelf={selectedMessageForDelete?.isSelf ?? false}
        isDeleting={isDeletingMessage}
        onDeleteForMe={handleConfirmDeleteMessageForMe}
        onDeleteForEveryone={handleConfirmDeleteMessageForEveryone}
        onCancel={() => {
          setIsMessageDeleteDialogOpen(false);
          setSelectedMessageForDelete(null);
        }}
      />

      {/* CONVERSATION Deletion Confirmation Dialog */}
      <DeleteChatDialog
        isOpen={isDeleteDialogOpen}
        peerName={peer.fullName}
        isDeleting={isDeletingChat}
        onConfirm={handleConfirmDeleteChat}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      {/* 1-on-1 Audio/Video Call Overlays */}
      <IncomingCallDialog
        caller={call.activePeerInfo}
        onAccept={call.acceptCall}
        onDecline={call.declineCall}
      />

      <ActiveCallModal
        callStatus={call.callStatus}
        callType={call.callType}
        peerInfo={call.activePeerInfo}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        isMicMuted={call.isMicMuted}
        isCameraOff={call.isCameraOff}
        isScreenSharing={call.isScreenSharing}
        callDuration={call.callDuration}
        onToggleMic={call.toggleMic}
        onToggleCamera={call.toggleCamera}
        onToggleScreenShare={call.toggleScreenShare}
        onEndCall={call.endCall}
      />
    </div>
  );
}
