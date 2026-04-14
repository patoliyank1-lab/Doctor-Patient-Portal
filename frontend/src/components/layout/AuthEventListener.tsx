"use client";

/**
 * AuthEventListener
 *
 * A zero-UI component mounted inside DashboardLayout that listens for
 * global CustomEvents dispatched by fetchWithAuth:
 *
 *  • "mediconnect:auth-expired"  — both access + refresh tokens expired.
 *    Clears Zustand auth state and redirects to login.
 *
 *  • "mediconnect:server-error"  — a 5xx response was received.
 *    Shows a toast so the user knows something went wrong.
 *
 * Why a separate component from AuthProvider?
 *  AuthProvider wraps the whole app and handles initial hydration.
 *  This component is an additional, dashboard-scoped listener that
 *  ensures the event is handled even if AuthProvider ever unmounts,
 *  and makes the intent explicit in DashboardLayout.
 *
 * Renders: null — no DOM output.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { ROUTES } from "@/lib/constants";

export function AuthEventListener() {
  const router      = useRouter();
  const clearUser   = useAuthStore((s) => s.clearUser);
  const clearUnread = useNotificationStore((s) => s.clearUnread);

  // ── "mediconnect:auth-expired" ─────────────────────────────────────────────
  // Fired by fetchWithAuth when both access-token and refresh-token are dead.
  // Clears local auth state and sends the user to the login page.
  useEffect(() => {
    function handleAuthExpired() {
      clearUser();
      clearUnread();
      toast.error("Session expired", {
        description: "Please log in again to continue.",
        duration: 5000,
        id: "session-expired", // deduplicate if AuthProvider also fires
      });
      router.push(`${ROUTES.LOGIN}?reason=session-expired`);
    }

    window.addEventListener("mediconnect:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("mediconnect:auth-expired", handleAuthExpired);
    };
  }, [clearUser, clearUnread, router]);

  // ── "mediconnect:server-error" ─────────────────────────────────────────────
  // Fired by fetchWithAuth on any 5xx response.
  // Shows a toast — the request itself already threw, so components can
  // additionally handle it; this is the fallback global notification.
  useEffect(() => {
    function handleServerError(e: Event) {
      const statusCode = (e as CustomEvent<{ statusCode: number }>).detail
        ?.statusCode;
      toast.error("Server error", {
        description:
          statusCode === 503
            ? "Service temporarily unavailable. Please try again shortly."
            : "Something went wrong on our end. Please try again.",
        id: "server-error", // deduplicate rapid-fire 5xx responses
      });
    }

    window.addEventListener("mediconnect:server-error", handleServerError);
    return () => {
      window.removeEventListener("mediconnect:server-error", handleServerError);
    };
  }, []);

  // Renders nothing — purely event-driven side effects.
  return null;
}
