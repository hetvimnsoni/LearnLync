"use client";

import { useNexconn } from "@/components/providers/NexconnProvider";
import { ConnectionStatus } from "@nexconn/chat";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Server,
  Key,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react";

export function NexconnStatus({ supabaseUserId }: { supabaseUserId: string }) {
  const { status, isConnected, isConnecting, nexconnUserId, error, reconnect } = useNexconn();

  const getStatusBadge = () => {
    if (isConnecting) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Connecting to Gateway...</span>
        </span>
      );
    }

    if (isConnected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Nexconn Live</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        <WifiOff className="w-3.5 h-3.5 text-slate-500" />
        <span>Disconnected</span>
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Nexconn Chat SDK Connection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time WebSocket connection to Singapore gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            type="button"
            onClick={() => reconnect()}
            disabled={isConnecting}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition disabled:opacity-50"
            title="Reconnect to Nexconn"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Connection & Mapping Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-blue-500" />
            <span>Mapped Nexconn User ID (Alphanumeric)</span>
          </div>
          <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all font-semibold">
            {nexconnUserId || supabaseUserId.replace(/-/g, "")}
          </div>
          <p className="text-[11px] text-slate-400">
            Deterministically derived: <code className="text-blue-500">uuid.replace(/-/g, &quot;&quot;)</code>
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-500" />
            <span>API Gateway &amp; Cluster</span>
          </div>
          <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
            api.sg-light-api.com
          </div>
          <p className="text-[11px] text-slate-400">
            Region: <span className="text-slate-600 dark:text-slate-300 font-medium">Singapore (AreaCode.SG)</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Token Generated via Secure Backend Route (<code className="text-slate-600 dark:text-slate-300">/api/chat/token</code>)</span>
        </div>
        <span className="text-[11px] font-mono opacity-80">
          SDK Status: {status === ConnectionStatus.CONNECTED ? "CONNECTED (0)" : status === ConnectionStatus.CONNECTING ? "CONNECTING (1)" : "DISCONNECTED (2)"}
        </span>
      </div>
    </div>
  );
}
