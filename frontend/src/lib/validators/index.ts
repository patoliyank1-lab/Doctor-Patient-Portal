import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Auth Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

// ──

export const registerFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(
        /^[6-9]\d{9}$/,
        "Please enter a valid 10-digit Indian phone number"
      ),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((val) => {
        const dob = new Date(val);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        return age >= 5 && age <= 120;
      }, "Please enter a valid date of birth"),
    gender: z.enum(["male", "female", "other"], {
      message: "Please select your gender",
    }),
    role: z.enum(["patient", "doctor"], {
      message: "Please select a role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerFormSchema>;

// ──

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

// ──

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Profile Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const patientProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  phone: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      "Please enter a valid 10-digit Indian phone number"
    ),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], {
    message: "Please select your gender",
  }),
  address: z
    .string()
    .max(300, "Address cannot exceed 300 characters")
    .optional(),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional()
    .or(z.literal("")),
  allergies: z
    .string()
    .max(500, "Allergies description too long")
    .optional(),
});

export type PatientProfileData = z.infer<typeof patientProfileSchema>;

// ──

export const doctorProfileSchema = z.object({
  specialization: z
    .string()
    .min(2, "Specialization is required")
    .max(100, "Specialization too long"),
  qualifications: z
    .string()
    .min(5, "Please list your qualifications (e.g. MBBS, MD)")
    .max(500, "Qualifications too long"),
  experience: z.coerce
    .number({ error: "Experience must be a number" })
    .min(0, "Experience cannot be negative")
    .max(60, "Experience seems too high"),
  bio: z
    .string()
    .min(20, "Bio must be at least 20 characters")
    .max(1000, "Bio cannot exceed 1000 characters"),
  consultationFee: z.coerce
    .number({ error: "Fee must be a number" })
    .min(0, "Fee cannot be negative")
    .max(100000, "Fee seems too high"),
  clinicName: z
    .string()
    .max(200, "Clinic name too long")
    .optional()
    .or(z.literal("")),
  clinicAddress: z
    .string()
    .max(300, "Clinic address too long")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      "Please enter a valid 10-digit Indian phone number"
    ),
});

export type DoctorProfileData = z.infer<typeof doctorProfileSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Appointment Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const bookAppointmentSchema = z.object({
  slotId: z.string().min(1, "Please select an appointment slot"),
  reason: z
    .string()
    .min(10, "Please describe your reason (minimum 10 characters)")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type BookAppointmentData = z.infer<typeof bookAppointmentSchema>;

// ──

export const appointmentNotesSchema = z.object({
  notes: z
    .string()
    .min(5, "Notes must be at least 5 characters")
    .max(2000, "Notes cannot exceed 2000 characters"),
});

export type AppointmentNotesData = z.infer<typeof appointmentNotesSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Availability Slot Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const slotSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return data.startTime < data.endTime;
    },
    { message: "End time must be after start time", path: ["endTime"] }
  )
  .refine(
    (data) => {
      if (!data.date) return true;
      return new Date(data.date) >= new Date(new Date().toDateString());
    },
    { message: "Date cannot be in the past", path: ["date"] }
  );

export type SlotData = z.infer<typeof slotSchema>;

// ──

export const bulkSlotSchema = z
  .object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    daysOfWeek: z
      .array(z.number().min(0).max(6))
      .min(1, "Select at least one day of the week"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type BulkSlotData = z.infer<typeof bulkSlotSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Medical Record Schema
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const medicalRecordSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters"),
  type: z.enum(["prescription", "lab_report", "imaging", "other"], {
    message: "Please select a record type",
  }),
  file: z
    .instanceof(File, { message: "Please select a file" })
    .refine((f) => f.size <= MAX_FILE_SIZE, "File size must be under 10 MB")
    .refine(
      (f) => ALLOWED_MIME_TYPES.includes(f.type),
      "Only PDF, JPEG, PNG, or WebP files are allowed"
    ),
});

export type MedicalRecordData = z.infer<typeof medicalRecordSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Review Schema
// ─────────────────────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  appointmentId: z.string().min(1, "Appointment reference is required"),
  rating: z.coerce
    .number({ error: "Rating must be a number" })
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(1000, "Comment cannot exceed 1000 characters"),
});

export type ReviewData = z.infer<typeof reviewSchema>;
