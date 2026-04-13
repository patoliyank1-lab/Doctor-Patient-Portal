"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, Bell, LogOut, ChevronDown, User, Settings,
  Search, X, Stethoscope, LayoutDashboard, ShieldCheck,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useCurrentUser } from "@/store/useAuthStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useUnreadCount, useNotificationStore } from "@/store/useNotificationStore";
import { logout } from "@/lib/api/auth";
import { toast } from "sonner";
import type { UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Route → readable page title map
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/patient/dashboard":    "Dashboard",
  "/patient/doctors":      "Find Doctors",
  "/patient/appointments": "My Appointments",
  "/patient/records":      "Medical Records",
  "/patient/reviews":      "My Reviews",
  "/patient/notifications":"Notifications",
  "/patient/profile":      "My Profile",
  "/doctor/dashboard":     "Dashboard",
  "/doctor/appointments":  "Appointments",
  "/doctor/availability":  "Availability",
  "/doctor/notifications": "Notifications",
  "/doctor/profile":       "My Profile",
  "/admin/dashboard":      "Dashboard",
  "/admin/doctors":        "Manage Doctors",
  "/admin/patients":       "Manage Patients",
  "/admin/appointments":   "Appointments",
  "/admin/audit-logs":     "Audit Logs",
};

const ROLE_ICON: Record<UserRole, React.ElementType> = {
  patient: User,
  doctor: Stethoscope,
  admin: ShieldCheck,
};

const ROLE_COLOR: Record<UserRole, string> = {
  patient: "bg-blue-500",
  doctor:  "bg-emerald-500",
  admin:   "bg-violet-500",
};

const ROLE_LABEL: Record<UserRole, string> = {
  patient: "Patient",
  doctor:  "Doctor",
  admin:   "Admin",
};

// Notification + profile routes per role
const NOTIF_ROUTES: Record<UserRole, string> = {
  patient: ROUTES.PATIENT_NOTIFICATIONS,
  doctor:  ROUTES.DOCTOR_NOTIFICATIONS,
  admin:   ROUTES.ADMIN_DASHBOARD,
};

const PROFILE_ROUTES: Record<UserRole, string> = {
  patient: ROUTES.PATIENT_PROFILE,
  doctor:  ROUTES.DOCTOR_PROFILE,
  admin:   ROUTES.ADMIN_DASHBOARD,
};

const DASHBOARD_ROUTES: Record<UserRole, string> = {
  patient: ROUTES.PATIENT_DASHBOARD,
  doctor:  ROUTES.DOCTOR_DASHBOARD,
  admin:   ROUTES.ADMIN_DASHBOARD,
};

// ─────────────────────────────────────────────────────────────────────────────
// Avatar initials helper
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar component
// ─────────────────────────────────────────────────────────────────────────────

