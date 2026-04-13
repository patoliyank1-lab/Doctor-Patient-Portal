import { z } from "zod";

// ────────────────────────────────────────────────────────────
// POST /uploads/presigned-url
// ────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // Documents
  "application/pdf",
  // Common medical docs
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const presignedUrlSchema = z.object({
  /** Original filename (e.g. "blood-test.pdf") — used to derive a safe S3 key */
  fileName: z.string().trim().min(1, "fileName is required").max(255),
  /** MIME type of the file being uploaded */
  fileType: z.enum(ALLOWED_MIME_TYPES, {
    error: `fileType must be one of: ${ALLOWED_MIME_TYPES.join(", ")}`,
  }),
  /** File size in bytes — used to enforce a max upload size (50 MB) */
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024, "File must be ≤ 50 MB"),
  /**
   * Which folder to place the file under in S3.
   * e.g. "profile-images" | "medical-records"
   */
  folder: z.enum(["profile-images", "medical-records"]).default("medical-records"),
});

export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>;

// ────────────────────────────────────────────────────────────
// DELETE /uploads/file
// ────────────────────────────────────────────────────────────

export const deleteFileSchema = z.object({
  /** Full S3 object key to delete (returned by the presigned-url endpoint) */
  key: z.string().trim().min(1, "key is required"),
});

export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
