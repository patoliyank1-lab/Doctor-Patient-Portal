import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Appointment, PaginatedResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface BookAppointmentPayload {
  slotId: string;
  reason: string;
}

export interface ReschedulePayload {
  slotId: string;
}

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  doctorId?: string;
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** POST /appointments — Book a new appointment. */
export async function bookAppointment(
  payload: BookAppointmentPayload
): Promise<Appointment> {
  return fetchWithAuth<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * GET /appointments/my — Get the logged-in user's appointments.
 * Works for both patients and doctors.
 */
export async function getMyAppointments(
  params: AppointmentListParams = {}
): Promise<PaginatedResponse<Appointment>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);

  return fetchWithAuth<PaginatedResponse<Appointment>>(
    `/appointments/my?${query}`
  );
}

/** PUT /appointments/:id/cancel — Cancel an appointment (Patient). */
export async function cancelAppointment(id: string): Promise<Appointment> {
  return fetchWithAuth<Appointment>(`/appointments/${id}/cancel`, {
    method: "PUT",
  });
}

/** PUT /appointments/:id/reschedule — Reschedule to a new slot (Patient). */
export async function rescheduleAppointment(
  id: string,
  payload: ReschedulePayload
): Promise<Appointment> {
  return fetchWithAuth<Appointment>(`/appointments/${id}/reschedule`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctor Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /appointments/:id/status — Update appointment status (Doctor).
 * @param status - "approved" | "rejected" | "completed"
 */
export async function updateAppointmentStatus(
  id: string,
  status: "approved" | "rejected" | "completed"
): Promise<Appointment> {
  return fetchWithAuth<Appointment>(`/appointments/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

/** PUT /appointments/:id/notes — Add or update clinical notes (Doctor). */
export async function addAppointmentNotes(
  id: string,
  notes: string
): Promise<Appointment> {
  return fetchWithAuth<Appointment>(`/appointments/${id}/notes`, {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Endpoint
// ─────────────────────────────────────────────────────────────────────────────

/** GET /appointments/:id — Get a single appointment's full detail. */
export async function getAppointmentById(id: string): Promise<Appointment> {
  return fetchWithAuth<Appointment>(`/appointments/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Endpoint
// ─────────────────────────────────────────────────────────────────────────────

/** GET /appointments — List all appointments with filters (Admin). */
export async function getAllAppointments(
  params: AppointmentListParams = {}
): Promise<PaginatedResponse<Appointment>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.doctorId) query.set("doctorId", params.doctorId);
  if (params.patientId) query.set("patientId", params.patientId);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);

  return fetchWithAuth<PaginatedResponse<Appointment>>(
    `/appointments?${query}`
  );
}
