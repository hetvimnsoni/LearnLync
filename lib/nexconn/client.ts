"use client";

import {
  NCEngine,
  AreaCode,
  LogLevel,
  ConnectionStatusHandler,
  MessageHandler,
  ConnectionStatus,
  ConnectResult,
  NCResult,
} from "@nexconn/chat";

// Track singleton client lifecycle state in browser memory
let isInitialized = false;
let isConnecting = false;
let pendingConnectPromise: Promise<{ success: boolean; userId?: string; error?: string }> | null = null;
let activeConnectedUserId: string | null = null;

/**
 * Initializes the Nexconn Engine once on the client.
 * Safe to call multiple times (duplicate calls are ignored).
 */
export function initNexconn(appKey: string): void {
  if (typeof window === "undefined") return; // Never run on server during SSR
  if (isInitialized) return;

  if (!appKey) {
    console.error("Nexconn init failed: NEXT_PUBLIC_NEXCONN_APP_KEY is required.");
    return;
  }

  try {
    NCEngine.initialize({
      appKey,
      areaCode: AreaCode.SG,
      logLevel: LogLevel.WARN,
    });
    isInitialized = true;
  } catch (err: any) {
    console.error("Error during NCEngine.initialize:", err?.message);
  }
}

/**
 * Connects to Nexconn Chat using an authenticated user token.
 * Prevents duplicate simultaneous connections and handles user switches.
 */
export async function connectNexconn(
  token: string,
  expectedUserId: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot connect from server environment" };
  }

  // Already connected with this exact user ID
  if (activeConnectedUserId === expectedUserId && NCEngine.getConnectionStatus() === ConnectionStatus.CONNECTED) {
    return { success: true, userId: activeConnectedUserId };
  }

  // If a different user was previously connected, disconnect first to prevent session leak
  if (activeConnectedUserId && activeConnectedUserId !== expectedUserId) {
    await disconnectNexconn();
  }

  // If a connection attempt is currently in-flight, return the existing promise
  if (isConnecting && pendingConnectPromise) {
    return await pendingConnectPromise;
  }

  isConnecting = true;
  pendingConnectPromise = (async () => {
    try {
      const result: NCResult<ConnectResult> = await NCEngine.connect({ token });

      if (result.isOk && result.data) {
        activeConnectedUserId = result.data.userId;
        return { success: true, userId: result.data.userId };
      } else {
        return {
          success: false,
          error: `Nexconn connection error [code: ${result.code}]: ${result.msg || "Connection failed"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Unexpected exception during Nexconn connect",
      };
    } finally {
      isConnecting = false;
      pendingConnectPromise = null;
    }
  })();

  return await pendingConnectPromise;
}

/**
 * Disconnects the active Nexconn session.
 */
export async function disconnectNexconn(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (activeConnectedUserId || NCEngine.getConnectionStatus() === ConnectionStatus.CONNECTED) {
      await NCEngine.disconnect(false);
    }
  } catch (err: any) {
    console.warn("Exception during Nexconn disconnect:", err?.message);
  } finally {
    activeConnectedUserId = null;
    isConnecting = false;
    pendingConnectPromise = null;
  }
}

/**
 * Gets the current connection status from NCEngine.
 */
export function getNexconnStatus(): ConnectionStatus {
  if (typeof window === "undefined") return ConnectionStatus.DISCONNECTED;
  try {
    return NCEngine.getConnectionStatus();
  } catch {
    return ConnectionStatus.DISCONNECTED;
  }
}

/**
 * Registers a connection status listener with automated cleanup.
 */
export function addConnectionStatusListener(
  identifier: string,
  onStatusChange: (status: ConnectionStatus, code?: number) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  try {
    const handler = new ConnectionStatusHandler({
      onConnectionStatusChanged({ status, code }) {
        onStatusChange(status, code);
      },
    });
    NCEngine.addConnectionStatusHandler(identifier, handler);
  } catch (err: any) {
    console.warn(`Failed to add connection status handler '${identifier}':`, err?.message);
  }

  // Return unsubscribe cleanup function
  return () => {
    try {
      NCEngine.removeConnectionStatusHandler(identifier);
    } catch {}
  };
}

/**
 * Registers a message event listener with automated cleanup.
 */
export function addMessageListener(
  identifier: string,
  onMessageReceived: (messages: any[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  try {
    const handler = new MessageHandler({
      onMessageReceived(event) {
        if (event?.messages) {
          onMessageReceived(event.messages);
        }
      },
    });
    NCEngine.addMessageHandler(identifier, handler);
  } catch (err: any) {
    console.warn(`Failed to add message handler '${identifier}':`, err?.message);
  }

  // Return unsubscribe cleanup function
  return () => {
    try {
      NCEngine.removeMessageHandler(identifier);
    } catch {}
  };
}
