import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PROTECTED_PREFIXES,
  AUTH_PREFIXES,
  ROLE_PREFIX_MAP,
  ROLE_DASHBOARD,
  ROUTES,
} from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// JWT payload decoder (base64 – no signature verification needed in middleware)
// ─────────────────────────────────────────────────────────────────────────────

interface JwtPayload {
  userId: string; // matches backend token.ts: payload.userId
  role: string;
  exp: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const decoded = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the access token cookie set by the backend
  const accessToken =
    request.cookies.get("accessToken")?.value ??
    request.cookies.get("mediconnect_token")?.value;

  // Also read the refresh token — if it exists & is not expired we treat the
  // user as authenticated (fetchWithAuth will silently refresh the access token
  // client-side). This prevents redirect-to-login after the 15-min access
  // token rolls over mid-session.
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const accessPayload  = accessToken  ? decodeJwt(accessToken)  : null;
  const refreshPayload = refreshToken ? decodeJwt(refreshToken) : null;

  const accessValid  = accessPayload  !== null && accessPayload.exp  * 1000 > Date.now();
  const refreshValid = refreshPayload !== null && refreshPayload.exp * 1000 > Date.now();

  // Authenticated = valid access token OR valid refresh token
  const isAuthenticated = accessValid || refreshValid;

  // Derive role from whichever token is valid (prefer access token)
  const payload = accessValid ? accessPayload : (refreshValid ? refreshPayload : null);
  const role = payload ? payload.role.toLowerCase() : null;

  // ── Protected routes (/patient, /doctor, /admin) ─────────────────────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected) {
    // Not authenticated → redirect to login
    if (!isAuthenticated) {
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated but accessing the wrong role's area
    const allowedPrefix = role ? ROLE_PREFIX_MAP[role] : null;
    const isCorrectRole = allowedPrefix
      ? pathname.startsWith(allowedPrefix)
      : false;

    if (!isCorrectRole && role) {
      const dashboard = ROLE_DASHBOARD[role];
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
  }

  // ── Auth routes (/auth/login, /auth/register, etc.) ───────────────────────
  const isAuthRoute = AUTH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isAuthRoute && isAuthenticated && role) {
    // Already logged in — send to their dashboard
    const dashboard = ROLE_DASHBOARD[role];
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  return NextResponse.next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Matcher — run middleware on all routes except static assets
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js)$).*)",
  ],
};
