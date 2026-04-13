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
// fetchWithAuth options
// ─────────────────────────────────────────────────────────────────────────────

interface FetchWithAuthOptions extends RequestInit {
  /**
   * Internal flag — set to true during a retry after token refresh.
   * Prevents infinite refresh loops.
   */
  _skipRefresh?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps the native fetch() with:
 * - Automatic cookie credentials on every request
 * - Silent 401 → refresh token → retry flow
 * - 403 redirect to /unauthorized
 * - 500+ generic error event (caught by global error listener)
 * - Typed error parsing from API error responses
 * - Empty response handling (204 No Content)
 *
 * Usage:
 *   const user = await fetchWithAuth<User>("/auth/me");
 *   const data = await fetchWithAuth<Appointment[]>("/appointments/my");
 */
export async function fetchWithAuth<T = unknown>(
  endpoint: string,
  options: FetchWithAuthOptions = {}
): Promise<T> {
  const { _skipRefresh = false, ...fetchOptions } = options;

  // ── Build full URL ────────────────────────────────────────────────────────
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // ── Build headers ─────────────────────────────────────────────────────────
  const headers = new Headers(fetchOptions.headers);

  // Do NOT set Content-Type for FormData — browser must set it with boundary
  if (!(fetchOptions.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  // ── Make the request ──────────────────────────────────────────────────────
  let response: Response;

  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include", // always send cookies
    });
  } catch {
    // Network error (offline, CORS failure, etc.)
    throw new ApiRequestError(
      "Network error. Please check your connection.",
      0
    );
  }

  // ── 401 Unauthorized → Try silent refresh ─────────────────────────────────
  if (response.status === 401 && !_skipRefresh) {
    const refreshed = await tryRefreshToken();

    if (refreshed) {
      // Retry the original request once with refresh guard enabled
      return fetchWithAuth<T>(endpoint, {
        ...options,
        _skipRefresh: true,
      });
    } else {
      // Both access and refresh tokens are expired
      dispatchAuthExpired();
      throw new ApiRequestError(
        "Your session has expired. Please log in again.",
        401
      );
    }
  }

  // ── 403 Forbidden → Role mismatch ─────────────────────────────────────────
  if (response.status === 403) {
    if (typeof window !== "undefined") {
      window.location.href = ROUTES.UNAUTHORIZED;
    }
    throw new ApiRequestError("Access denied. You don't have permission.", 403);
  }

  // ── 5xx Server Error ──────────────────────────────────────────────────────
  if (response.status >= 500) {
    dispatchServerError(response.status);
    throw new ApiRequestError(
      "Something went wrong on our end. Please try again later.",
      response.status
    );
  }

  // ── Client errors (400, 404, 409, 422…) ──────────────────────────────────
  if (!response.ok) {
    let errorBody: Partial<ApiError> = {};
    try {
      errorBody = (await response.json()) as Partial<ApiError>;
    } catch {
      // Response body is not valid JSON — use generic message
    }

    throw new ApiRequestError(
      errorBody.message ?? "An error occurred. Please try again.",
      response.status,
      errorBody.field,
      errorBody.errors
    );
  }

  // ── 204 No Content ────────────────────────────────────────────────────────
  if (response.status === 204) {
    return undefined as T;
  }

  // ── Success — parse JSON ──────────────────────────────────────────────────
  return response.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempt to refresh the access token using the refresh token cookie.
 * Returns true if the refresh succeeded, false otherwise.
 */
async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fire a CustomEvent so that a top-level client component can
 * clear auth state and redirect to /auth/login.
 * This avoids a direct router dependency inside a lib file.
 */
function dispatchAuthExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mediconnect:auth-expired"));
  }
}

/**
 * Fire a CustomEvent so that the global error handler can show
 * a generic "Server error" toast without coupling lib to Sonner.
 */
function dispatchServerError(statusCode: number): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("mediconnect:server-error", { detail: { statusCode } })
    );
  }
}
