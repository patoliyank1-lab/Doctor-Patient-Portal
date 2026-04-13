import { z } from "zod";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

export const createAppointmentSchema = z.object({
  slotId: z.string().regex(uuidRegex, "Invalid slotId"),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const myAppointmentsQuerySchema = z.object({
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
  status: z
    .enum(["pending", "approved", "rejected", "completed", "cancelled"])
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
  date: z.string().regex(dateRegex, "date must be in YYYY-MM-DD format").optional(),
});

export type MyAppointmentsQuery = z.infer<typeof myAppointmentsQuerySchema>;

