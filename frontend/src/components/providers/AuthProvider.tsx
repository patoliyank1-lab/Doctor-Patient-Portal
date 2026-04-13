"use client";

/**
 * AuthProvider — runs once on app mount to hydrate the Zustand auth store.
 *
 * Calls GET /auth/me with the httpOnly access-token cookie.
 * On success → setUser()
 * On 401     → clearUser() (triggers silent refresh via fetchWithAuth)
 * On error   → clearUser()
 *
 * This ensures `isLoading` resolves quickly on EVERY page, including
 * public pages like /doctors/[id] where no login flow runs.
 */

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { AuthUser } from "@/types";

interface MeResponse {
  data: AuthUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const res = await fetchWithAuth<MeResponse>("/auth/me");
        if (!cancelled && res?.data) {
          // Normalise role to lowercase to match UserRole type ("patient"|"doctor"|"admin")
          const user: AuthUser = {
            ...res.data,
            role: (res.data.role as string).toLowerCase() as AuthUser["role"],
          };
          setUser(user);
        } else if (!cancelled) {
          clearUser();
        }
      } catch {
        // Not logged in — clear loading state
        if (!cancelled) clearUser();
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
