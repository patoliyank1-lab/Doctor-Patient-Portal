// ─────────────────────────────────────────────────────────────────────────────
// MediConnect — Application Constants
// Single source of truth for roles, statuses, routes, and env config.
// Never hardcode these values in components — always import from here.
// ─────────────────────────────────────────────────────────────────────────────

// ── User Roles ────────────────────────────────────────────────────────────────

export const USER_ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  ADMIN: "admin",
} as const;

export type UserRoleKey = keyof typeof USER_ROLES;

// ── Appointment Status ────────────────────────────────────────────────────────

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled",
} as const;

// ── Doctor Status ─────────────────────────────────────────────────────────────

export const DOCTOR_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
} as const;

// ── Medical Record Types ──────────────────────────────────────────────────────

export const RECORD_TYPES = {
  PRESCRIPTION: "prescription",
  LAB_REPORT: "lab_report",
  IMAGING: "imaging",
  OTHER: "other",
} as const;

// ── Slot Status ───────────────────────────────────────────────────────────────

export const SLOT_STATUS = {
  AVAILABLE: "available",
  BOOKED: "booked",
} as const;

// ── Routes ────────────────────────────────────────────────────────────────────
// All URL paths in the app. Never hardcode strings like "/patient/dashboard".

export const ROUTES = {
  // ── Public
  HOME: "/",
  ABOUT: "/about",
  DOCTORS: "/doctors",
  DOCTOR_PUBLIC_PROFILE: (id: string) => `/doctors/${id}`,
  PUBLIC_DOCTOR: (id: string) => `/doctors/${id}`,

  // ── Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  VERIFY_EMAIL: "/auth/verify-email",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",

  // ── Patient
  PATIENT_DASHBOARD: "/patient/dashboard",
  PATIENT_DOCTORS: "/patient/doctors",
  PATIENT_BOOK: (doctorId: string) => `/patient/doctors/${doctorId}/book`,
  PATIENT_APPOINTMENTS: "/patient/appointments",
  PATIENT_APPOINTMENT_DETAIL: (id: string) => `/patient/appointments/${id}`,
  PATIENT_PROFILE: "/patient/profile",
  PATIENT_RECORDS: "/patient/records",
  PATIENT_REVIEWS: "/patient/reviews",
  PATIENT_NOTIFICATIONS: "/patient/notifications",

  // ── Doctor
  DOCTOR_DASHBOARD: "/doctor/dashboard",
  DOCTOR_APPOINTMENTS: "/doctor/appointments",
  DOCTOR_APPOINTMENT_DETAIL: (id: string) => `/doctor/appointments/${id}`,
  DOCTOR_AVAILABILITY: "/doctor/availability",
  DOCTOR_PATIENT_DETAIL: (id: string) => `/doctor/patients/${id}`,
  DOCTOR_PROFILE: "/doctor/profile",
  DOCTOR_NOTIFICATIONS: "/doctor/notifications",

  // ── Admin
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_DOCTORS: "/admin/doctors",
  ADMIN_PATIENTS: "/admin/patients",
  ADMIN_APPOINTMENTS: "/admin/appointments",
  ADMIN_AUDIT_LOGS: "/admin/audit-logs",

  // ── Misc
  UNAUTHORIZED: "/unauthorized",
} as const;

// ── Role → Dashboard mapping ──────────────────────────────────────────────────

export const ROLE_DASHBOARD: Record<string, string> = {
  patient: ROUTES.PATIENT_DASHBOARD,
  doctor: ROUTES.DOCTOR_DASHBOARD,
  admin: ROUTES.ADMIN_DASHBOARD,
};

// ── Middleware route matching ──────────────────────────────────────────────────

/** Routes that require authentication AND role matching */
// NOTE: trailing slash is critical — prevents "/doctor" from matching "/doctors/*" public pages
export const PROTECTED_PREFIXES = ["/patient/", "/doctor/", "/admin/"] as const;

/** Routes only accessible when NOT authenticated */
export const AUTH_PREFIXES = ["/auth"] as const;

/** Role to its allowed route prefix (trailing slash required — see PROTECTED_PREFIXES) */
export const ROLE_PREFIX_MAP: Record<string, string> = {
  patient: "/patient/",
  doctor: "/doctor/",
  admin: "/admin/",
};

// ── API ───────────────────────────────────────────────────────────────────────

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

// ── Pagination ────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

// ── File Upload Constraints ───────────────────────────────────────────────────

export const MAX_UPLOAD_SIZE_MB = 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

// ── Days of Week (for bulk slot creation) ────────────────────────────────────

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

// ── Blood Groups ──────────────────────────────────────────────────────────────

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

// ── Gender Options ────────────────────────────────────────────────────────────

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

// ── Record Type Options ────────────────────────────────────────────────────────

export const RECORD_TYPE_OPTIONS = [
  { value: "prescription", label: "Prescription" },
  { value: "lab_report", label: "Lab Report" },
  { value: "imaging", label: "Imaging" },
  { value: "other", label: "Other" },
] as const;

// ── Specializations ───────────────────────────────────────────────────────────

export const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Medicine",
  "Gynaecology",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopaedics",
  "Paediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Urology",
] as const;
