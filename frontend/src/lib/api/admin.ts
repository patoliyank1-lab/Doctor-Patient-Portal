import { fetchWithAuth } from "@/lib/fetch-with-auth";
import type {
  User,
  AuditLogListResponse,
  AdminPatientListResponse,
  AdminAppointment,
  AdminAppointmentListResponse,
  AdminDashboardData,
  PatientAnalyticsData,
  DoctorAnalyticsData,
  AppointmentAnalyticsData,
  PaginatedResponse,
} from "@/types";

// Param interfaces

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
  entity?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminAppointmentParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminPatientParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

// Analytics

export async function getDashboard(): Promise<AdminDashboardData> {
  return fetchWithAuth<AdminDashboardData>("/admin/dashboard");
}

export async function getPatientAnalytics(): Promise<PatientAnalyticsData> {
  return fetchWithAuth<PatientAnalyticsData>("/admin/analytics/patients");
}

export async function getDoctorAnalytics(): Promise<DoctorAnalyticsData> {
  return fetchWithAuth<DoctorAnalyticsData>("/admin/analytics/doctors");
}

export async function getAppointmentAnalytics(): Promise<AppointmentAnalyticsData> {
  return fetchWithAuth<AppointmentAnalyticsData>("/admin/analytics/appointments");
}

// Doctors

export async function getAdminDoctors(params: AdminDoctorListParams = {}) {
  const query = new URLSearchParams();
  query.set("page",  String(params.page  ?? 1));
  query.set("limit", String(params.limit ?? 15));
  if (params.search)         query.set("search", params.search);
  if (params.approvalStatus) query.set("approvalStatus", params.approvalStatus);
  return fetchWithAuth<any>(`/admin/doctors?${query}`);
}

// Users

export async function getAllUsers(params: UserListParams = {}): Promise<PaginatedResponse<User>> {
  const query = new URLSearchParams();
  query.set("page",  String(params.page  ?? 1));
  query.set("limit", String(params.limit ?? 10));
  if (params.search)   query.set("search",   params.search);
  if (params.role)     query.set("role",     params.role);
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));
  return fetchWithAuth<PaginatedResponse<User>>(`/admin/users?${query}`);
}

export async function deactivateUser(id: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/admin/users/${id}/deactivate`, { method: "PUT" });
}

export async function activateUser(id: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/admin/users/${id}/activate`, { method: "PUT" });
}

// Audit Logs

export async function getAuditLogs(params: AuditLogParams = {}): Promise<AuditLogListResponse> {
  const query = new URLSearchParams();
  query.set("page",  String(params.page  ?? 1));
  query.set("limit", String(params.limit ?? 20));
  if (params.action)   query.set("action",   params.action);
  if (params.entity)   query.set("entity",   params.entity);
  if (params.userId)   query.set("userId",   params.userId);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo)   query.set("dateTo",   params.dateTo);
  return fetchWithAuth<AuditLogListResponse>(`/admin/audit-logs?${query}`);
}

// Appointments

export async function getAdminAppointments(
  params: AdminAppointmentParams = {}
): Promise<AdminAppointmentListResponse> {
  const query = new URLSearchParams();
  query.set("page",  String(params.page  ?? 1));
  query.set("limit", String(params.limit ?? 25));
  if (params.status)   query.set("status",   params.status);
  if (params.search)   query.set("search",   params.search);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo)   query.set("dateTo",   params.dateTo);
  return fetchWithAuth<AdminAppointmentListResponse>(`/admin/appointments?${query}`);
}

export async function updateAdminAppointmentStatus(
  appointmentId: string,
  status: "PENDING" | "APPROVED" | "COMPLETED" | "CANCELLED" | "REJECTED"
): Promise<{ appointment: AdminAppointment; message: string }> {
  return fetchWithAuth<{ appointment: AdminAppointment; message: string }>(
    `/admin/appointments/${appointmentId}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) }
  );
}

// Patients

export async function getAdminPatients(
  params: AdminPatientParams = {}
): Promise<AdminPatientListResponse> {
  const query = new URLSearchParams();
  query.set("page",  String(params.page  ?? 1));
  query.set("limit", String(params.limit ?? 20));
  if (params.search !== undefined)   query.set("search",   params.search);
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive));
  return fetchWithAuth<AdminPatientListResponse>(`/admin/patients?${query}`);
}

// Doctor Approval

export interface ApproveDoctorResult {
  doctor: { id: string; firstName: string; lastName: string; approvalStatus: string };
  message: string;
}

export async function approveDoctor(doctorId: string): Promise<ApproveDoctorResult> {
  return fetchWithAuth<ApproveDoctorResult>(`/admin/doctors/${doctorId}/approve`, { method: "PUT" });
}

export async function rejectDoctor(
  doctorId: string,
  rejectionReason?: string
): Promise<ApproveDoctorResult> {
  return fetchWithAuth<ApproveDoctorResult>(`/admin/doctors/${doctorId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ rejectionReason }),
  });
}
