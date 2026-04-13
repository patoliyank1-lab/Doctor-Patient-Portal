import { z } from "zod";

const intFromString = (val: unknown) => {
  if (val === undefined || val === null || val === "") return undefined;
  const n = typeof val === "number" ? val : Number(String(val));
  return Number.isFinite(n) ? n : NaN;
};

const consultationFeeSchema = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    const s = typeof v === "number" ? String(v) : v.trim();
    return s.length > 0 ? s : undefined;
  });

export const createDoctorProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(100, "Last name is too long"),
  specializations: z
    .array(z.string().trim().min(1, "Specialization cannot be empty").max(100, "Specialization is too long"))
    .min(1, "At least one specialization is required"),

  qualification: z.string().trim().min(1, "Qualification cannot be empty").optional(),
  experienceYears: z
    .number()
    .int("Experience years must be an integer")
    .min(0, "Experience years cannot be negative")
    .max(80, "Experience years is too large")
    .optional(),
  bio: z.string().trim().min(1, "Bio cannot be empty").max(2000, "Bio is too long").optional(),
  profileImageUrl: z.string().trim().url("profileImageUrl must be a valid URL").optional(),
  consultationFee: consultationFeeSchema,
});

export type CreateDoctorProfileInput = z.infer<typeof createDoctorProfileSchema>;

export const listDoctorsQuerySchema = z
  .object({
    page: z.any().optional().transform(intFromString),
    limit: z.any().optional().transform(intFromString),

    specialization: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(),

    experienceMin: z.any().optional().transform(intFromString),
    experienceMax: z.any().optional().transform(intFromString),

    // Mentioned in requirements, but not in current Prisma Doctor schema.
    city: z.string().trim().min(1).optional(),
    location: z.string().trim().min(1).optional(),

    sortBy: z.enum(["experience", "createdAt"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
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

    if (val.experienceMin !== undefined) {
      if (!Number.isInteger(val.experienceMin) || val.experienceMin < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["experienceMin"],
          message: "experienceMin must be an integer >= 0",
        });
      }
    }
    if (val.experienceMax !== undefined) {
      if (!Number.isInteger(val.experienceMax) || val.experienceMax < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["experienceMax"],
          message: "experienceMax must be an integer >= 0",
        });
      }
    }
    if (
      val.experienceMin !== undefined &&
      val.experienceMax !== undefined &&
      Number.isInteger(val.experienceMin) &&
      Number.isInteger(val.experienceMax) &&
      val.experienceMin > val.experienceMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["experienceMin"],
        message: "experienceMin cannot be greater than experienceMax",
      });
    }

    // Prisma Doctor model currently has no city/location fields, so fail fast.
    if (val.city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["city"],
        message: "Unsupported filter: city (not present in Doctor schema)",
      });
    }
    if (val.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Unsupported filter: location (not present in Doctor schema)",
      });
    }
  })
  .transform((val) => ({
    page: (val.page ?? 1) as number,
    limit: (val.limit ?? 10) as number,
    specialization: val.specialization,
    search: val.search,
    experienceMin: val.experienceMin as number | undefined,
    experienceMax: val.experienceMax as number | undefined,
    sortBy: val.sortBy,
    order: val.order ?? "desc",
  }));

export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;

export const pendingDoctorsQuerySchema = z
  .object({
    page: z.any().optional().transform(intFromString),
    limit: z.any().optional().transform(intFromString),
    specialization: z.string().trim().min(1).optional(),
    search: z.string().trim().min(1).optional(), // name/email
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
    specialization: val.specialization,
    search: val.search,
  }));

export type PendingDoctorsQuery = z.infer<typeof pendingDoctorsQuerySchema>;

export const doctorIdParamSchema = z.object({
  id: z.string().uuid("Invalid doctor id"),
});

export type DoctorIdParam = z.infer<typeof doctorIdParamSchema>;

export const updateDoctorStatusBodySchema = z
  .object({
    status: z.enum(["approved", "rejected", "suspended"]),
    reason: z.string().trim().min(1, "reason is required").max(500, "reason is too long").optional(),
  })
  .superRefine((val, ctx) => {
    if ((val.status === "rejected" || val.status === "suspended") && !val.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "reason is required for rejected/suspended status",
      });
    }
  });

export type UpdateDoctorStatusBody = z.infer<typeof updateDoctorStatusBodySchema>;

