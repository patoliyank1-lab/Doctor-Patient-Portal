"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Stethoscope,
  Calendar,
  FileText,
  Star,
  Bell,
  User,
  Clock,
  Users,
  Shield,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { logout } from "@/lib/api/auth";
import { toast } from "sonner";
import type { UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Nav config per role
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  patient: [
    { label: "Dashboard",       href: ROUTES.PATIENT_DASHBOARD,     icon: LayoutDashboard },
    { label: "Find Doctors",    href: ROUTES.PATIENT_DOCTORS,       icon: Stethoscope },
    { label: "Appointments",    href: ROUTES.PATIENT_APPOINTMENTS,  icon: Calendar },
    { label: "Medical Records", href: ROUTES.PATIENT_RECORDS,       icon: FileText },
    { label: "My Reviews",      href: ROUTES.PATIENT_REVIEWS,       icon: Star },
    { label: "Notifications",   href: ROUTES.PATIENT_NOTIFICATIONS, icon: Bell },
    { label: "Profile",         href: ROUTES.PATIENT_PROFILE,       icon: User },
  ],
  doctor: [
    { label: "Dashboard",     href: ROUTES.DOCTOR_DASHBOARD,     icon: LayoutDashboard },
    { label: "Appointments",  href: ROUTES.DOCTOR_APPOINTMENTS,  icon: Calendar },
    { label: "Availability",  href: ROUTES.DOCTOR_AVAILABILITY,  icon: Clock },
    { label: "Notifications", href: ROUTES.DOCTOR_NOTIFICATIONS, icon: Bell },
    { label: "Profile",       href: ROUTES.DOCTOR_PROFILE,       icon: User },
  ],
  admin: [
    { label: "Dashboard",     href: ROUTES.ADMIN_DASHBOARD,     icon: LayoutDashboard },
    { label: "Doctors",       href: ROUTES.ADMIN_DOCTORS,       icon: Stethoscope },
    { label: "Patients",      href: ROUTES.ADMIN_PATIENTS,      icon: Users },
    { label: "Appointments",  href: ROUTES.ADMIN_APPOINTMENTS,  icon: Calendar },
    { label: "Audit Logs",    href: ROUTES.ADMIN_AUDIT_LOGS,    icon: Shield },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar component
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  role: UserRole;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ role, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);
  const clearUnread = useNotificationStore((s) => s.clearUnread);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = NAV_CONFIG[role];

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Continue even if API call fails
    } finally {
      clearUser();
      clearUnread();
      router.push(ROUTES.LOGIN);
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between gap-2 border-b border-sidebar-border px-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-white"
          aria-label="MediConnect home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/20">
            <Stethoscope className="h-5 w-5 text-sidebar-primary" aria-hidden="true" />
          </div>
          <span className="text-base tracking-tight">MediConnect</span>
        </Link>

        {/* Mobile close */}
        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => {
            const isActive =
              item.href === pathname ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    "transition-all duration-150",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-colors",
                      isActive
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                    )}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
            "text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-red-400",
            "transition-all duration-150 disabled:opacity-50"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:shrink-0 h-screen border-r border-sidebar-border">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 animate-slide-in-left shadow-2xl lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
