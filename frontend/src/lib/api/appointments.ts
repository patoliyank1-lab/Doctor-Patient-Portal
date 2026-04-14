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

export type AppointmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  status?: AppointmentStatus;
  search?: string;
  doctorId?: string;
  patientId?: string;
  /** YYYY-MM-DD — used by /appointments/my (patient/doctor endpoint) */
  date?: string;
  /** YYYY-MM-DD — used by /appointments (admin endpoint) */
  dateFrom?: string;
  /** YYYY-MM-DD — used by /appointments (admin endpoint) */
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

// Internal shape returned by this backend endpoint
interface AppointmentListResponse {
  appointments: Appointment[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
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
  if (params.date) query.set("date", params.date);

  const res = await fetchWithAuth<AppointmentListResponse>(`/appointments/my?${query}`);
  return {
    data: res.appointments ?? [],
    total: res.pagination?.total ?? 0,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
    totalPages: res.pagination?.totalPages ?? 1,
  };
}

/** Helper: GET /appointments/my?status=approved — Get upcoming (approved) appointments. */
export async function getUpcomingAppointments(
  limit = 5
): Promise<PaginatedResponse<Appointment>> {
  return getMyAppointments({ limit, status: "approved" });
}

/** Helper: Get the total count of pending appointments. */
export async function getPendingCount(): Promise<number> {
  const res = await getMyAppointments({ limit: 1, status: "pending" });
  return res.total;
}

/** Helper: Get the total count of all appointments. */
export async function getTotalCount(): Promise<number> {
  const res = await getMyAppointments({ limit: 1 });
  return res.total;
}

/** Helper: Get the total count of completed appointments. */
export async function getCompletedCount(): Promise<number> {
  const res = await getMyAppointments({ limit: 1, status: "completed" });
  return res.total;
}

/** Helper: Get the total count of cancelled appointments. */
export async function getCancelledCount(): Promise<number> {
  const res = await getMyAppointments({ limit: 1, status: "cancelled" });
  return res.total;
}

/** PUT /appointments/:id/cancel — Cancel an appointment (Patient). */
export async function cancelAppointment(
  id: string,
  cancelReason?: string
): Promise<Appointment> {
  return fetchWithAuth<Appointment>(`/appointments/${id}/cancel`, {
    method: "PUT",
    body: JSON.stringify({ cancelReason: cancelReason?.trim() || undefined }),
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
 * @param rejectionReason - required when status is "rejected"
 */
export async function updateAppointmentStatus(
  id: string,
  status: "approved" | "rejected" | "completed",
  rejectionReason?: string
): Promise<Appointment> {
  return fetchWithAuth<Appointment>(`/appointments/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, ...(rejectionReason ? { rejectionReason } : {}) }),
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
