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

// Internal shape returned by this backend endpoint
interface NotificationListResponse {
  notifications: Notification[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

/** GET /notifications — Get the current user's notifications. */
export async function getNotifications(
  params: NotificationListParams = {}
): Promise<PaginatedResponse<Notification>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));

  const res = await fetchWithAuth<NotificationListResponse>(`/notifications?${query}`);
  return {
    data: res.notifications ?? [],
    total: res.pagination?.total ?? 0,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 20,
    totalPages: res.pagination?.totalPages ?? 1,
  };
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
