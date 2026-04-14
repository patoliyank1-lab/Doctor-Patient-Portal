"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Stethoscope, FileText, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { markAsRead } from "@/lib/api/notifications";
import { EmptyState } from "./EmptyState";

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}

// ── Relative time helper ──────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

// ── Icon by notification type ─────────────────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  const t = type.toUpperCase();
  if (t.includes("APPOINTMENT"))
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
        <Stethoscope className="h-4 w-4 text-blue-600" />
      </span>
    );
  if (t.includes("RECORD"))
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
        <FileText className="h-4 w-4 text-emerald-600" />
      </span>
    );
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
      <Info className="h-4 w-4 text-slate-500" />
    </span>
  );
}

// ── NotificationItem ──────────────────────────────────────────────────────────

function NotificationItem({ notification }: { notification: DashboardNotification }) {
  const [read, setRead] = useState(notification.isRead);

  async function handleClick() {
    if (!read) {
      setRead(true);
      try {
        await markAsRead(notification.id);
      } catch {
        // best-effort — don't revert the optimistic update
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50",
        !read && "bg-blue-50/50"
      )}
    >
      <NotificationIcon type={notification.type} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-semibold text-slate-900 leading-tight", !read && "text-blue-900")}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400 line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-[10px] text-slate-300">{relativeTime(notification.createdAt)}</p>
      </div>
      {!read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="Unread" />
      )}
    </button>
  );
}

// ── RecentNotificationsPanel ──────────────────────────────────────────────────

interface RecentNotificationsPanelProps {
  notifications: DashboardNotification[];
}

export function RecentNotificationsPanel({ notifications }: RecentNotificationsPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Recent Notifications</h2>
        <Link
          href="/patient/notifications"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8 text-slate-300" />}
          title="No notifications yet"
          description="You'll see updates about appointments and records here."
        />
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
