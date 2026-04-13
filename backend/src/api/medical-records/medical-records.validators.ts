import { z } from "zod";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ────────────────────────────────────────────────────────────
// Param schemas
// ────────────────────────────────────────────────────────────

export const recordIdParamSchema = z.object({
  id: z.string().regex(uuidRegex, "Invalid record id"),
});

export const patientIdParamSchema = z.object({
  patientId: z.string().regex(uuidRegex, "Invalid patientId"),
});

// ────────────────────────────────────────────────────────────
// Body schemas
// ────────────────────────────────────────────────────────────

export const createRecordSchema = z.object({
  /** Patient this record belongs to. Required when the uploader is a doctor. */
  patientId: z.string().regex(uuidRegex, "Invalid patientId").optional(),
  /** Optional appointment this record is linked to. */
  appointmentId: z.string().regex(uuidRegex, "Invalid appointmentId").optional(),
  title: z.string().trim().min(1, "title is required").max(255),
  description: z.string().trim().max(2000).optional(),
  /** Pre-uploaded file URL (from /uploads/presigned-url flow) */
  fileUrl: z.string().url("Invalid fileUrl"),
  fileType: z.string().trim().min(1, "fileType is required").max(50),
  fileSizeBytes: z.number().int().positive().optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;

// ────────────────────────────────────────────────────────────
// Query schemas
// ────────────────────────────────────────────────────────────

export const listRecordsQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined ? 1 : Number(v)))
    .pipe(z.number().int().min(1))
    .default(1),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined ? 10 : Number(v)))
    .pipe(z.number().int().min(1).max(100))
    .default(10),
  fileType: z.string().trim().optional(),
});

export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;
