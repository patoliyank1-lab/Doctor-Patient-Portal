import { z } from "zod";
import { Gender } from "../../../prisma/generated/client/enums";

const intFromString = (val: unknown) => {
  if (val === undefined || val === null || val === "") return undefined;
  const n = typeof val === "number" ? val : Number(String(val));
  return Number.isFinite(n) ? n : NaN;
};

export const listPatientsQuerySchema = z
  .object({
    page: z.any().optional().transform(intFromString),
    limit: z.any().optional().transform(intFromString),

    search: z.string().trim().min(1).optional(), // name/email
    gender: z.nativeEnum(Gender).optional(),
  })
  .superRefine((val, ctx) => {
    const page = val.page ?? 1;
    const limit = val.limit ?? 10;

    if (!Number.isInteger(page) || page < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["page"], message: "page must be an integer >= 1" });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["limit"],
        message: "limit must be an integer between 1 and 100",
      });
    }
  })
  .transform((val) => ({
    page: (val.page ?? 1) as number,
    limit: (val.limit ?? 10) as number,
    search: val.search,
    gender: val.gender,
  }));

export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;

export const patientIdParamSchema = z.object({
  id: z.string().uuid("Invalid patient id"),
});

export type PatientIdParam = z.infer<typeof patientIdParamSchema>;

