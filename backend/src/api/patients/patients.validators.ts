import { z } from "zod";
import { Gender } from "../../../prisma/generated/client/enums";

const intFromString = (val: unknown) => {
  if (val === undefined || val === null || val === "") return undefined;
  const n = typeof val === "number" ? val : Number(String(val));
  return Number.isFinite(n) ? n : NaN;
};

const dateFromString = (val: unknown) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (val instanceof Date) return Number.isFinite(val.getTime()) ? val : new Date("invalid");
  const s = typeof val === "string" ? val.trim() : String(val);
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : new Date("invalid");
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

export const createPatientProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(100, "Last name is too long"),
  dateOfBirth: z.any().optional().transform(dateFromString),
  gender: z.nativeEnum(Gender).optional(),
  phone: z.string().trim().min(1, "Phone cannot be empty").max(20, "Phone is too long").optional(),
  address: z.string().trim().min(1, "Address cannot be empty").max(1000, "Address is too long").optional(),
  bloodGroup: z.string().trim().min(1, "Blood group cannot be empty").max(5, "Blood group is too long").optional(),
  profileImageUrl: z.string().trim().url("profileImageUrl must be a valid URL").optional(),
}).superRefine((val, ctx) => {
  if (val.dateOfBirth instanceof Date && !Number.isFinite(val.dateOfBirth.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateOfBirth"],
      message: "dateOfBirth must be a valid date",
    });
  }
});

export type CreatePatientProfileInput = z.infer<typeof createPatientProfileSchema>;

export const updateMyPatientProfileSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name cannot be empty").max(100, "First name is too long").optional(),
    lastName: z.string().trim().min(1, "Last name cannot be empty").max(100, "Last name is too long").optional(),
    dateOfBirth: z.any().optional().transform(dateFromString),
    gender: z.nativeEnum(Gender).optional(),
    phone: z.string().trim().min(1, "Phone cannot be empty").max(20, "Phone is too long").optional(),
    address: z.string().trim().min(1, "Address cannot be empty").max(1000, "Address is too long").optional(),
    bloodGroup: z.string().trim().min(1, "Blood group cannot be empty").max(5, "Blood group is too long").optional(),
    profileImageUrl: z.string().trim().url("profileImageUrl must be a valid URL").optional(),
  })
  .superRefine((val, ctx) => {
    const keys = Object.keys(val);
    if (keys.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "At least one field is required",
      });
    }
    if (val.dateOfBirth instanceof Date && !Number.isFinite(val.dateOfBirth.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateOfBirth"],
        message: "dateOfBirth must be a valid date",
      });
    }
  });

export type UpdateMyPatientProfileInput = z.infer<typeof updateMyPatientProfileSchema>;

export const updateMyPatientImageSchema = z.object({
  profileImageUrl: z.string().trim().url("profileImageUrl must be a valid URL"),
});

export type UpdateMyPatientImageInput = z.infer<typeof updateMyPatientImageSchema>;

