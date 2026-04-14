import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { MedicalRecord, PaginatedResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Payloads
// ─────────────────────────────────────────────────────────────────────────────

export interface UploadRecordPayload {
  title: string;
  type: "prescription" | "lab_report" | "imaging" | "other";
  fileUrl: string;   // public URL after direct S3 upload
  fileSize: number;  // bytes
  mimeType: string;
}

export interface RecordListParams {
  page?: number;
  limit?: number;
  type?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// Internal shape returned by this backend endpoint
interface RecordListResponse {
  records: MedicalRecord[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

/**
 * POST /medical-records — Upload a new medical record.
 * The file itself should already be uploaded to S3 via presigned URL.
 * This endpoint only saves the metadata.
 */
export async function uploadMedicalRecord(
  payload: UploadRecordPayload
): Promise<MedicalRecord> {
  return fetchWithAuth<MedicalRecord>("/medical-records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /medical-records/my — Get the logged-in patient's own records. */
export async function getMyRecords(
  params: RecordListParams = {}
): Promise<PaginatedResponse<MedicalRecord>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.type) query.set("type", params.type);

  const res = await fetchWithAuth<RecordListResponse>(`/medical-records/my?${query}`);
  return {
    data: res.records ?? [],
    total: res.pagination?.total ?? 0,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
    totalPages: res.pagination?.totalPages ?? 1,
  };
}

/**
 * GET /medical-records/patient/:patientId — Get a patient's records (Doctor only).
 * Used on the Doctor > Patient Detail page.
 */
export async function getPatientRecords(
  patientId: string,
  params: RecordListParams = {}
): Promise<PaginatedResponse<MedicalRecord>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.type) query.set("type", params.type);

  const res = await fetchWithAuth<RecordListResponse>(`/medical-records/patient/${patientId}?${query}`);
  return {
    data: res.records ?? [],
    total: res.pagination?.total ?? 0,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
    totalPages: res.pagination?.totalPages ?? 1,
  };
}

/** GET /medical-records/:id — Get a single medical record by ID. */
export async function getRecordById(id: string): Promise<MedicalRecord> {
  return fetchWithAuth<MedicalRecord>(`/medical-records/${id}`);
}

/** DELETE /medical-records/:id — Soft-delete a medical record (Patient only). */
export async function deleteRecord(id: string): Promise<void> {
  return fetchWithAuth<void>(`/medical-records/${id}`, { method: "DELETE" });
}
