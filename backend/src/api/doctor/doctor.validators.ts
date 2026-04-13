import { z } from "zod";

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

