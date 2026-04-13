import { create } from "zustand";

// ─────────────────────────────────────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationState {
  /**
   * Number of unread notifications.
   * Fetched from GET /notifications/unread-count and shown as a
   * badge on the bell icon in TopHeader.
   */
  unreadCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions shape
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationActions {
  /**
   * Set the unread count to an exact value.
   * Called after fetching GET /notifications/unread-count.
   */
  setUnreadCount: (count: number) => void;

  /**
   * Optimistically increment the count by 1.
   * Can be used if a real-time event (e.g. WebSocket) delivers a new notification.
   */
  incrementUnread: () => void;

  /**
   * Decrement the count by 1 (minimum 0).
   * Called when a user marks a single notification as read.
   * This is an optimistic update — the API call happens simultaneously.
   */
  decrementUnread: () => void;

  /**
   * Reset the count to 0.
   * Called when the user marks all notifications as read, or on logout.
   */
  clearUnread: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<
  NotificationState & NotificationActions
>((set) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  unreadCount: 0,

  // ── Actions ───────────────────────────────────────────────────────────────
  setUnreadCount: (count) =>
    set({ unreadCount: Math.max(0, count) }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  clearUnread: () =>
    set({ unreadCount: 0 }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Selector (use for optimal re-render performance)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns only the unread count — components using this
 * only re-render when the count changes, not on action changes.
 *
 * @example
 * const count = useUnreadCount();
 * // Renders a badge: {count > 0 && <span>{count}</span>}
 */
export const useUnreadCount = () =>
  useNotificationStore((s) => s.unreadCount);
