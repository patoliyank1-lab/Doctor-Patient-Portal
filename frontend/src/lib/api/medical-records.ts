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
  records: any[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

// Map the backend record to the frontend interface
function mapRecord(r: any): MedicalRecord {
  // Infer mime type from extension since the backend doesn't store it
  const isImage = r.fileUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
  
  return {
    ...r,
    type: r.fileType || r.type || "other",
    fileSize: r.fileSizeBytes || r.fileSize || 0,
    mimeType: r.mimeType || (isImage ? "image/jpeg" : "application/pdf"),
  } as MedicalRecord;
}

/**
 * POST /medical-records — Upload a new medical record.
 * The file itself should already be uploaded to S3 via presigned URL.
 * This endpoint only saves the metadata.
 */
export async function uploadMedicalRecord(
  payload: UploadRecordPayload
): Promise<MedicalRecord> {
  const backendPayload = {
    title: payload.title,
    fileType: payload.type,
    fileUrl: payload.fileUrl,
    fileSizeBytes: payload.fileSize,
  };

  const res = await fetchWithAuth<any>("/medical-records", {
    method: "POST",
    body: JSON.stringify(backendPayload),
  });
  return mapRecord(res);
}

/** GET /medical-records/my — Get the logged-in patient's own records. */
export async function getMyRecords(
  params: RecordListParams = {}
): Promise<PaginatedResponse<MedicalRecord>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.type) query.set("fileType", params.type);

  const res = await fetchWithAuth<RecordListResponse>(`/medical-records/my?${query}`);
  return {
    data: (res.records ?? []).map(mapRecord),
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
  if (params.type) query.set("fileType", params.type);

  const res = await fetchWithAuth<RecordListResponse>(`/medical-records/patient/${patientId}?${query}`);
  return {
    data: (res.records ?? []).map(mapRecord),
    total: res.pagination?.total ?? 0,
    page: res.pagination?.page ?? 1,
    limit: res.pagination?.limit ?? 10,
    totalPages: res.pagination?.totalPages ?? 1,
  };
}

/** GET /medical-records/:id — Get a single medical record by ID. */
export async function getRecordById(id: string): Promise<MedicalRecord> {
  const res = await fetchWithAuth<any>(`/medical-records/${id}`);
  return mapRecord(res);
}

/** DELETE /medical-records/:id — Soft-delete a medical record (Patient only). */
export async function deleteRecord(id: string): Promise<void> {
  return fetchWithAuth<void>(`/medical-records/${id}`, { method: "DELETE" });
}
