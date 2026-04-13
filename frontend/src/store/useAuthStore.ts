import { create } from "zustand";
import type { User } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────────────────────────────────────

interface AuthState {
  /** The currently logged-in user, or null if unauthenticated. */
  user: User | null;

  /**
   * True while the initial auth check (GET /auth/me) is in flight.
   * Used to show a full-page loading state on app mount so the UI
   * doesn't flash a logged-out state before hydration completes.
   */
  isLoading: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Actions shape
// ─────────────────────────────────────────────────────────────────────────────

interface AuthActions {
  /**
   * Set the logged-in user.
   * Called after a successful login or after /auth/me returns a user.
   */
  setUser: (user: User) => void;

  /**
   * Clear the logged-in user.
   * Called on logout, account deactivation, or when the
   * 'mediconnect:auth-expired' event fires (both tokens expired).
   */
  clearUser: () => void;

  /**
   * Toggle the loading state during the initial auth hydration.
   */
  setLoading: (isLoading: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  user: null,
  isLoading: true, // true until the first /auth/me check completes

  // ── Actions ───────────────────────────────────────────────────────────────
  setUser: (user) => set({ user, isLoading: false }),

  clearUser: () => set({ user: null, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Selectors (use these in components for optimal re-render performance)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if a user is currently authenticated.
 * Components using this only re-render when auth status changes.
 *
 * @example
 * const isAuthenticated = useIsAuthenticated();
 */
export const useIsAuthenticated = () =>
  useAuthStore((s) => s.user !== null);

/**
 * Returns the current user's role, or null if not authenticated.
 *
 * @example
 * const role = useUserRole();
 * if (role === "admin") { ... }
 */
export const useUserRole = () =>
  useAuthStore((s) => s.user?.role ?? null);

/**
 * Returns the current user object.
 *
 * @example
 * const user = useCurrentUser();
 */
export const useCurrentUser = () =>
  useAuthStore((s) => s.user);
