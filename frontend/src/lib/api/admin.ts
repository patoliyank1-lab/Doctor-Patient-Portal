import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type {
  User,
  AuditLog,
  Appointment,
  DashboardSummary,
  PatientGrowthStat,
  DoctorSpecializationStat,
  AppointmentTrendStat,
  PaginatedResponse,
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Params
// ─────────────────────────────────────────────────────────────────────────────

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
}

export interface AdminAppointmentParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** GET /admin/dashboard — Full platform analytics summary. */
export async function getDashboard(): Promise<DashboardSummary> {
  return fetchWithAuth<DashboardSummary>("/admin/dashboard");
}

/** GET /admin/analytics/patients — Monthly patient registration growth stats. */
export async function getPatientAnalytics(): Promise<PatientGrowthStat[]> {
  return fetchWithAuth<PatientGrowthStat[]>("/admin/analytics/patients");
}

/** GET /admin/analytics/doctors — Doctor count grouped by specialization. */
export async function getDoctorAnalytics(): Promise<
  DoctorSpecializationStat[]
> {
  return fetchWithAuth<DoctorSpecializationStat[]>("/admin/analytics/doctors");
}

/** GET /admin/analytics/appointments — Monthly appointment trend data. */
export async function getAppointmentAnalytics(): Promise<
  AppointmentTrendStat[]
> {
  return fetchWithAuth<AppointmentTrendStat[]>(
    "/admin/analytics/appointments"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// User Management Endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** GET /admin/users — List all users across all roles. */
export async function getAllUsers(
  params: UserListParams = {}
): Promise<PaginatedResponse<User>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.isActive !== undefined)
    query.set("isActive", String(params.isActive));

  return fetchWithAuth<PaginatedResponse<User>>(`/admin/users?${query}`);
}

/** PUT /admin/users/:id/deactivate — Deactivate any user account. */
export async function deactivateUser(id: string): Promise<User> {
  return fetchWithAuth<User>(`/admin/users/${id}/deactivate`, {
    method: "PUT",
  });
}

/** PUT /admin/users/:id/activate — Reactivate a deactivated user account. */
export async function activateUser(id: string): Promise<User> {
  return fetchWithAuth<User>(`/admin/users/${id}/activate`, {
    method: "PUT",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log Endpoint
// ─────────────────────────────────────────────────────────────────────────────

/** GET /admin/audit-logs — View the full platform audit trail. */
export async function getAuditLogs(
  params: AuditLogParams = {}
): Promise<PaginatedResponse<AuditLog>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));
  if (params.action) query.set("action", params.action);
  if (params.userId) query.set("userId", params.userId);

  return fetchWithAuth<PaginatedResponse<AuditLog>>(
    `/admin/audit-logs?${query}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointments Endpoint (Admin view)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /admin/appointments — All appointments with full filters (Admin only). */
export async function getAdminAppointments(
  params: AdminAppointmentParams = {}
): Promise<PaginatedResponse<Appointment>> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);

  return fetchWithAuth<PaginatedResponse<Appointment>>(
    `/admin/appointments?${query}`
  );
}
