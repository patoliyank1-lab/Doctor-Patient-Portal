"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useCurrentUser } from "@/store/useAuthStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useUnreadCount, useNotificationStore } from "@/store/useNotificationStore";
import { logout } from "@/lib/api/auth";
import type { UserRole } from "@/types";

// Notification route per role
const NOTIF_ROUTES: Record<UserRole, string> = {
  patient: ROUTES.PATIENT_NOTIFICATIONS,
  doctor:  ROUTES.DOCTOR_NOTIFICATIONS,
  admin:   ROUTES.ADMIN_DASHBOARD, // admin has no dedicated notif page
};

// Profile route per role
const PROFILE_ROUTES: Record<UserRole, string> = {
  patient: ROUTES.PATIENT_PROFILE,
  doctor:  ROUTES.DOCTOR_PROFILE,
  admin:   ROUTES.ADMIN_DASHBOARD,
};

interface TopHeaderProps {
  onMenuClick: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const router = useRouter();
  const user = useCurrentUser();
  const clearUser = useAuthStore((s) => s.clearUser);
  const clearUnread = useNotificationStore((s) => s.clearUnread);
  const unreadCount = useUnreadCount();

  const role = user?.role as UserRole | undefined;
  const notifRoute = role ? NOTIF_ROUTES[role] : ROUTES.LOGIN;
  const profileRoute = role ? PROFILE_ROUTES[role] : ROUTES.LOGIN;

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // continue
    }
    clearUser();
    clearUnread();
    router.push(ROUTES.LOGIN);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 sm:px-6">
      {/* Left — mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right — notifications + user menu */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <Link
          href={notifRoute}
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
              aria-hidden="true"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="User menu"
            >
              <Avatar
                name={user?.name}
                size="sm"
              />
              <span className="hidden max-w-[120px] truncate sm:block">
                {user?.name}
              </span>
              <ChevronDown
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className={cn(
                "z-50 min-w-[180px] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-card-hover",
                "data-[state=open]:animate-fade-in"
              )}
            >
              {/* User info header */}
              <div className="mb-1 px-2.5 py-2 border-b border-border">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>

              <DropdownMenu.Item asChild>
                <Link
                  href={profileRoute}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                    "cursor-pointer outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Your Profile
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-border" />

              <DropdownMenu.Item
                onSelect={handleLogout}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                  "cursor-pointer outline-none transition-colors",
                  "text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                )}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
