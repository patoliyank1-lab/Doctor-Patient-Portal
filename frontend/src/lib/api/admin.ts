import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type {
  User,
  AuditLog,
  Appointment,
  AdminDashboardData,
  PatientAnalyticsData,
  DoctorAnalyticsData,
  AppointmentAnalyticsData,
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

export interface AdminDoctorListParams {
  page?: number;
  limit?: number;
  search?: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
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

/** GET /admin/dashboard — Full platform stats + recent appointments. */
export async function getDashboard(): Promise<AdminDashboardData> {
  return fetchWithAuth<AdminDashboardData>("/admin/dashboard");
}

/** GET /admin/analytics/patients — Patient totals + monthly growth + top patients. */
export async function getPatientAnalytics(): Promise<PatientAnalyticsData> {
  return fetchWithAuth<PatientAnalyticsData>("/admin/analytics/patients");
}

/** GET /admin/analytics/doctors — Doctor totals + by specialization + top doctors. */
export async function getDoctorAnalytics(): Promise<DoctorAnalyticsData> {
  return fetchWithAuth<DoctorAnalyticsData>("/admin/analytics/doctors");
}

/** GET /admin/analytics/appointments — Totals + rates + by status + monthly trend. */
export async function getAppointmentAnalytics(): Promise<AppointmentAnalyticsData> {
  return fetchWithAuth<AppointmentAnalyticsData>("/admin/analytics/appointments");
}

/** GET /admin/doctors — List ALL doctors (any approval status) with pagination + filters. */
export async function getAdminDoctors(
  params: AdminDoctorListParams = {}
): Promise<{
  doctors: import("@/types").Doctor[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 15));
  if (params.search) query.set("search", params.search);
  if (params.approvalStatus) query.set("approvalStatus", params.approvalStatus);

  return fetchWithAuth(`/admin/doctors?${query}`);
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

/** PUT /admin/appointments — All appointments with full filters (Admin only). */
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

// ─────────────────────────────────────────────────────────────────────────────
// Doctor Approval Endpoints
// ─────────────────────────────────────────────────────────────────────────────

export interface ApproveDoctorResult {
  doctor: { id: string; firstName: string; lastName: string; approvalStatus: string };
  message: string;
}

/** PUT /admin/doctors/:id/approve — Approve a doctor application. */
export async function approveDoctor(doctorId: string): Promise<ApproveDoctorResult> {
  return fetchWithAuth<ApproveDoctorResult>(`/admin/doctors/${doctorId}/approve`, {
    method: "PUT",
  });
}

/** PUT /admin/doctors/:id/reject — Reject a doctor application with optional reason. */
export async function rejectDoctor(
  doctorId: string,
  rejectionReason?: string
): Promise<ApproveDoctorResult> {
  return fetchWithAuth<ApproveDoctorResult>(`/admin/doctors/${doctorId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ rejectionReason }),
  });
}
