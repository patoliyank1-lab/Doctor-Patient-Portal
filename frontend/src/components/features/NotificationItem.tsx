"use client";

import { Trash2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Notification } from "@/types";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-lg p-4 transition-colors",
        notification.isRead
          ? "bg-background hover:bg-muted/40"
          : "bg-blue-50/60 hover:bg-blue-50"
      )}
    >
      {/* Unread dot */}
      {!notification.isRead && (
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
          aria-label="Unread notification"
        />
      )}

      {/* Body */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() =>
          !notification.isRead && onMarkRead?.(notification.id)
        }
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !notification.isRead) {
            onMarkRead?.(notification.id);
          }
        }}
      >
        <p
          className={cn(
            "text-sm leading-snug",
            notification.isRead
              ? "text-muted-foreground"
              : "font-medium text-foreground"
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <time
          dateTime={notification.createdAt}
          className="mt-1 block text-xs text-muted-foreground/70"
        >
          {formatRelativeTime(notification.createdAt)}
        </time>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(notification.id)}
          className={cn(
            "shrink-0 rounded-md p-1 text-muted-foreground transition-all",
            "opacity-0 group-hover:opacity-100",
            "hover:text-destructive hover:bg-destructive/10",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100"
          )}
          aria-label="Delete notification"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
