/**
 * fetchWithAuth — Production-grade fetch interceptor for MediConnect
 *
 * Features:
 *  ✅  Automatic httpOnly-cookie credentials on every request
 *  ✅  Silent 401 → POST /auth/refresh-token → retry original request
 *  ✅  Concurrency guard: only ONE refresh call in-flight at a time
 *  ✅  Request queue: concurrent 401 failures wait for the single refresh,
 *      then all replay together (no duplicate refresh calls)
 *  ✅  Loop guard: retried requests are never re-refreshed
 *  ✅  Auth-endpoint bypass: /auth/* routes skip the refresh flow entirely
 *      (a 401 from /auth/login means "wrong password", NOT "session expired")
 *  ✅  Refresh failure → dispatch auth-expired event → global logout
 *  ✅  5xx → dispatch server-error event → global error toast
 *  ✅  FormData body → no Content-Type override (browser sets multipart boundary)
 *  ✅  204 No Content → returns undefined instead of crashing on json()
 *  ✅  Network error → typed ApiRequestError with statusCode 0
 *
 * Token storage strategy (httpOnly cookies ✅)
 *  - Access token  → short-lived httpOnly cookie   (auto-sent by browser)
 *  - Refresh token → long-lived  httpOnly cookie   (auto-sent by browser)
 *  - Neither token is readable by JS → XSS-proof
 *  - CSRF protection should be handled server-side (SameSite=Lax/Strict)
 */

import { API_BASE_URL, ROUTES } from "@/lib/constants";
import type { ApiError } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// ApiRequestError — typed error thrown by fetchWithAuth
// ─────────────────────────────────────────────────────────────────────────────

export class ApiRequestError extends Error {
  public readonly statusCode: number;
  public readonly field?: string;
  public readonly errors?: ApiError["errors"];

