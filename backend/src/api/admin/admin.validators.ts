import { z } from "zod";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

// ────────────────────────────────────────────────────────────
// Reusable pagination fragment
// ────────────────────────────────────────────────────────────

const paginationSchema = {
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
};

// ────────────────────────────────────────────────────────────
// Query — GET /admin/users
// ────────────────────────────────────────────────────────────

export const listUsersQuerySchema = z.object({
  ...paginationSchema,
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  search: z.string().trim().max(100).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// ────────────────────────────────────────────────────────────
// Param — PUT /admin/users/:id/deactivate | /activate
// ────────────────────────────────────────────────────────────

export const userIdParamSchema = z.object({
  id: z.string().regex(uuidRegex, "Invalid user id"),
});

// ────────────────────────────────────────────────────────────
// Query — GET /admin/audit-logs
// ────────────────────────────────────────────────────────────

export const listAuditLogsQuerySchema = z.object({
  ...paginationSchema,
  /** Filter by the user who performed the action */
  userId: z.string().regex(uuidRegex, "Invalid userId").optional(),
  /** Filter by entity type, e.g. "appointment" | "user" | "doctor" */
  entity: z.string().trim().max(100).optional(),
  /** Filter by action keyword, e.g. "CREATE" | "UPDATE" */
  action: z.string().trim().max(100).optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

// ────────────────────────────────────────────────────────────
// Query — GET /admin/appointments
// ────────────────────────────────────────────────────────────

export const adminListAppointmentsQuerySchema = z.object({
  ...paginationSchema,
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"])
    .optional(),
  doctorId: z.string().regex(uuidRegex, "Invalid doctorId").optional(),
  patientId: z.string().regex(uuidRegex, "Invalid patientId").optional(),
  /** Filter by scheduled date YYYY-MM-DD */
  date: z
    .string()
    .regex(dateRegex, "date must be YYYY-MM-DD")
    .optional(),
});

export type AdminListAppointmentsQuery = z.infer<typeof adminListAppointmentsQuerySchema>;

// ────────────────────────────────────────────────────────────
// Param — PUT /admin/doctors/:id/approve | /reject
// ────────────────────────────────────────────────────────────

export const doctorIdParamSchema = z.object({
  id: z.string().regex(uuidRegex, "Invalid doctor id"),
});

export const updateDoctorApprovalSchema = z.object({
  rejectionReason: z.string().trim().min(1).max(500).optional(),
});

export type UpdateDoctorApprovalInput = z.infer<typeof updateDoctorApprovalSchema>;

// ────────────────────────────────────────────────────────────
// Query — GET /admin/doctors
// ────────────────────────────────────────────────────────────

export const listDoctorsAdminQuerySchema = z.object({
  ...paginationSchema,
  approvalStatus: z
    .enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"])
    .optional(),
  search: z.string().trim().max(100).optional(),
});

export type ListDoctorsAdminQuery = z.infer<typeof listDoctorsAdminQuerySchema>;
