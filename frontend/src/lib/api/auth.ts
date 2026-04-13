import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { User, AuthResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  role: "patient" | "doctor";
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** POST /auth/register — Register a new patient or doctor account. */
export async function register(
  payload: RegisterPayload
): Promise<AuthResponse> {
  return fetchWithAuth<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /auth/login — Log in and receive HttpOnly cookies. */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return fetchWithAuth<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /auth/logout — Invalidate tokens and clear cookies. */
export async function logout(): Promise<void> {
  return fetchWithAuth<void>("/auth/logout", { method: "POST" });
}

/** POST /auth/verify-email — Verify email using token from email link. */
export async function verifyEmail(
  token: string
): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

/** POST /auth/forgot-password — Send a password reset email. */
export async function forgotPassword(
  email: string
): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/** POST /auth/reset-password — Set a new password using reset token. */
export async function resetPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

/** GET /auth/me — Get the currently authenticated user. */
export async function getMe(): Promise<User> {
  return fetchWithAuth<User>("/auth/me");
}
