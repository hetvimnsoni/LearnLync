"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Users,
  Sparkles,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  ArrowLeftRight,
  RotateCcw,
  X,
  Check,
  GraduationCap,
  MessageCircle,
  Clock,
  ArrowRight,
  Video,
  Phone,
} from "lucide-react";
import { PeerProfile } from "@/types/learner";
import { ChatPeerInfo } from "@/types/chat";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { DeleteChatDialog } from "@/components/chat/DeleteChatDialog";
import { useNexconn } from "@/components/providers/NexconnProvider";
import { fetchUnreadChannelsMap } from "@/lib/nexconn/chat";
import { toNexconnUserId } from "@/lib/nexconn/identity";
import { FluidAtmosphere } from "@/components/3d/FluidAtmosphere";
import {
  getLocalHiddenPeerIds,
  fetchHiddenPeerIds,
  hideChatForUser,
  unhideChatForUser,
  unhideAllChatsForUser,
} from "@/lib/supabase/hiddenChats";

interface ChatWorkspaceProps {
  currentUserId: string;
  currentUserName?: string;
  currentUserAvatar?: string | null;
  initialPeers: PeerProfile[];
  allLearners: PeerProfile[];
  initialActivePeerId?: string | null;
}

export function ChatWorkspace({
  currentUserId,
  currentUserName = "Learner",
  currentUserAvatar = null,
  initialPeers,
  allLearners,
  initialActivePeerId = null,
}: ChatWorkspaceProps) {
  const router = useRouter();
  const { isConnected } = useNexconn();

  // Pending auto-initiated call ("video" | "audio" | null)
  const [pendingAutoCall, setPendingAutoCall] = useState<"video" | "audio" | null>(null);

  // Active hidden peers set
  const [hiddenSet, setHiddenSet] = useState<Set<string>>(() =>
    getLocalHiddenPeerIds(currentUserId)
  );

  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Currently selected active peer ID for the chat room
  const [activePeerId, setActivePeerId] = useState<string | null>(() => {
    if (initialActivePeerId) return initialActivePeerId;
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      const unhidden = initialPeers.filter((p) => !hiddenSet.has(p.id));
      return unhidden.length > 0 ? unhidden[0].id : null;
    }
    return null;
  });

  // On desktop screens, auto-select first conversation if none selected
  useEffect(() => {
    if (!initialActivePeerId && activePeerId === null && typeof window !== "undefined" && window.innerWidth >= 768) {
      const unhidden = conversationPeers.filter((p) => !hiddenSet.has(p.id));
      if (unhidden.length > 0) {
        setActivePeerId(unhidden[0].id);
      }
    }
  }, [initialActivePeerId]);

  // Dynamic peer conversations list (combining initial peers + any newly initiated chats)
  const [conversationPeers, setConversationPeers] = useState<PeerProfile[]>(initialPeers);

  // Unread counts map: peerNexconnId -> count
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  // 3-dot menu state for conversation deletion
  const [activeMenuPeerId, setActiveMenuPeerId] = useState<string | null>(null);
  const [selectedPeerForDelete, setSelectedPeerForDelete] = useState<PeerProfile | null>(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  // New Chat Modal state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");

  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync hidden chats from Supabase
  useEffect(() => {
    fetchHiddenPeerIds(currentUserId).then((fetched) => {
      setHiddenSet(new Set(fetched));
    });
  }, [currentUserId]);

  // Fetch unread channels map
  useEffect(() => {
    if (isConnected) {
      fetchUnreadChannelsMap().then((map) => {
        setUnreadMap(map);
      });
    }
  }, [isConnected]);

  // Close 3-dot dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenuPeerId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter visible conversation peers (excluding hidden and applying search)
  const visiblePeers = useMemo(() => {
    return conversationPeers.filter((peer) => {
      if (hiddenSet.has(peer.id)) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (peer.full_name || "").toLowerCase().includes(q);
      const userMatch = (peer.username || "").toLowerCase().includes(q);
      const skillsMatch =
        (peer.skills_offered || []).some((s) => s.toLowerCase().includes(q)) ||
        (peer.skills_needed || []).some((s) => s.toLowerCase().includes(q));

      return nameMatch || userMatch || skillsMatch;
    });
  }, [conversationPeers, hiddenSet, searchQuery]);

  // Find active peer profile object
  const activePeer = useMemo(() => {
    if (!activePeerId) return null;
    return (
      conversationPeers.find((p) => p.id === activePeerId) ||
      allLearners.find((p) => p.id === activePeerId) ||
      null
    );
  }, [activePeerId, conversationPeers, allLearners]);

  // Construct normalized ChatPeerInfo for the active peer
  const activePeerInfo: ChatPeerInfo | null = useMemo(() => {
    if (!activePeer) return null;
    return {
      id: activePeer.id,
      nexconnUserId: toNexconnUserId(activePeer.id),
      fullName: activePeer.full_name || "Learner",
      username: activePeer.username || `learner_${activePeer.id.slice(0, 5)}`,
      avatarUrl: activePeer.avatar_url || null,
      bio: activePeer.bio || null,
      skillsOffered: Array.isArray(activePeer.skills_offered) ? activePeer.skills_offered : [],
      skillsNeeded: Array.isArray(activePeer.skills_needed) ? activePeer.skills_needed : [],
    };
  }, [activePeer]);

  // Start chat with a peer from modal or directory
  const handleSelectPeerToChat = (peer: PeerProfile) => {
    // If peer was hidden, unhide them
    if (hiddenSet.has(peer.id)) {
      unhideChatForUser(currentUserId, peer.id);
      setHiddenSet((prev) => {
        const next = new Set(prev);
        next.delete(peer.id);
        return next;
      });
    }

    // Add to conversations if not already in list
    setConversationPeers((prev) => {
      if (prev.some((p) => p.id === peer.id)) return prev;
      return [peer, ...prev];
    });

    setActivePeerId(peer.id);
    setIsNewChatModalOpen(false);
  };

  // Confirm delete conversation ("Delete for Me")
  const handleConfirmDelete = async () => {
    if (!selectedPeerForDelete) return;

    setIsDeletingChat(true);
    const peerToDelete = selectedPeerForDelete;

    // Add to hidden set
    setHiddenSet((prev) => new Set(prev).add(peerToDelete.id));

    // If currently viewing deleted chat, switch away
    if (activePeerId === peerToDelete.id) {
      const remaining = visiblePeers.filter((p) => p.id !== peerToDelete.id);
      setActivePeerId(remaining.length > 0 ? remaining[0].id : null);
    }

    setActiveMenuPeerId(null);
    setSelectedPeerForDelete(null);
    setIsDeletingChat(false);

    await hideChatForUser(currentUserId, peerToDelete.id);
  };

  // Restore all hidden chats
  const handleRestoreAllHidden = async () => {
    setHiddenSet(new Set());
    await unhideAllChatsForUser(currentUserId);
  };

  // Filtered learners for New Chat Modal
  const modalLearners = useMemo(() => {
    return allLearners.filter((learner) => {
      if (learner.id === currentUserId) return false;
      if (!newChatSearch.trim()) return true;

      const q = newChatSearch.toLowerCase().trim();
      const nameMatch = (learner.full_name || "").toLowerCase().includes(q);
      const userMatch = (learner.username || "").toLowerCase().includes(q);
      const skillMatch =
        (learner.skills_offered || []).some((s) => s.toLowerCase().includes(q)) ||
        (learner.skills_needed || []).some((s) => s.toLowerCase().includes(q));

      return nameMatch || userMatch || skillMatch;
    });
  }, [allLearners, currentUserId, newChatSearch]);

  const hiddenCount = hiddenSet.size;

  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <FluidAtmosphere />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Main 2-Column Chat Container */}
        <div className="flex h-[calc(100vh-6.5rem)] rounded-3xl overflow-hidden border border-indigo-100/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_12px_40px_-8px_rgba(112,70,232,0.08)] dark:shadow-2xl">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Conversation List & Search (Hidden on mobile if peer active) */}
          {/* ========================================================================= */}
          <div
            className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-indigo-100/80 dark:border-slate-800 bg-gradient-to-b from-white via-[#FCFAFF] to-[#F7F9FF] dark:from-slate-900/95 dark:via-slate-900/95 dark:to-slate-900/95 shrink-0 ${
              activePeerId ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Header: Title, Realtime status, and New Chat button */}
            <div className="p-4 sm:p-5 border-b border-indigo-100/70 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Messages
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/80">
                    <Sparkles className="w-2.5 h-2.5 text-accent-amber" />
                    <span>Real-Time</span>
                  </span>
                </div>

                {/* New Chat Button */}
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-500/25 transition hover:scale-105 active:scale-95"
                  title="Start a new chat with any learner"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </button>
              </div>

              {/* Quick Navigation Links */}
              <div className="flex items-center justify-between text-xs pt-1">
                <Link
                  href="/requests"
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Skill Requests</span>
                </Link>
                <Link
                  href="/learners"
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Browse Directory</span>
                </Link>
              </div>

              {/* Restore Hidden Chats Banner (if any were hidden) */}
              {hiddenCount > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                  <span>{hiddenCount} deleted conversation{hiddenCount > 1 ? "s" : ""}</span>
                  <button
                    type="button"
                    onClick={handleRestoreAllHidden}
                    className="inline-flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore All</span>
                  </button>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts or skills..."
                  className="w-full pl-9.5 pr-4 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation List */}
            <div
              ref={menuContainerRef}
              className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50"
            >
              {visiblePeers.length === 0 ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {searchQuery ? "No contacts match search" : "No active chats yet"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {searchQuery
                        ? "Try searching by a different name or skill keyword."
                        : "Start a direct conversation with any learner to discuss skill exchanges."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Start a Conversation</span>
                  </button>
                </div>
              ) : (
                visiblePeers.map((peer) => {
                  const peerNexconnId = toNexconnUserId(peer.id);
                  const unreadCount = unreadMap[peerNexconnId] || 0;
                  const isSelected = activePeerId === peer.id;
                  const peerInitial = (peer.full_name || peer.username || "P").charAt(0).toUpperCase();
                  const isMenuOpen = activeMenuPeerId === peer.id;

                  return (
                    <div
                      key={peer.id}
                      onClick={() => setActivePeerId(peer.id)}
                      className={`relative flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition group ${
                        isSelected
                          ? "bg-gradient-to-r from-indigo-50/90 to-purple-50/60 dark:from-brand-950/40 dark:to-brand-950/40 border-l-4 border-brand-600 shadow-2xs"
                          : "hover:bg-indigo-50/30 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Avatar & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        <div className="relative shrink-0">
                          {peer.avatar_url ? (
                            <img
                              src={peer.avatar_url}
                              alt={peer.full_name || "Peer avatar"}
                              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                              {peerInitial}
                            </div>
                          )}
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className={`text-xs sm:text-sm font-bold truncate ${
                                isSelected
                                  ? "text-brand-700 dark:text-brand-300"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {peer.full_name || "Learner"}
                            </h4>
                          </div>

                          <p className="text-[11px] font-mono text-slate-400 truncate">
                            @{peer.username || "learner"}
                          </p>

                          {/* Skill pills preview */}
                          <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                            {peer.skills_offered && peer.skills_offered.length > 0 ? (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded truncate">
                                Teaches: {peer.skills_offered[0]}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on card: Video Call shortcut & 3-Dot Conversation Menu */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePeerId(peer.id);
                            setPendingAutoCall("video");
                          }}
                          className="p-1.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition"
                          title={`Start video call with ${peer.full_name || peer.username}`}
                        >
                          <Video className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuPeerId(isMenuOpen ? null : peer.id);
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
                          title="Conversation options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-2xl border border-slate-200 dark:border-slate-800 z-30 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuPeerId(null);
                                setSelectedPeerForDelete(peer);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition group"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover:scale-105 transition-transform" />
                              <span>Delete Chat</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Chat Room Window OR Placeholder Splash Screen                */}
          {/* ========================================================================= */}
          <div
            className={`flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-950/50 ${
              !activePeerId ? "hidden md:flex" : "flex"
            }`}
          >
            {activePeerInfo ? (
              <ChatRoom
                key={activePeerInfo.id}
                peer={activePeerInfo}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                currentUserAvatar={currentUserAvatar}
                autoStartCall={pendingAutoCall}
                onBack={() => {
                  setActivePeerId(null);
                  setPendingAutoCall(null);
                }}
              />
            ) : (
              /* No Active Conversation Selected State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/10">
                  <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Select a Conversation
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Choose an active learning partner from the left, start a 1-on-1 video call, or launch a group meeting room.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 transition shadow-md shadow-brand-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Start New Chat</span>
                  </button>
                  <Link
                    href="/meet"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-bold hover:from-blue-500 hover:to-indigo-500 transition shadow-md shadow-blue-500/20"
                  >
                    <Video className="w-4 h-4" />
                    <span>Video Meeting Room</span>
                  </Link>
                  <Link
                    href="/learners"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-sm"
                  >
                    <Users className="w-4 h-4" />
                    <span>Browse Learners</span>
                  </Link>
                </div>

                {/* Quick Learner Suggestions */}
                {allLearners.length > 0 && (
                  <div className="w-full max-w-lg pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Suggested Learners to Connect With
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {allLearners.slice(0, 4).map((learner) => (
                        <button
                          key={learner.id}
                          type="button"
                          onClick={() => handleSelectPeerToChat(learner)}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 text-left transition shadow-xs group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {(learner.full_name || learner.username || "L").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 transition">
                              {learner.full_name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              @{learner.username}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NEW CHAT MODAL: Select any learner from directory to chat with             */}
      {/* ========================================================================= */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Start a New Chat
                  </h3>
                  <p className="text-xs text-slate-400">Select a peer learner to message</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                placeholder="Search by learner name, username or skill..."
                className="w-full pl-9.5 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-brand-500 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition"
                autoFocus
              />
            </div>

            {/* Modal Learners List */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/50">
              {modalLearners.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No learners found matching your search.
                </div>
              ) : (
                modalLearners.map((learner) => {
                  const initial = (learner.full_name || learner.username || "L").charAt(0).toUpperCase();

                  return (
                    <button
                      key={learner.id}
                      type="button"
                      onClick={() => handleSelectPeerToChat(learner)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-brand-50 dark:hover:bg-brand-950/40 text-left transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {learner.avatar_url ? (
                          <img
                            src={learner.avatar_url}
                            alt={learner.full_name || "Learner"}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition truncate">
                            {learner.full_name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400 truncate">
                            @{learner.username}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 group-hover:bg-brand-600 group-hover:text-white transition">
                        Chat
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Dialog */}
      <DeleteChatDialog
        isOpen={!!selectedPeerForDelete}
        peerName={selectedPeerForDelete?.full_name || "this user"}
        isDeleting={isDeletingChat}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSelectedPeerForDelete(null)}
      />
    </div>
  );
}
