"use client";

/**
 * AuthProvider — runs once on app mount to hydrate the Zustand auth store.
 *
 * Responsibilities:
 *  1. GET /auth/me on mount → setUser() or clearUser() (initial hydration)
 *  2. Listens for 'mediconnect:auth-expired' from fetchWithAuth:
 *       → clearUser(), toast, redirect to /auth/login
 *     This listener runs on EVERY page (public, auth, dashboard) because
 *     AuthProvider wraps the entire app in the root layout.
 *  3. Listens for 'mediconnect:server-error' → shows a global toast
 *  4. Periodic re-validation every 4 minutes so the Zustand store stays in
 *     sync if the user's session expires while the tab is open.
 *
 * Token strategy: httpOnly cookies (no JS access — XSS-proof).
 * fetchWithAuth handles the 401→refresh→retry cycle transparently.
 */

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { ROUTES } from "@/lib/constants";
import { useNotificationStore } from "@/store/useNotificationStore";
import type { AuthUser } from "@/types";


// How often to silently re-validate the session in the background (ms)
const REVALIDATION_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router     = useRouter();
  const setUser    = useAuthStore((s) => s.setUser);
  const clearUser  = useAuthStore((s) => s.clearUser);
  const clearUnread = useNotificationStore((s) => s.clearUnread);

  // ── Core hydration helper ──────────────────────────────────────────────────
  const hydrate = useCallback(async () => {
    try {
      const user = await fetchWithAuth<AuthUser>("/auth/me", {
        // Skip the 401→refresh cycle during hydration.
        // _silentOn401 makes fetchWithAuth return null on 401 instead of
        // throwing — so "not logged in" produces zero console noise.
        _skipRefresh: true,
        _silentOn401: true,
      });
      if (user?.id) {
        setUser({
          ...user,
          role: (user.role as string).toLowerCase() as AuthUser["role"],
        });
      } else {
        clearUser();
      }
    } catch {
      // Any unexpected error (network, 5xx) → clear user silently
      clearUser();
    }
  }, [setUser, clearUser]);

  // ── 1. Initial mount hydration ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!cancelled) await hydrate();
    }

    run();
    return () => { cancelled = true; };
  }, [hydrate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Periodic background re-validation ───────────────────────────────────
  // Silently re-checks the session every N minutes while the tab is open.
  // Ensures Zustand state matches server reality (e.g. token rotated elsewhere).
  useEffect(() => {
    const timerId = setInterval(() => {
      // Only re-validate if a user is currently thought to be logged in
      if (useAuthStore.getState().user !== null) {
        void hydrate();
      }
    }, REVALIDATION_INTERVAL_MS);

    return () => clearInterval(timerId);
  }, [hydrate]);

  // ── 3. Global auth-expired event (fires from fetchWithAuth on any page) ────
  // fetchWithAuth dispatches this when both access + refresh tokens are dead.
  useEffect(() => {
    function handleAuthExpired() {
      clearUser();
      clearUnread();
      toast.error("Session expired", {
        description: "Please log in again to continue.",
        duration: 5000,
      });
      router.push(`${ROUTES.LOGIN}?reason=session-expired`);
    }

    window.addEventListener("mediconnect:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("mediconnect:auth-expired", handleAuthExpired);
    };
  }, [clearUser, clearUnread, router]);

  // ── 4. Global server-error event (fires from fetchWithAuth on 5xx) ─────────
  useEffect(() => {
    function handleServerError(e: Event) {
      const statusCode = (e as CustomEvent<{ statusCode: number }>).detail?.statusCode;
      toast.error("Server error", {
        description:
          statusCode === 503
            ? "Service temporarily unavailable. Please try again shortly."
            : "Something went wrong on our end. Please try again.",
      });
    }

    window.addEventListener("mediconnect:server-error", handleServerError);
    return () => {
      window.removeEventListener("mediconnect:server-error", handleServerError);
    };
  }, []);

  return <>{children}</>;
}

