import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { Slot } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSlotPayload {
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
}

/** What the backend actually returns from POST /slots/bulk */
export interface BulkSlotApiPayload {
  slots: CreateSlotPayload[];
}

export interface UpdateSlotPayload {
  date?: string;
  startTime?: string;
  endTime?: string;
}

export interface SlotsPaginatedResponse {
  slots: Slot[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
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

/**
 * POST /slots/bulk — Create multiple slots at once (Doctor).
 * NOTE: Backend expects { slots: [{date, startTime, endTime}, ...] }
 * The caller must expand date-ranges/weekdays client-side.
 */
export async function createBulkSlots(
  payload: BulkSlotApiPayload
): Promise<{ createdCount: number; slots: Slot[] }> {
  return fetchWithAuth<{ createdCount: number; slots: Slot[] }>("/slots/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * GET /slots/my — Get all slots belonging to the logged-in doctor.
 * Backend returns { slots: [], pagination: {} } — correctly typed here.
 */
export async function getMySlots(params?: {
  date?: string;
  status?: "available" | "booked";
  page?: number;
  limit?: number;
}): Promise<SlotsPaginatedResponse> {
  const query = new URLSearchParams();
  if (params?.date)   query.set("date",   params.date);
  if (params?.status) query.set("status", params.status);
  if (params?.page)   query.set("page",   String(params.page));
  if (params?.limit)  query.set("limit",  String(params.limit));
  const qs = query.toString();
  return fetchWithAuth<SlotsPaginatedResponse>(`/slots/my${qs ? `?${qs}` : ""}`);
}

/** PUT /slots/:id — Update a slot's date or time (Doctor). */
export async function updateSlot(
  id: string,
  payload: CreateSlotPayload
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
 * Backend returns: { slots: Slot[], pagination: {...} } — we unwrap here.
 */
export async function getDoctorSlots(
  doctorId: string,
  date?: string
): Promise<Slot[]> {
  const query = new URLSearchParams();
  if (date) query.set("date", date);
  const qs = query.toString();
  const res = await fetchWithAuth<{ slots: Slot[] } | Slot[]>(
    `/slots/doctor/${doctorId}${qs ? `?${qs}` : ""}`
  );
  // Backend wraps in { slots: [...], pagination: {...} }
  if (Array.isArray(res)) return res;
  return (res as { slots?: Slot[] }).slots ?? [];
}

