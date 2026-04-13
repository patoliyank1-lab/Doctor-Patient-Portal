import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/; // HH:mm (24h)
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const slotInputSchema = z
  .object({
    date: z.string().regex(dateRegex, "date must be in YYYY-MM-DD format"),
    startTime: z.string().regex(timeRegex, "startTime must be in HH:mm format"),
    endTime: z.string().regex(timeRegex, "endTime must be in HH:mm format"),
  })
  .superRefine((val, ctx) => {
    // Ensure date parses and is a real calendar date
    const d = new Date(val.date);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "date is invalid" });
      return;
    }

    // Ensure startTime < endTime
    const toMinutes = (t: string) => {
      const [hRaw, mRaw] = t.split(":");
      const h = Number(hRaw ?? NaN);
      const m = Number(mRaw ?? NaN);
      return h * 60 + m;
    };
    const start = toMinutes(val.startTime);
    const end = toMinutes(val.endTime);
    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startTime must be earlier than endTime",
      });
    }
  });

export type SlotInput = z.infer<typeof slotInputSchema>;

export const bulkSlotInputSchema = z.object({
  slots: z.array(slotInputSchema).min(1, "slots must have at least 1 item"),
});

export type BulkSlotInput = z.infer<typeof bulkSlotInputSchema>;

export const mySlotsQuerySchema = z.object({
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
  date: z.string().regex(dateRegex, "date must be in YYYY-MM-DD format").optional(),
  status: z.enum(["available", "booked", "cancelled"]).optional(),
});

export type MySlotsQuery = z.infer<typeof mySlotsQuerySchema>;

export const slotIdParamSchema = z.object({
  id: z.string().regex(uuidRegex, "Invalid slot id"),
});

export const updateSlotSchema = slotInputSchema;
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;

