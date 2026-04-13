import { z } from "zod";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ────────────────────────────────────────────────────────────
// POST /reviews
// ────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  appointmentId: z.string().regex(uuidRegex, "Invalid appointmentId"),
  /** 1–5 star rating */
  rating: z.number().int().min(1, "Rating min is 1").max(5, "Rating max is 5"),
  comment: z.string().trim().max(1000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ────────────────────────────────────────────────────────────
// Params
// ────────────────────────────────────────────────────────────

export const reviewIdParamSchema = z.object({
  id: z.string().regex(uuidRegex, "Invalid review id"),
});

export const doctorIdParamSchema = z.object({
  doctorId: z.string().regex(uuidRegex, "Invalid doctorId"),
});

// ────────────────────────────────────────────────────────────
// Query — GET /reviews/doctor/:doctorId  &  GET /reviews/my
// ────────────────────────────────────────────────────────────

export const listReviewsQuerySchema = z.object({
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
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
