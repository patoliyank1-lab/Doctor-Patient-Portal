/**
 * fetchWithAuth — Production-grade fetch interceptor for MediConnect
 *
 * Features:
 *  ✅  Automatic httpOnly-cookie credentials on every request
 *  ✅  SSR cookie forwarding for Next.js Server Components
 *  ✅  Silent 401 → POST /auth/refresh-token → retry original request
 *  ✅  Concurrency guard: only ONE refresh call in-flight at a time
 *  ✅  Request deduplication: identical parallel GETs share the same promise
 *  ✅  Loop guard: retried requests are never re-refreshed
 *  ✅  Auth-endpoint bypass: /auth/* routes skip the refresh flow entirely
 *  ✅  Refresh failure → dispatch auth-expired event → global logout
 *  ✅  5xx → dispatch server-error event → global error toast
 *  ✅  FormData body → no Content-Type override (browser sets multipart boundary)
 *  ✅  204 No Content → returns undefined instead of crashing on json()
 *  ✅  Network error → typed ApiRequestError with statusCode 0
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
  /** Internal: prevents retried requests from triggering another refresh. */
  _skipRefresh?: boolean;
  /**
   * When true combined with _skipRefresh, a 401 response returns null
   * instead of throwing — useful for auth hydration checks where
   * "not logged in" is a perfectly valid non-error state.
   */
  _silentOn401?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level singletons
// ─────────────────────────────────────────────────────────────────────────────

/** Single in-flight refresh promise — prevents parallel token refresh floods */
let refreshPromise: Promise<boolean> | null = null;

/**
 * In-flight GET request map.
 * If two identical GET requests fire simultaneously, the second one
 * returns the same Promise as the first — zero duplicate network calls.
 */
