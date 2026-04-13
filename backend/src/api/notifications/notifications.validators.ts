import { z } from "zod";

// ────────────────────────────────────────────────────────────
// Query — GET /notifications
// ────────────────────────────────────────────────────────────

export const listNotificationsQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined ? 1 : Number(v)))
    .pipe(z.number().int().min(1))
    .default(1),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined ? 20 : Number(v)))
    .pipe(z.number().int().min(1).max(100))
    .default(20),
  /** Filter by read status: "true" | "false" */
  isRead: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  /** Filter by notification type */
  type: z.enum(["APPOINTMENT", "SYSTEM", "ALERT"]).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

// ────────────────────────────────────────────────────────────
// Param — PUT /:id/read  |  DELETE /:id
// ────────────────────────────────────────────────────────────

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const notificationIdParamSchema = z.object({
  id: z.string().regex(uuidRegex, "Invalid notification id"),
});
