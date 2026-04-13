import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Slot } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSlotPayload {
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
}

export interface BulkSlotPayload {
  startDate: string;    // "YYYY-MM-DD"
  endDate: string;      // "YYYY-MM-DD"
  startTime: string;    // "HH:mm"
  endTime: string;      // "HH:mm"
  daysOfWeek: number[]; // 0=Sun, 1=Mon … 6=Sat
}

export interface UpdateSlotPayload {
  date?: string;
  startTime?: string;
  endTime?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Doctor Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** POST /slots — Create a single availability slot (Doctor). */
export async function createSlot(payload: CreateSlotPayload): Promise<Slot> {
  return fetchWithAuth<Slot>("/slots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /slots/bulk — Create multiple slots at once (Doctor). */
export async function createBulkSlots(
  payload: BulkSlotPayload
): Promise<Slot[]> {
  return fetchWithAuth<Slot[]>("/slots/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /slots/my — Get all slots belonging to the logged-in doctor. */
export async function getMySlots(params?: {
  date?: string;
}): Promise<Slot[]> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  const qs = query.toString();
  return fetchWithAuth<Slot[]>(`/slots/my${qs ? `?${qs}` : ""}`);
}

/** PUT /slots/:id — Update a slot's date or time (Doctor). */
export async function updateSlot(
  id: string,
  payload: UpdateSlotPayload
): Promise<Slot> {
  return fetchWithAuth<Slot>(`/slots/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** DELETE /slots/:id — Delete a slot (only if not already booked). */
export async function deleteSlot(id: string): Promise<void> {
  return fetchWithAuth<void>(`/slots/${id}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient Endpoint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /slots/doctor/:doctorId — Get all available slots for a specific doctor.
 * Optionally filter by date.
 */
export async function getDoctorSlots(
  doctorId: string,
  date?: string
): Promise<Slot[]> {
  const query = new URLSearchParams();
  if (date) query.set("date", date);
  const qs = query.toString();
  return fetchWithAuth<Slot[]>(
    `/slots/doctor/${doctorId}${qs ? `?${qs}` : ""}`
  );
}
