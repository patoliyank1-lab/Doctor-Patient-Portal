"use client";

/**
 * PublicNavbar — shared navbar for all public pages (/, /about, /doctors).
 *
 * Reads auth state from the global Zustand store (hydrated by AuthProvider).
 *
 * • Not logged in  → "Sign in" + "Get Started" buttons
 * • Loading        → skeleton placeholder (prevents flash)
 * • Logged in      → avatar + role badge + dropdown (Dashboard, Sign out)
 */

import { useState, type ElementType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  User,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useAuthStore, useCurrentUser, useIsAuthenticated } from "@/store/useAuthStore";
import { logout } from "@/lib/api/auth";
import type { UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<UserRole, string> = {
  patient: "bg-blue-600",
  doctor: "bg-emerald-600",
  admin: "bg-violet-600",
};

const ROLE_BADGE: Record<UserRole, string> = {
  patient: "bg-blue-100 text-blue-700",
  doctor: "bg-emerald-100 text-emerald-700",
  admin: "bg-violet-100 text-violet-700",
};

const ROLE_LABEL: Record<UserRole, string> = {
  patient: "Patient",
  doctor: "Doctor",
  admin: "Admin",
};

const ROLE_ICON: Record<UserRole, ElementType> = {
  patient: User,
  doctor: Stethoscope,
  admin: ShieldCheck,
};

const DASHBOARD_ROUTE: Record<UserRole, string> = {
  patient: ROUTES.PATIENT_DASHBOARD,
  doctor: ROUTES.DOCTOR_DASHBOARD,
  admin: ROUTES.ADMIN_DASHBOARD,
};

function getInitials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Avatar circle with initials + role colour ring */
function NavAvatar({ email, role }: { email: string; role: UserRole }) {
  const colorClass = ROLE_COLOR[role];
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold text-xs text-white ring-2 ring-white/30",
        colorClass
      )}
      aria-hidden
    >
      {getInitials(email)}
    </div>
  );
}

/** Skeleton placeholder shown while auth is hydrating */
function NavSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <div className="h-8 w-16 rounded-lg bg-slate-200" />
      <div className="h-8 w-24 rounded-lg bg-slate-200" />
    </div>
  );
}

/** Buttons shown when user is NOT logged in */
function GuestButtons() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={ROUTES.LOGIN}
        id="navbar-signin"
        className="hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors sm:block"
      >
        Sign in
      </Link>
      <Link
        href={ROUTES.REGISTER}
        id="navbar-get-started"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
}

/** Avatar + dropdown shown when user IS logged in */
function UserMenu() {
  const router = useRouter();
  const user = useCurrentUser();
  const clearUser = useAuthStore((s) => s.clearUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const role = user.role as UserRole;
  const RoleIcon = ROLE_ICON[role];
  const dashboardRoute = DASHBOARD_ROUTE[role];

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // ignore — still clear state
    } finally {
      clearUser();
      router.push(ROUTES.LOGIN);
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          id="public-user-menu-trigger"
          className={cn(
            "flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200",
            "hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label="User menu"
        >
          <NavAvatar email={user.email} role={role} />

          <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
            <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
              {user.email.split("@")[0]}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                ROLE_BADGE[role]
              )}
            >
              <RoleIcon size={9} />
              {ROLE_LABEL[role]}
            </span>
          </div>

          <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          id="public-user-menu-content"
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-60 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          )}
        >
          {/* User info card */}
          <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
            <NavAvatar email={user.email} role={role} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.email.split("@")[0]}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                  ROLE_BADGE[role]
                )}
              >
                <RoleIcon size={9} />
                {ROLE_LABEL[role]}
              </span>
            </div>
          </div>

          {/* Go to dashboard */}
          <DropdownMenu.Item asChild>
            <Link
              id="menu-go-dashboard"
              href={dashboardRoute}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700",
                "cursor-pointer outline-none transition-colors hover:bg-slate-100"
              )}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
              </div>
              Go to Dashboard
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1.5 h-px bg-slate-100" />

          {/* Sign out */}
          <DropdownMenu.Item
            id="menu-public-logout"
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile menu
// ─────────────────────────────────────────────────────────────────────────────

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const isAuthenticated = useIsAuthenticated();
  const user = useCurrentUser();
  const role = user?.role as UserRole | undefined;

  if (!isOpen) return null;

  return (
    <div className="border-t border-border bg-background/98 backdrop-blur-sm sm:hidden">
      <nav className="flex flex-col gap-1 px-4 py-3">
        <Link
          href={ROUTES.DOCTORS}
          onClick={onClose}
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Find Doctors
        </Link>
        <Link
          href={ROUTES.ABOUT}
          onClick={onClose}
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          About
        </Link>

        <div className="my-1 h-px bg-border" />

        {isAuthenticated && role ? (
          <>
            <Link
              href={DASHBOARD_ROUTE[role]}
              onClick={onClose}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Go to Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link
              href={ROUTES.LOGIN}
              onClick={onClose}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Sign in
            </Link>
            <Link
              href={ROUTES.REGISTER}
              onClick={onClose}
              className="rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors text-center"
            >
              Get Started
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main PublicNavbar
// ─────────────────────────────────────────────────────────────────────────────

export function PublicNavbar() {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthStore((s) => s.isLoading);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      id="public-navbar"
      className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <Link
          href="/"
          id="navbar-logo"
          className="flex items-center gap-2 font-bold text-foreground shrink-0"
          aria-label="MediConnect home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Stethoscope className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-lg tracking-tight">MediConnect</span>
        </Link>

        {/* ── Desktop nav links ──────────────────────────────────────────── */}
        <nav
          className="hidden items-center gap-6 text-sm font-medium sm:flex"
          aria-label="Public navigation"
        >
          <Link
            href={ROUTES.DOCTORS}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Find Doctors
          </Link>
          <Link
            href={ROUTES.ABOUT}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </nav>

        {/* ── Right section: auth UI ─────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Auth-based rendering */}
          {isLoading ? (
            <NavSkeleton />
          ) : isAuthenticated ? (
            <UserMenu />
          ) : (
            <GuestButtons />
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            id="navbar-mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors sm:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
