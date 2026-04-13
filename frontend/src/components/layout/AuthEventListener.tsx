"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { ROUTES } from "@/lib/constants";

/**
 * Invisible component — mounts once inside DashboardLayout.
 *
 * Listens for two custom DOM events fired by fetchWithAuth:
 *  - 'mediconnect:auth-expired'  → clears auth state, redirects to login
 *  - 'mediconnect:server-error'  → shows a generic error toast
 */
export function AuthEventListener() {
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);
  const clearUnread = useNotificationStore((s) => s.clearUnread);

  useEffect(() => {
    function handleAuthExpired() {
      clearUser();
      clearUnread();
      toast.error("Session expired", {
        description: "Please log in again to continue.",
      });
      router.push(`${ROUTES.LOGIN}?reason=session-expired`);
    }

    function handleServerError(e: Event) {
      const statusCode = (e as CustomEvent<{ statusCode: number }>).detail
        ?.statusCode;
      toast.error("Server error", {
        description:
          statusCode === 503
            ? "Service temporarily unavailable. Please try again shortly."
            : "Something went wrong on our end. Please try again.",
      });
    }

    window.addEventListener("mediconnect:auth-expired", handleAuthExpired);
    window.addEventListener("mediconnect:server-error", handleServerError);

    return () => {
      window.removeEventListener("mediconnect:auth-expired", handleAuthExpired);
      window.removeEventListener("mediconnect:server-error", handleServerError);
    };
  }, [clearUser, clearUnread, router]);

  // Renders nothing — purely a side-effect component
  return null;
}
