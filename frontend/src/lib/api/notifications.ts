import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Notification, PaginatedResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationListParams {
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** GET /notifications — Get the current user's notifications. */
export async function getNotifications(
  params: NotificationListParams = {}
): Promise<PaginatedResponse<Notification>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));

  return fetchWithAuth<PaginatedResponse<Notification>>(
    `/notifications?${query}`
  );
}

/** Helper: GET /notifications?limit=x — Get recent notifications. */
export async function getRecentNotifications(
  limit = 3
): Promise<PaginatedResponse<Notification>> {
  return getNotifications({ limit });
}

/**
 * GET /notifications/unread-count — Get only the unread count.
 * Lightweight endpoint used to populate the header bell badge.
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  return fetchWithAuth<{ count: number }>("/notifications/unread-count");
}

/** PUT /notifications/:id/read — Mark a single notification as read. */
export async function markAsRead(id: string): Promise<Notification> {
  return fetchWithAuth<Notification>(`/notifications/${id}/read`, {
    method: "PUT",
  });
}

/** PUT /notifications/read-all — Mark all notifications as read. */
export async function markAllAsRead(): Promise<void> {
  return fetchWithAuth<void>("/notifications/read-all", { method: "PUT" });
}

/** DELETE /notifications/:id — Delete a single notification. */
export async function deleteNotification(id: string): Promise<void> {
  return fetchWithAuth<void>(`/notifications/${id}`, { method: "DELETE" });
}
