import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Doctor, PaginatedResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface DoctorProfilePayload {
  specialization: string;
  qualifications: string[];
  experience: number;
  bio: string;
  consultationFee: number;
  clinicName?: string;
  clinicAddress?: string;
  phone: string;
}

export interface DoctorListParams {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public / Auth Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// Internal response shape from this backend endpoint
interface DoctorListResponse {
  doctors: Doctor[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

/** GET /doctors — List all approved doctors. Supports search, filter, pagination. */
export async function getDoctors(
  params: DoctorListParams = {}
): Promise<PaginatedResponse<Doctor>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.search) query.set("search", params.search);
  if (params.specialization) query.set("specialization", params.specialization);
  if (params.status) query.set("status", params.status);

  const res = await fetchWithAuth<DoctorListResponse>(`/doctors?${query}`);

  // Normalise to the standard PaginatedResponse shape used everywhere in the app
  return {
    data: res.doctors ?? [],
    total: res.pagination?.total ?? 0,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
    totalPages: res.pagination?.totalPages ?? 1,
  };
}

/** GET /doctors/:id — Get a single doctor's public profile. */
export async function getDoctorById(id: string): Promise<Doctor> {
  return fetchWithAuth<Doctor>(`/doctors/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** GET /doctors/pending — List doctors awaiting admin approval. */
export async function getPendingDoctors(): Promise<Doctor[]> {
  return fetchWithAuth<Doctor[]>("/doctors/pending");
}

/**
 * PUT /doctors/:id/status — Update a doctor's status.
 * @param status - "approved" | "rejected" | "suspended"
 */
export async function updateDoctorStatus(
  id: string,
  status: "approved" | "rejected" | "suspended"
): Promise<Doctor> {
  return fetchWithAuth<Doctor>(`/doctors/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctor Self-Management Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** GET /doctors/me — Get the logged-in doctor's own profile. */
export async function getMyDoctorProfile(): Promise<Doctor> {
  return fetchWithAuth<Doctor>("/doctors/me");
}

/** POST /doctors/me — Create the logged-in doctor's profile. */
export async function createMyDoctorProfile(
  payload: DoctorProfilePayload
): Promise<Doctor> {
  return fetchWithAuth<Doctor>("/doctors/me", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** PUT /doctors/me — Update the logged-in doctor's profile. */
export async function updateMyDoctorProfile(
  payload: Partial<DoctorProfilePayload>
): Promise<Doctor> {
  return fetchWithAuth<Doctor>("/doctors/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /doctors/me/image — Update the logged-in doctor's profile image.
 * Accepts a FormData body (Content-Type is set automatically by the browser).
 */
export async function updateDoctorImage(formData: FormData): Promise<Doctor> {
  return fetchWithAuth<Doctor>("/doctors/me/image", {
    method: "PUT",
    body: formData,
  });
}

/** PUT /doctors/me/deactivate — Deactivate the logged-in doctor's own account. */
export async function deactivateDoctorAccount(): Promise<void> {
  return fetchWithAuth<void>("/doctors/me/deactivate", { method: "PUT" });
}
