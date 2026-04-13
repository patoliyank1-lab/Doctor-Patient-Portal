import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Patient, PaginatedResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface PatientProfilePayload {
  name?: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address?: string;
  bloodGroup?: string;
  allergies?: string[];
}

export interface PatientListParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin / Doctor Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** GET /patients — List all patients (Admin only). */
export async function getAllPatients(
  params: PatientListParams = {}
): Promise<PaginatedResponse<Patient>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.search) query.set("search", params.search);

  return fetchWithAuth<PaginatedResponse<Patient>>(`/patients?${query}`);
}

/** GET /patients/:id — Get a specific patient's profile (Admin or Doctor). */
export async function getPatientById(id: string): Promise<Patient> {
  return fetchWithAuth<Patient>(`/patients/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient Self-Management Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** GET /patients/me — Get the logged-in patient's own profile. */
export async function getMyPatientProfile(): Promise<Patient> {
  return fetchWithAuth<Patient>("/patients/me");
}

/** PUT /patients/me — Update the logged-in patient's profile. */
export async function updateMyPatientProfile(
  payload: Partial<PatientProfilePayload>
): Promise<Patient> {
  return fetchWithAuth<Patient>("/patients/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /patients/me/image — Update the logged-in patient's profile image.
 * Accepts a FormData body (Content-Type set automatically by browser).
 */
export async function updatePatientImage(formData: FormData): Promise<Patient> {
  return fetchWithAuth<Patient>("/patients/me/image", {
    method: "PUT",
    body: formData,
  });
}
