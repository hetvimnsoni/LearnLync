export type ToastType = "chat" | "exchange" | "info";

export interface AppToast {
  id: string;
  type: ToastType;
  title: string;
  description: string;
  href?: string;
  avatarUrl?: string | null;
  initial?: string;
  createdAt: number;
}

export interface NotificationContextValue {
  unreadMessagesCount: number;
  pendingRequestsCount: number;
  toasts: AppToast[];
  activePeerNexconnId: string | null;
  setActivePeerNexconnId: (id: string | null) => void;
  addToast: (toast: Omit<AppToast, "id" | "createdAt">) => void;
  dismissToast: (id: string) => void;
  refreshCounts: () => Promise<void>;
}

