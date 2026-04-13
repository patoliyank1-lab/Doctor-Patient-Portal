"use client";

/**
 * BookButton — client component for the doctor profile page.
 *
 * Visibility rules:
 *   - Guest (not logged in)  → shows button → /auth/login?redirect=/doctors/{id}/book
 *   - Patient                → shows button → /doctors/{id}/book
 *   - Doctor                 → HIDDEN (doctors can't book their own appointments)
 *   - Admin                  → HIDDEN
 *
 * Note: The AuthProvider in the root layout hydrates the auth store
 * via GET /auth/me on every page load. By the time the user sees the
 * page the store is resolved, so no skeleton is needed.
 */

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface BookButtonProps {
  doctorId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BookButton({ doctorId, className = "", size = "md" }: BookButtonProps) {
  const user = useAuthStore((s) => s.user);

  // Hide for doctors and admins
  if (user?.role === "doctor" || user?.role === "admin") return null;

  const bookPath  = `/doctors/${doctorId}/book`;
  const loginPath = `/auth/login?redirect=${bookPath}`;
  const href = user ? bookPath : loginPath;

  const sizeClasses = {
    sm: "h-9 px-4 text-sm gap-1.5",
    md: "h-11 px-5 text-sm gap-2",
    lg: "py-3.5 px-7 text-base gap-2",
  }[size];

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center font-bold text-white rounded-2xl bg-blue-600 shadow-[0_4px_20px_rgba(37,99,235,0.45)] transition-all hover:bg-blue-500 hover:shadow-[0_6px_24px_rgba(37,99,235,0.55)] active:scale-[0.98] ${sizeClasses} ${className}`}
    >
      <CalendarDays className="h-4 w-4 shrink-0" />
      Book Appointment
    </Link>
  );
}

/** Compact sidebar variant — same logic, different visual style */
export function BookButtonSidebar({ doctorId }: { doctorId: string }) {
  const user = useAuthStore((s) => s.user);

  // Hide for doctors and admins
  if (user?.role === "doctor" || user?.role === "admin") return null;

  const bookPath  = `/doctors/${doctorId}/book`;
  const loginPath = `/auth/login?redirect=${bookPath}`;
  const href = user ? bookPath : loginPath;

  return (
    <Link
      href={href}
      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-[0_2px_10px_rgba(37,99,235,0.35)] transition-all hover:bg-blue-700 hover:shadow-[0_4px_16px_rgba(37,99,235,0.45)] active:scale-[0.98]"
    >
      <CalendarDays className="h-4 w-4" />
      Book Appointment
    </Link>
  );
}
