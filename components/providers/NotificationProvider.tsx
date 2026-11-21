"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { AppToast, NotificationContextValue } from "@/types/notification";
import { useNexconn } from "@/components/providers/NexconnProvider";
import {
  fetchTotalUnreadCount,
  clearDirectChannelUnread,
} from "@/lib/nexconn/chat";
import {
  NCEngine,
  MessageHandler,
  ChannelHandler,
  ChannelType,
} from "@nexconn/chat";
import { createClient } from "@/lib/supabase/client";
import { getPendingIncomingCount } from "@/app/requests/actions";

const NotificationContext = createContext<NotificationContextValue>({
  unreadMessagesCount: 0,
  pendingRequestsCount: 0,
  toasts: [],
  activePeerNexconnId: null,
  setActivePeerNexconnId: () => { },
  addToast: () => { },
  dismissToast: () => { },
  refreshCounts: async () => { },
});

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({
  children,
  initialPendingRequestsCount = 0,
}: {
  children: React.ReactNode;
  initialPendingRequestsCount?: number;
}) {
  const { isConnected, nexconnUserId } = useNexconn();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(initialPendingRequestsCount);
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const [activePeerNexconnId, setActivePeerNexconnIdState] = useState<string | null>(null);

  const activePeerRef = useRef<string | null>(null);
  const shownToastRequestIdsRef = useRef<Set<string>>(new Set());
  const lastKnownPendingCountRef = useRef<number>(initialPendingRequestsCount);
  const mountTimestampRef = useRef<number>(Date.now());
  const isInitializedRef = useRef<boolean>(false);

  const profileCacheRef = useRef<
    Map<string, { id: string; fullName: string; avatarUrl: string | null }>
  >(new Map());

  // Stable Supabase browser client instance
  const supabase = useMemo(() => createClient(), []);

  const setActivePeerNexconnId = useCallback((id: string | null) => {
    activePeerRef.current = id;
    setActivePeerNexconnIdState(id);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<AppToast, "id" | "createdAt">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: AppToast = {
        ...toast,
        id,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        // Limit max active toasts to 4
        const updated = [newToast, ...prev.slice(0, 3)];
        return updated;
      });

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        dismissToast(id);
      }, 6000);
    },
    [dismissToast]
  );

  // Helper to fetch profile by nexconnUserId or Supabase UUID
  const getPeerProfileByNexconnId = useCallback(
    async (nexconnId: string): Promise<{ id: string; fullName: string; avatarUrl: string | null }> => {
      if (profileCacheRef.current.has(nexconnId)) {
        return profileCacheRef.current.get(nexconnId)!;
      }

      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url");

        if (data && Array.isArray(data)) {
          for (const p of data) {
            const mapped = p.id.replace(/-/g, "").toLowerCase();
            const info = {
              id: p.id,
              fullName: p.full_name || p.username || "Peer Learner",
              avatarUrl: p.avatar_url || null,
            };
            profileCacheRef.current.set(mapped, info);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch peer profile for notification:", err);
      }

      if (profileCacheRef.current.has(nexconnId)) {
        return profileCacheRef.current.get(nexconnId)!;
      }

      return {
        id: "",
        fullName: "Learner",
        avatarUrl: null,
      };
    },
    [supabase]
  );

  // Secure handler: Verifies incoming request against Supabase before displaying notification
  const handleVerifiedIncomingRequest = useCallback(
    async (requestId: string, currentUserId: string) => {
      if (!requestId || shownToastRequestIdsRef.current.has(requestId)) {
        return;
      }

      try {
        // Query database directly with RLS authorization: ensure this user is the receiver and status is pending
        const { data: record, error } = await supabase
          .from("skill_exchanges")
          .select("id, sender_id, receiver_id, skill_offered, skill_wanted, status")
          .eq("id", requestId)
          .eq("receiver_id", currentUserId)
          .eq("status", "pending")
          .maybeSingle();

        if (error || !record) {
          // Reject unverified or unauthorized event
          return;
        }

        // Deduplicate before displaying
        if (shownToastRequestIdsRef.current.has(record.id)) {
          return;
        }
        shownToastRequestIdsRef.current.add(record.id);

        // Fetch sender display information through RLS-authorized query
        let senderName = "A learner";
        let avatarUrl: string | null = null;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, username, avatar_url")
          .eq("id", record.sender_id)
          .maybeSingle();

        if (profile) {
          senderName = profile.full_name || profile.username || "A learner";
          avatarUrl = profile.avatar_url;
        }

        // Render toast strictly using verified database values
        addToast({
          type: "exchange",
          title: "New skill-exchange request",
          description: `${senderName} wants to teach ${record.skill_offered} in exchange for ${record.skill_wanted}.`,
          href: "/requests",
          avatarUrl,
          initial: senderName.charAt(0).toUpperCase(),
        });
      } catch (err) {
        console.warn("Error verifying incoming exchange request:", err);
      }
    },
    [supabase, addToast]
  );

  // Secure handler: Verifies acceptance against Supabase before displaying notification
  const handleVerifiedAcceptedRequest = useCallback(
    async (requestId: string, currentUserId: string) => {
      const dedupeKey = `accepted-${requestId}`;
      if (!requestId || shownToastRequestIdsRef.current.has(dedupeKey)) {
        return;
      }

      try {
        // Verify database: ensure current user is the sender and status is accepted
        const { data: record, error } = await supabase
          .from("skill_exchanges")
          .select("id, sender_id, receiver_id, status")
          .eq("id", requestId)
          .eq("sender_id", currentUserId)
          .eq("status", "accepted")
          .maybeSingle();

        if (error || !record) {
          return;
        }

        if (shownToastRequestIdsRef.current.has(dedupeKey)) {
          return;
        }
        shownToastRequestIdsRef.current.add(dedupeKey);

        let receiverName = "The peer";
        let avatarUrl: string | null = null;
        const { data: peerProfile } = await supabase
          .from("profiles")
          .select("full_name, username, avatar_url")
          .eq("id", record.receiver_id)
          .maybeSingle();

        if (peerProfile) {
          receiverName = peerProfile.full_name || peerProfile.username || "The peer";
          avatarUrl = peerProfile.avatar_url;
        }

        addToast({
          type: "exchange",
          title: "Exchange Request Accepted! 🎉",
          description: `${receiverName} accepted your skill exchange request! Tap to open chat.`,
          href: `/chat/${record.receiver_id}`,
          avatarUrl,
          initial: receiverName.charAt(0).toUpperCase(),
        });
      } catch (err) {
        console.warn("Error verifying accepted exchange request:", err);
      }
    },
    [supabase, addToast]
  );

  // Refresh counts helper with safe, deduplicated new-request detection
  const refreshCounts = useCallback(async () => {
    if (isConnected) {
      const unreadCount = await fetchTotalUnreadCount();
      setUnreadMessagesCount(unreadCount);
    }

    try {
      const pendingCount = await getPendingIncomingCount();
      const previousCount = lastKnownPendingCountRef.current;
      setPendingRequestsCount(pendingCount);
      lastKnownPendingCountRef.current = pendingCount;

      // Only evaluate new requests after initial mount is complete and count increased
      if (isInitializedRef.current && pendingCount > previousCount) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Query only recent pending requests to prevent notifying about old requests
          const { data: latest } = await supabase
            .from("skill_exchanges")
            .select("id, receiver_id, status, created_at")
            .eq("receiver_id", user.id)
            .eq("status", "pending")
            .gte("created_at", new Date(mountTimestampRef.current - 10000).toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latest && !shownToastRequestIdsRef.current.has(latest.id)) {
            await handleVerifiedIncomingRequest(latest.id, user.id);
          }
        }
      }
    } catch { }
  }, [isConnected, supabase, handleVerifiedIncomingRequest]);

  // 1. Initial count refresh, state initialization, and window focus listener
  useEffect(() => {
    let isMounted = true;

    // Pre-populate shown set with existing pending request IDs to prevent false notifications on load
    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!isMounted) return;

      if (user) {
        try {
          const { data: existing } = await supabase
            .from("skill_exchanges")
            .select("id")
            .eq("receiver_id", user.id)
            .eq("status", "pending");

          if (existing && Array.isArray(existing)) {
            for (const r of existing) {
              shownToastRequestIdsRef.current.add(r.id);
            }
          }
        } catch { }
      }

      if (isMounted) {
        isInitializedRef.current = true;
        refreshCounts();
      }
    });

    const handleFocus = () => {
      refreshCounts();
    };

    window.addEventListener("focus", handleFocus);
    const interval = setInterval(refreshCounts, 30000); // 30s background sync

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [supabase, refreshCounts]);

  // 2. Global Nexconn message listener for unread count & in-app toasts
  useEffect(() => {
    if (!isConnected || !nexconnUserId) return;

    fetchTotalUnreadCount().then((cnt) => setUnreadMessagesCount(cnt));

    const handlerId = `global-notification-msg-handler-${Date.now()}`;
    const channelHandlerId = `global-channel-handler-${Date.now()}`;

    const msgHandler = new MessageHandler({
      async onMessageReceived({ messages }) {
        if (!Array.isArray(messages)) return;

        let shouldRefreshTotal = false;

        for (const msg of messages) {
          const isDirect = msg.channelIdentifier?.channelType === ChannelType.DIRECT;
          if (!isDirect) continue;

          // Don't notify for messages sent by the current user
          if (msg.senderUserId === nexconnUserId) continue;

          shouldRefreshTotal = true;

          // If user is currently looking at this peer in ChatRoom, suppress toast
          if (activePeerRef.current && activePeerRef.current === msg.senderUserId) {
            continue;
          }

          // Otherwise show toast notification
          const senderInfo = await getPeerProfileByNexconnId(msg.senderUserId);
          const textContent =
            msg.content?.text ||
            (typeof msg.content === "string" ? msg.content : "") ||
            "New message";
          const snippet =
            textContent.length > 80 ? `${textContent.substring(0, 80)}...` : textContent;

          addToast({
            type: "chat",
            title: senderInfo.fullName,
            description: snippet,
            href: senderInfo.id ? `/chat/${senderInfo.id}` : "/learners",
            avatarUrl: senderInfo.avatarUrl,
            initial: senderInfo.fullName.charAt(0).toUpperCase(),
          });
        }

        if (shouldRefreshTotal) {
          const total = await fetchTotalUnreadCount();
          setUnreadMessagesCount(total);
        }
      },
    });

    const chHandler = new ChannelHandler({
      onChannelUnreadStatusSync() {
        fetchTotalUnreadCount().then((cnt) => setUnreadMessagesCount(cnt));
      },
    });

    try {
      NCEngine.addMessageHandler(handlerId, msgHandler);
      NCEngine.addChannelHandler(channelHandlerId, chHandler);
    } catch (err: any) {
      console.warn("Could not register global message notification handler:", err?.message);
    }

    return () => {
      try {
        NCEngine.removeMessageHandler(handlerId);
        NCEngine.removeChannelHandler(channelHandlerId);
      } catch { }
    };
  }, [isConnected, nexconnUserId, addToast, getPeerProfileByNexconnId]);

  // 3. Supabase Realtime Postgres Changes Subscription (Database CDC only, No Client Broadcasts)
  useEffect(() => {
    let channel: any = null;

    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) return;

      // Scoped channel name per authenticated user
      const channelName = `user-exchange-cdc-${user.id}`;

      channel = supabase
        .channel(channelName)
        // A. Listen for new INSERT records on public.skill_exchanges
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "skill_exchanges",
          },
          async (payload: any) => {
            // Extract ONLY request ID; verify the record securely from the database
            const requestId = payload.new?.id;
            if (!requestId) return;

            // Update badge count
            getPendingIncomingCount().then((cnt) => {
              setPendingRequestsCount(cnt);
              lastKnownPendingCountRef.current = cnt;
            });

            // Verify and notify
            await handleVerifiedIncomingRequest(requestId, user.id);
          }
        )
        // B. Listen for UPDATE records on public.skill_exchanges
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "skill_exchanges",
          },
          async (payload: any) => {
            const requestId = payload.new?.id;
            if (!requestId) return;

            // Always sync the badge counter
            getPendingIncomingCount().then((cnt) => {
              setPendingRequestsCount(cnt);
              lastKnownPendingCountRef.current = cnt;
            });

            // If status is accepted, verify and notify
            if (payload.new?.status === "accepted") {
              await handleVerifiedAcceptedRequest(requestId, user.id);
            }
          }
        )
        .subscribe((status: string, err?: any) => {
          if (status === "CHANNEL_ERROR") {
            console.warn("Postgres changes subscription error on skill_exchanges:", err?.message);
          }
        });
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, handleVerifiedIncomingRequest, handleVerifiedAcceptedRequest]);

  return (
    <NotificationContext.Provider
      value={{
        unreadMessagesCount,
        pendingRequestsCount,
        toasts,
        activePeerNexconnId,
        setActivePeerNexconnId,
        addToast,
        dismissToast,
        refreshCounts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