function UserAvatar({
  email, role, size = "md",
}: { email?: string; role?: UserRole; size?: "sm" | "md" }) {
  const initials = email ? getInitials(email) : "?";
  const colorClass = role ? ROLE_COLOR[role] : "bg-slate-400";
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white/20",
        colorClass, sizeClass
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search bar — local page search (can be extended)
// ─────────────────────────────────────────────────────────────────────────────

function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (open) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
        <div
          className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search anything…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
            />
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 py-3 text-xs text-slate-400">
            {query ? (
              <p>No results for &ldquo;<span className="font-medium text-slate-600">{query}</span>&rdquo;</p>
            ) : (
              <p>Type to search across appointments, records, and more…</p>
            )}
          </div>
          <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-3 text-xs text-slate-400">
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">↵</kbd>
            <span>to select</span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">Esc</kbd>
            <span>to close</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/40 -z-10" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="hidden md:flex items-center gap-2.5 h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 hover:border-slate-300 hover:bg-white transition-all duration-200"
      aria-label="Open search"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search…</span>
      <kbd className="ml-1 rounded border border-slate-200 bg-white px-1.5 py-px font-mono text-xs text-slate-400">
        ⌘K
      </kbd>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main TopHeader
// ─────────────────────────────────────────────────────────────────────────────

interface TopHeaderProps {
  onMenuClick: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useCurrentUser();
  const clearUser = useAuthStore((s) => s.clearUser);
  const clearUnread = useNotificationStore((s) => s.clearUnread);
  const unreadCount = useUnreadCount();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const role = user?.role?.toLowerCase() as UserRole | undefined;
  const notifRoute = role ? NOTIF_ROUTES[role] : ROUTES.LOGIN;
  const profileRoute = role ? PROFILE_ROUTES[role] : ROUTES.LOGIN;
  const dashboardRoute = role ? DASHBOARD_ROUTES[role] : "/";
  const RoleIcon = role ? ROLE_ICON[role] : LayoutDashboard;

  // Derive page title from pathname
  const pageTitle = Object.entries(PAGE_TITLES).find(
    ([route]) => pathname === route || pathname.startsWith(route + "/")
  )?.[1] ?? "Dashboard";

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // continue regardless
    } finally {
      clearUser();
      clearUnread();
      router.push(ROUTES.LOGIN);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">

      {/* ── Left — hamburger (mobile) + page title ───────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4.5 w-4.5" size={18} />
        </button>

        {/* Page title — desktop */}
        <div className="hidden lg:flex items-center gap-2.5 min-w-0">
          {/* Back to dashboard pill */}
          <Link
            href={dashboardRoute}
            className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Go to dashboard"
          >
            <LayoutDashboard size={16} />
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="text-sm font-semibold text-slate-800 truncate">{pageTitle}</h1>
        </div>
      </div>

      {/* ── Centre — Search ──────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-2">
        <SearchBar />
      </div>

      {/* ── Right — actions ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2">

        {/* Notification bell */}
        <Link
          href={notifRoute}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              id="user-menu-trigger"
              className={cn(
                "flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200",
                "hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
              aria-label="User menu"
            >
              <UserAvatar email={user?.email} role={role} size="sm" />

              <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
                <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                  {user?.email?.split("@")[0] ?? "User"}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  role === "admin"   ? "bg-violet-100 text-violet-600" :
                  role === "doctor"  ? "bg-emerald-100 text-emerald-600" :
                                      "bg-blue-100 text-blue-600"
                )}>
                  <RoleIcon size={9} />
                  {role ? ROLE_LABEL[role] : ""}
                </span>
              </div>

              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              id="user-menu-content"
              align="end"
              sideOffset={8}
              className={cn(
                "z-50 w-64 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl",
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
              )}
            >
              {/* User info card */}
              <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                <UserAvatar email={user?.email} role={role} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {user?.email?.split("@")[0] ?? "User"}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  <span className={cn(
                    "mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                    role === "admin"  ? "bg-violet-100 text-violet-600" :
                    role === "doctor" ? "bg-emerald-100 text-emerald-600" :
                                       "bg-blue-100 text-blue-600"
                  )}>
                    <RoleIcon size={9} />
                    {role ? ROLE_LABEL[role] : ""}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <DropdownMenu.Item asChild>
                <Link
                  id="menu-profile"
                  href={profileRoute}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700",
                    "cursor-pointer outline-none transition-colors hover:bg-slate-100"
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Your Profile
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link
                  id="menu-settings"
                  href={profileRoute}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700",
                    "cursor-pointer outline-none transition-colors hover:bg-slate-100"
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                    <Settings className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  Settings
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1.5 h-px bg-slate-100" />

              <DropdownMenu.Item
                id="menu-logout"
                onSelect={handleLogout}
                disabled={isLoggingOut}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium",
                  "cursor-pointer outline-none transition-colors",
                  "text-red-600 hover:bg-red-50",
                  "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
                )}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50">
                  <LogOut className="h-3.5 w-3.5 text-red-500" />
                </div>
                {isLoggingOut ? "Signing out…" : "Sign out"}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
