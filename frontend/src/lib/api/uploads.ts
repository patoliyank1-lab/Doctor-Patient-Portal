import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { PresignedUrlResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /uploads/presigned-url — Request a presigned S3 PUT URL for direct upload.
 *
 * Flow:
 *   1. Call getPresignedUrl(filename, mimeType) → { uploadUrl, fileUrl, key }
 *   2. PUT the file directly to uploadUrl (no auth header needed — it's presigned)
 *   3. Pass fileUrl to the record creation endpoint (e.g. uploadMedicalRecord)
 *
 * @param filename - Original file name (used to derive S3 key)
 * @param mimeType - MIME type of the file (e.g. "image/jpeg", "application/pdf")
 */
export async function getPresignedUrl(
  filename: string,
  mimeType: string
): Promise<PresignedUrlResponse> {
  return fetchWithAuth<PresignedUrlResponse>("/uploads/presigned-url", {
    method: "POST",
    body: JSON.stringify({ filename, mimeType }),
  });
}

/**
 * DELETE /uploads/file — Delete a file from S3 by its object key.
 *
 * @param key - The S3 object key returned during the presigned URL flow.
 */
export async function deleteFile(key: string): Promise<void> {
  return fetchWithAuth<void>("/uploads/file", {
    method: "DELETE",
    body: JSON.stringify({ key }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — Direct S3 upload using presigned URL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a file directly to S3 using a presigned URL.
 * This is NOT an API call to the MediConnect backend — it goes straight to S3.
 *
 * Usage:
 *   const { uploadUrl, fileUrl, key } = await getPresignedUrl(file.name, file.type);
 *   await uploadToS3(uploadUrl, file);
 *   // now use fileUrl in the record payload
 *
 * @throws Error if the S3 upload fails
 */
export async function uploadToS3(
  presignedUrl: string,
  file: File
): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`S3 upload failed with status ${res.status}`);
  }
}