  constructor(
    message: string,
    statusCode: number,
    field?: string,
    errors?: ApiError["errors"]
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.field = field;
    this.errors = errors;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────────────────────

interface FetchWithAuthOptions extends RequestInit {
  /**
   * Internal flag set to `true` on the ONE automatic retry after a token
   * refresh.  Prevents retried requests from triggering another refresh cycle.
   */
  _skipRefresh?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Concurrency state — module-level singletons
//
// Problem: five components all fire requests at once.  The access token is
// expired.  All five get a 401.  Without a guard, all five would call
// POST /auth/refresh-token simultaneously — most would fail because the first
// already rotated the refresh-token cookie.
//
// Solution: one Promise<boolean> stored in `refreshPromise`.
//   - First 401 creates the promise and stores it.
//   - Every subsequent 401 (while refresh is in-flight) awaits the SAME promise.
//   - When the promise resolves, every waiter retries its original request once.
//   - After resolution, `refreshPromise` is reset to null for the next cycle.
// ─────────────────────────────────────────────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchWithAuth<T = unknown>(
  endpoint: string,
  options: FetchWithAuthOptions = {}
): Promise<T> {
  // ── 1. Determine if this is a public auth endpoint ──────────────────────
  //    Auth endpoints (login, register, forgot-password …) are public.
  //    A 401 from them means "invalid credentials", NOT "session expired".
  //    Skipping the refresh flow here prevents false "session expired" toasts.
  const isAuthEndpoint =
    endpoint.startsWith("/auth/") ||
    endpoint.includes("/api/v1/auth/");

  const { _skipRefresh = isAuthEndpoint, ...fetchOptions } = options;

  // ── 2. Build full URL ────────────────────────────────────────────────────
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // ── 3. Build headers ─────────────────────────────────────────────────────
  const headers = new Headers(fetchOptions.headers);

  // Do NOT set Content-Type for FormData — browser must set it with boundary
  if (!(fetchOptions.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  // ── 4. Execute request ───────────────────────────────────────────────────
  let response: Response;

  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include", // always send httpOnly cookies
    });
  } catch {
    // Network failure (offline, DNS, CORS pre-flight blocked, etc.)
    throw new ApiRequestError(
      "Network error. Please check your connection.",
      0
    );
  }

  // ── 5. 401 Unauthorized → silent token refresh ───────────────────────────
  if (response.status === 401 && !_skipRefresh) {
    const refreshSucceeded = await ensureTokenRefreshed();

    if (refreshSucceeded) {
      // Retry the original request exactly once.
      // _skipRefresh: true prevents a second refresh cycle on this retry.
      return fetchWithAuth<T>(endpoint, { ...options, _skipRefresh: true });
    } else {
      // Both access token AND refresh token are expired / invalid.
      // Notify the app so it can clear auth state and redirect to login.
      dispatchAuthExpired();
      throw new ApiRequestError(
        "Your session has expired. Please log in again.",
        401
      );
    }
  }

  // ── 6. 403 Forbidden → insufficient role ────────────────────────────────
  if (response.status === 403) {
    if (typeof window !== "undefined") {
      window.location.href = ROUTES.UNAUTHORIZED;
    }
    throw new ApiRequestError(
      "Access denied. You don't have permission to do this.",
      403
    );
  }

  // ── 7. 5xx Server errors ─────────────────────────────────────────────────
  if (response.status >= 500) {
    dispatchServerError(response.status);
    throw new ApiRequestError(
      "Something went wrong on our end. Please try again later.",
      response.status
    );
  }

  // ── 8. 4xx Client errors (400, 404, 409, 422 …) ──────────────────────────
  if (!response.ok) {
    let errorBody: Partial<ApiError> = {};
    try {
      errorBody = (await response.json()) as Partial<ApiError>;
    } catch {
      // Body is not valid JSON — fall back to generic message
    }

    throw new ApiRequestError(
      errorBody.message ?? "An error occurred. Please try again.",
      response.status,
      errorBody.field,
      errorBody.errors
    );
  }

  // ── 9. 204 No Content ────────────────────────────────────────────────────
  if (response.status === 204) {
    return undefined as T;
  }

  // ── 10. Success — parse JSON ──────────────────────────────────────────────
  return response.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ensureTokenRefreshed
//
// Core concurrency fix.  When multiple requests receive a 401 simultaneously:
//
//   Request A (first):  refreshPromise is null  → creates promise, stores it
//   Request B (second): refreshPromise exists   → awaits same promise (no-op)
//   Request C (third):  refreshPromise exists   → awaits same promise (no-op)
//
//   When the single POST /auth/refresh-token resolves:
//     → refreshPromise resets to null
//     → A, B, C all learn the result and each replays its original request
//
// This guarantees exactly ONE refresh call regardless of how many concurrent
// 401 failures occur.
// ─────────────────────────────────────────────────────────────────────────────

async function ensureTokenRefreshed(): Promise<boolean> {
  if (refreshPromise) {
    // Another request is already refreshing — wait for it
    return refreshPromise;
  }

  // We are the first — kick off the refresh
  refreshPromise = callRefreshEndpoint().finally(() => {
    // Always reset so the next expiry cycle can start fresh
    refreshPromise = null;
  });

  return refreshPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// callRefreshEndpoint
//
// Hits POST /api/v1/auth/refresh-token.
// The backend reads the httpOnly refresh-token cookie, verifies it, and
// sets a new httpOnly access-token cookie on success.
// No token values ever reach JavaScript land.
// ─────────────────────────────────────────────────────────────────────────────

async function callRefreshEndpoint(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",       // send refresh-token cookie
      headers: { "Content-Type": "application/json" },
    });

    // 200 → new access token cookie is now set by the backend
    // 401 → refresh token missing / expired / invalid → must logout
    return res.ok;
  } catch {
    // Network error during refresh → treat as failure → logout
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// dispatchAuthExpired
//
// Fires a CustomEvent on window.  A top-level client component
// (AuthEventListener) listens for it and:
//   1. Calls clearUser() on the Zustand auth store
//   2. Redirects to /auth/login
//
// This decouples the lib layer from React / Next.js router.
// ─────────────────────────────────────────────────────────────────────────────

function dispatchAuthExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mediconnect:auth-expired"));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// dispatchServerError
// ─────────────────────────────────────────────────────────────────────────────

function dispatchServerError(statusCode: number): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("mediconnect:server-error", { detail: { statusCode } })
    );
  }
}
