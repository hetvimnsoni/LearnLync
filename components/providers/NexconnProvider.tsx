"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { ConnectionStatus } from "@nexconn/chat";
import {
  initNexconn,
  connectNexconn,
  disconnectNexconn,
  addConnectionStatusListener,
} from "@/lib/nexconn/client";
import { toNexconnUserId } from "@/lib/nexconn/identity";
import { createClient } from "@/lib/supabase/client";

interface NexconnContextValue {
  status: ConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  nexconnUserId: string | null;
  error: string | null;
  reconnect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const NexconnContext = createContext<NexconnContextValue>({
  status: ConnectionStatus.DISCONNECTED,
  isConnected: false,
  isConnecting: false,
  nexconnUserId: null,
  error: null,
  reconnect: async () => {},
  disconnect: async () => {},
});

export function useNexconn() {
  return useContext(NexconnContext);
}

export function NexconnProvider({
  children,
  appKey,
}: {
  children: React.ReactNode;
  appKey: string;
}) {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isConnecting, setIsConnecting] = useState(false);
  const [nexconnUserId, setNexconnUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const currentSubscribedUserRef = useRef<string | null>(null);

  // Initialize engine once on client
  useEffect(() => {
    if (appKey) {
      initNexconn(appKey);
    }
  }, [appKey]);

  // Register real-time connection status listener
  useEffect(() => {
    const unsubscribe = addConnectionStatusListener("global-provider-listener", (newStatus, code) => {
      setStatus(newStatus);
      if (newStatus === ConnectionStatus.CONNECTED) {
        setError(null);
      } else if (newStatus === ConnectionStatus.DISCONNECTED && code) {
        setError(`Disconnected with code: ${code}`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Connect helper
  const connectForUser = useCallback(async (supabaseUserId: string) => {
    if (!supabaseUserId) return;

    const mappedUserId = toNexconnUserId(supabaseUserId);
    setNexconnUserId(mappedUserId);
    setIsConnecting(true);
    setError(null);

    try {
      // 1. Fetch token from our secure server endpoint
      const res = await fetch("/api/chat/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        let msg = "Failed to fetch chat token";
        try {
          const errData = await res.json();
          msg = errData.error || msg;
        } catch {}
        setError(msg);
        setIsConnecting(false);
        return;
      }

      const data = await res.json();
      if (!data.accessToken) {
        setError("Token endpoint returned an invalid response.");
        setIsConnecting(false);
        return;
      }

      // 2. Connect to Nexconn with the issued access token
      const connectResult = await connectNexconn(data.accessToken, mappedUserId);
      if (!connectResult.success) {
        setError(connectResult.error || "Connection to Nexconn failed.");
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected network error during chat connection.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Monitor Supabase Auth state: auto-connect on login, disconnect cleanly on logout
  useEffect(() => {
    let isMounted = true;

    // Check initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;
      if (user) {
        currentSubscribedUserRef.current = user.id;
        connectForUser(user.id);
      } else {
        currentSubscribedUserRef.current = null;
        disconnectNexconn();
        setNexconnUserId(null);
        setStatus(ConnectionStatus.DISCONNECTED);
      }
    });

    // Listen to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id || null;

      if (event === "SIGNED_OUT" || !newUserId) {
        currentSubscribedUserRef.current = null;
        await disconnectNexconn();
        if (isMounted) {
          setNexconnUserId(null);
          setStatus(ConnectionStatus.DISCONNECTED);
          setError(null);
        }
      } else if (newUserId && newUserId !== currentSubscribedUserRef.current) {
        currentSubscribedUserRef.current = newUserId;
        if (isMounted) {
          await connectForUser(newUserId);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, connectForUser]);

  const reconnect = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await connectForUser(user.id);
    }
  }, [supabase, connectForUser]);

  const disconnect = useCallback(async () => {
    await disconnectNexconn();
    setStatus(ConnectionStatus.DISCONNECTED);
  }, []);

  const isConnected = status === ConnectionStatus.CONNECTED;

  return (
    <NexconnContext.Provider
      value={{
        status,
        isConnected,
        isConnecting,
        nexconnUserId,
        error,
        reconnect,
        disconnect,
      }}
    >
      {children}
    </NexconnContext.Provider>
  );
}