const inflightRequests = new Map<string, Promise<unknown>>();

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchWithAuth<T = unknown>(
  endpoint: string,
  options: FetchWithAuthOptions = {}
): Promise<T> {
  // ── 1. Auth endpoint check ────────────────────────────────────────────────
  const isAuthEndpoint =
    endpoint.startsWith("/auth/") ||
    endpoint.includes("/api/v1/auth/");

  const { _skipRefresh = isAuthEndpoint, ...fetchOptions } = options;

  // ── 2. Build full URL ─────────────────────────────────────────────────────
  // On the browser: API_BASE_URL may be a relative path (e.g. "/api/v1") which
  //   goes through the Next.js rewrites proxy → no CORS issue.
  // On the server (SSR/RSC): relative URLs don't work, so we call the backend
  //   directly using BACKEND_URL (server-only env var, not exposed to browser).
  const resolvedBase =
    typeof window === "undefined" && API_BASE_URL.startsWith("/")
      ? `${process.env.BACKEND_URL ?? "http://localhost:4000"}${API_BASE_URL}`
      : API_BASE_URL;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${resolvedBase}${endpoint}`;

  const method = (fetchOptions.method ?? "GET").toUpperCase();

  // ── 3. GET deduplication ──────────────────────────────────────────────────
  // NOTE: Skip dedup for retry requests (_skipRefresh=true).
  // A retry is triggered when a 401 is received and the token is refreshed.
  // If we allowed the retry to hit the cache, it would return the *same original
  // promise* that is itself waiting for the retry → circular deadlock →
  // Promise.allSettled never settles → infinite loading spinner.
  const requestKey = `${method}:${url}`;
  if (method === "GET" && !_skipRefresh && inflightRequests.has(requestKey)) {
    return inflightRequests.get(requestKey) as Promise<T>;
  }


  // ── 4. Execute in a lockable promise ─────────────────────────────────────
  const executionPromise = (async (): Promise<T> => {
    // 4a. Build headers
    const headers = new Headers(fetchOptions.headers);
    if (!(fetchOptions.body instanceof FormData)) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }

    // 4b. SSR: forward the browser's cookies to the backend
    if (typeof window === "undefined") {
      try {
        const { cookies } = await import("next/headers");
        // @ts-ignore — works for both sync & async cookies() in Next.js 13–15
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        if (allCookies?.length > 0) {
          const cookieStr = allCookies
            .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
            .join("; ");
          if (!headers.has("cookie")) {
            headers.set("cookie", cookieStr);
          }
        }
      } catch {
        // next/headers unavailable in this context — safe to ignore
      }
    }

    // 4c. Default SSR cache (avoids busting Next.js data cache on every render)
    if (
      method === "GET" &&
      typeof window === "undefined" &&
      !fetchOptions.cache &&
      !(fetchOptions as any).next
    ) {
      (fetchOptions as any).next = { revalidate: 60 };
    }

    // ── 5. Execute the request ────────────────────────────────────────────
    let response: Response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers,
        // On the server we forward cookies manually via the "cookie" header above.
        // Using credentials: "include" on SSR causes Next.js to auto-set
        // cache: "no-store", blowing away the data cache and causing repeated calls.
        // On the browser we still need credentials: "include" for HttpOnly cookies.
        credentials: typeof window === "undefined" ? "same-origin" : "include",
      });
    } catch {
      throw new ApiRequestError(
        "Network error. Please check your connection.",
        0
      );
    }

    // ── 6. 401 → silent token refresh ─────────────────────────────────────
    if (response.status === 401) {
      // If caller opted into silent mode (e.g. auth hydration check),
      // simply return null — "not logged in" is not an error.
      if (_skipRefresh && (options as FetchWithAuthOptions)._silentOn401) {
        return null as T;
      }
      if (!_skipRefresh) {
        const refreshSucceeded = await ensureTokenRefreshed();
        if (refreshSucceeded) {
          return fetchWithAuth<T>(endpoint, { ...options, _skipRefresh: true });
        } else {
          dispatchAuthExpired();
          throw new ApiRequestError(
            "Your session has expired. Please log in again.",
            401
          );
        }
      }
    }

    // ── 7. 403 Forbidden ──────────────────────────────────────────────────
    if (response.status === 403) {
      if (typeof window !== "undefined") {
        window.location.href = ROUTES.UNAUTHORIZED;
      }
      throw new ApiRequestError(
        "Access denied. You don't have permission to do this.",
        403
      );
    }

    // ── 8. 5xx Server errors ──────────────────────────────────────────────
    if (response.status >= 500) {
      dispatchServerError(response.status);
      throw new ApiRequestError(
        "Something went wrong on our end. Please try again later.",
        response.status
      );
    }

    // ── 9. 4xx Client errors ──────────────────────────────────────────────
    if (!response.ok) {
      let errorBody: Partial<ApiError> = {};
      try {
        errorBody = (await response.json()) as Partial<ApiError>;
      } catch {
        // Non-JSON body — fall back to generic message
      }
      throw new ApiRequestError(
        errorBody.message ?? "An error occurred. Please try again.",
        response.status,
        errorBody.field,
        errorBody.errors
      );
    }

    // ── 10. 204 No Content ────────────────────────────────────────────────
    if (response.status === 204) {
      return undefined as T;
    }

    // ── 11. Success — parse JSON and unwrap the backend envelope ─────────────
    // Every backend success response is shaped:
    //   { success: true, message: string, data: T, errors: null }
    // We automatically unwrap `.data` so callers receive `T` directly.
    const body = await response.json();
    if (
      body !== null &&
      typeof body === "object" &&
      "success" in body &&
      body.success === true &&
      "data" in body
    ) {
      return body.data as T;
    }
    // Fallback: return as-is for non-envelope shaped responses
    return body as T;
  })();

  // Register the in-flight promise so duplicate GETs are collapsed
  if (method === "GET") {
    inflightRequests.set(requestKey, executionPromise);
    executionPromise.finally(() => inflightRequests.delete(requestKey));
  }

  return executionPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// ensureTokenRefreshed — singleton refresh guard
// ─────────────────────────────────────────────────────────────────────────────

async function ensureTokenRefreshed(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = callRefreshEndpoint().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// callRefreshEndpoint
// ─────────────────────────────────────────────────────────────────────────────

async function callRefreshEndpoint(): Promise<boolean> {
  try {
    const resolvedBase =
      typeof window === "undefined" && API_BASE_URL.startsWith("/")
        ? `${process.env.BACKEND_URL ?? "http://localhost:4000"}${API_BASE_URL}`
        : API_BASE_URL;
    const res = await fetch(`${resolvedBase}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Event dispatchers
// ─────────────────────────────────────────────────────────────────────────────

function dispatchAuthExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mediconnect:auth-expired"));
  }
}

function dispatchServerError(statusCode: number): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("mediconnect:server-error", { detail: { statusCode } })
    );
  }
}
