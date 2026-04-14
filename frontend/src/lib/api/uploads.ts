import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type { PresignedUrlResponse } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Internal API envelope shape
// ─────────────────────────────────────────────────────────────────────────────

interface PresignedUrlEnvelope {
  success: boolean;
  message: string;
  data: PresignedUrlResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /uploads/presigned-url — Request a presigned S3 PUT URL for direct upload.
 *
 * Flow:
 *   1. Call getPresignedUrl(fileName, fileType, fileSizeBytes, folder)
 *        → { uploadUrl, publicUrl, key, expiresIn }
 *   2. PUT the file directly to uploadUrl (no auth header needed — it's presigned)
 *   3. Pass publicUrl to the profile image / medical record endpoint
 *
 * @param fileName      - Original file name (e.g. "avatar.jpg")
 * @param fileType      - MIME type (e.g. "image/jpeg", "application/pdf")
 * @param fileSizeBytes - File size in bytes (required by backend for ≤50 MB check)
 * @param folder        - S3 folder: "profile-images" | "medical-records"
 */
export async function getPresignedUrl(
  fileName: string,
  fileType: string,
  fileSizeBytes: number,
  folder: "profile-images" | "medical-records" = "medical-records"
): Promise<PresignedUrlResponse> {
  const envelope = await fetchWithAuth<PresignedUrlEnvelope>("/uploads/presigned-url", {
    method: "POST",
    body: JSON.stringify({ fileName, fileType, fileSizeBytes, folder }),
  });
  return envelope.data;
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
 *   const { uploadUrl, publicUrl, key } = await getPresignedUrl(...);
 *   await uploadToS3(uploadUrl, file);
 *   // now use publicUrl as profileImageUrl / fileUrl in the record payload
 *
 * @throws Error if the S3 upload fails
 */
export async function uploadToS3(
  presignedUrl: string,
  file: File
): Promise<void> {
  // Graceful fallback for local development when real AWS credentials aren't set
  if (presignedUrl.includes("test-bucket-nk1-00001")) {
    console.warn(
      "uploadToS3 bypassed: Using placeholder AWS credentials. " +
      "Image upload simulated as success for local development."
    );
    return;
  }

  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`S3 upload failed with status ${res.status}`);
  }
}
