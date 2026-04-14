"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, Trash2, Loader2, BellOff } from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/api/notifications";
import { PageContainer } from "@/components/layout/PageContainer";
import type { Notification } from "@/types";

function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return "Just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  } catch { return ""; }
}

const TYPE_COLOR: Record<string, string> = {
  APPOINTMENT: "bg-blue-500",
  SYSTEM:      "bg-slate-400",
  ALERT:       "bg-amber-500",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [markingAll, setMarkingAll]       = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await getNotifications({ limit: 50 });
      setNotifications((res.data ?? []) as Notification[]);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleMarkRead(id: string) {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {/* silent */}
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {/* silent */}
    finally { setMarkingAll(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {/* silent */}
    finally { setDeletingId(null); }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PageContainer
      title="Notifications"
      subtitle="Stay updated on your appointments and account activity."
      action={
        unreadCount > 0 ? (
          <button
            type="button"
            disabled={markingAll}
            onClick={handleMarkAll}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark all read
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <BellOff className="h-7 w-7 text-slate-400" />
          </div>
          <p className="font-semibold text-slate-800">All caught up!</p>
          <p className="text-sm text-slate-500">You have no notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {unreadCount > 0 && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {unreadCount} unread
            </p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`group flex items-start gap-4 rounded-2xl border p-4 transition-all ${
                n.isRead
                  ? "border-slate-100 bg-white"
                  : "border-blue-100 bg-blue-50/60 shadow-sm"
              }`}
            >
              {/* Type dot */}
              <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${TYPE_COLOR[n.type] ?? "bg-slate-400"}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${n.isRead ? "text-slate-700" : "text-slate-900"}`}>
                  {n.title}
                </p>
                <p className="mt-0.5 text-sm text-slate-500 leading-snug">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(n.createdAt)}</p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!n.isRead && (
                  <button
                    type="button"
                    title="Mark as read"
                    onClick={() => handleMarkRead(n.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  title="Delete"
                  disabled={deletingId === n.id}
                  onClick={() => handleDelete(n.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-all"
                >
                  {deletingId === n.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
