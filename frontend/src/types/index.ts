// ─────────────────────────────────────────────────────────────────────────────
// MediConnect — TypeScript Entity Interfaces
// All API response shapes are defined here. Import from "@/types".
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ──────────────────────────────────────────────────────────────────────

export type UserRole = "patient" | "doctor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Doctor ────────────────────────────────────────────────────────────────────

export type DoctorStatus = "pending" | "approved" | "rejected" | "suspended";

export interface Doctor {
  id: string;
  userId?: string;
  user?: User & { email?: string; isActive?: boolean };
  email?: string;               // flattened from user.email in some responses
  firstName: string;
  lastName: string;
  specializations: string[];
  specialization?: string;      // legacy alias (single)
  qualification?: string;
  qualifications?: string[];    // legacy alias
  experienceYears?: number;
  experience?: number;          // legacy alias
  bio?: string;
  consultationFee?: number;
  phone?: string;               // may come from user or joined data
  clinicName?: string;
  clinicAddress?: string;
  approvalStatus?: DoctorStatus;
  status?: DoctorStatus;        // legacy alias
  profileImageUrl?: string;
  profileImage?: string;        // legacy alias
  avgRating?: number;
  totalReviews?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Patient ───────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  userId: string;
  user: User;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;        // ISO date string
  gender?: "male" | "female" | "other";
  phone?: string;
  address?: string;
  bloodGroup?: string;
  profileImageUrl?: string;
  profileImage?: string;       // legacy alias
  createdAt: string;
  updatedAt: string;
}

// ── Availability Slot ─────────────────────────────────────────────────────────

export type SlotStatus = "available" | "booked";

export interface Slot {
  id: string;
  doctorId: string;
  date: string;                // ISO date string e.g. "2024-06-15"
  startTime: string;           // "HH:mm" e.g. "09:00"
  endTime: string;             // "HH:mm" e.g. "09:30"
  status: SlotStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Appointment ───────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "rescheduled";

export interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  doctorId: string;
  doctor: Doctor;
  slotId: string;
  slot: Slot;
  reason: string;
  status: AppointmentStatus;
  notes?: string;              // Doctor's clinical notes
  createdAt: string;
  updatedAt: string;
}

// ── Medical Record ────────────────────────────────────────────────────────────

export type RecordType = "prescription" | "lab_report" | "imaging" | "other";

export interface MedicalRecord {
  id: string;
  patientId: string;
  uploadedBy: string;          // userId
  uploaderRole: UserRole;
  title: string;
  description?: string;        // optional note about the record
  type: RecordType;
  fileUrl: string;
  fileSize: number;            // bytes
  mimeType: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Notification ──────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;                // e.g. "appointment_approved", "new_review"
  createdAt: string;
}

// ── Review ────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  patientId: string;
  patient: Patient;
  doctorId: string;
  doctor: Doctor;
  appointmentId: string;
  rating: number;              // 1–5
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Admin Analytics ───────────────────────────────────────────────────────────

/** @deprecated — kept for backward compat; use AdminDashboardData instead */
export interface DashboardSummary {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingDoctors: number;
  completedAppointments: number;
  cancelledAppointments: number;
  revenueTotal: number;
}

/** @deprecated — kept for backward compat; use PatientAnalyticsData instead */
export interface PatientGrowthStat {
  month: string;
  count: number;
}

/** @deprecated — kept for backward compat; use DoctorAnalyticsData instead */
export interface DoctorSpecializationStat {
  specialization: string;
  count: number;
}

/** @deprecated — kept for backward compat; use AppointmentAnalyticsData instead */
export interface AppointmentTrendStat {
  month: string;
  total: number;
  completed: number;
  cancelled: number;
}

// ── Real backend response shapes ─────────────────────────────────────────────

/** Shape of GET /admin/dashboard */
export interface AdminDashboardData {
  users: {
    total: number;
    patients: number;
    doctors: number;
  };
  doctors: {
    total: number;
    pending: number;
    approved: number;
  };
  appointments: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
    cancelled: number;
    rejected: number;
  };
  medicalRecords: { total: number };
  reviews: { total: number; averageRating: number | null };
  recentAppointments: {
    id: string;
    status: string;
    scheduledAt: string;
    createdAt: string;
    patient: { firstName: string; lastName: string };
    doctor:  { firstName: string; lastName: string; specializations: string[] };
  }[];
}

/** Shape of GET /admin/analytics/patients */
export interface PatientAnalyticsData {
  totals: { total: number; active: number; newThisMonth: number };
  monthlyGrowth: { month: string; count: number }[];
  topPatientsByAppointments: {
    patient: { id: string; firstName: string; lastName: string } | null;
    appointmentCount: number;
  }[];
}

/** Shape of GET /admin/analytics/doctors */
export interface DoctorAnalyticsData {
  totals: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    newThisMonth: number;
  };
  bySpecialization: {
    specialization: string;
    doctorCount: number;
    averageRating: number | null;
  }[];
  topDoctorsByCompletedAppointments: {
    doctor: { id: string; firstName: string; lastName: string; specializations: string[] } | null;
    completedAppointments: number;
  }[];
}

/** Shape of GET /admin/analytics/appointments */
export interface AppointmentAnalyticsData {
  totals: { total: number; completedThisMonth: number; cancelledThisMonth: number };
  rates: { completionRate: number; cancellationRate: number };
  byStatus: { status: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string | null;
  user: (User & { email?: string }) | null;
  action: string;              // e.g. "DOCTOR_APPROVED", "LOGIN"
  entity: string;              // e.g. "Doctor", "Appointment"
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

// ── Admin Patient (GET /admin/patients) ───────────────────────────────────────

export interface AdminPatient {
  id: string;            // user.id
  email: string;
  isActive: boolean;
  createdAt: string;
  patient: {
    id: string;          // patient.id
    firstName: string;
    lastName: string;
    phone?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    profileImageUrl?: string | null;
    bloodGroup?: string | null;
    address?: string | null;
    _count?: { appointments: number };
  } | null;
}

export interface AdminPatientListResponse {
  patients: AdminPatient[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

// ── Admin Appointment (GET /admin/appointments) ────────────────────────────────

export interface AdminAppointment {
  id: string;
  status: string;
  scheduledAt?: string;
  reason?: string;
  doctorNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  patient: { id: string; firstName: string; lastName: string; phone?: string } | null;
  doctor:  { id: string; firstName: string; lastName: string; specializations?: string[] } | null;
  slot:    { id: string; date?: string; startTime?: string; endTime?: string } | null;
}

export interface AdminAppointmentListResponse {
  appointments: AdminAppointment[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

// ── Shared / Generic ──────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  field?: string;
  errors?: { field: string; message: string }[];
}

// ── Auth Response ─────────────────────────────────────────────────────────────
// The backend always wraps responses in this envelope:
//   { success: true, message: string, data: T, errors: null }
// For login, data contains { id, email, role }.

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthUser;
  errors: string[] | null;
}

// ── Upload ────────────────────────────────────────────────────────────────────

export interface PresignedUrlResponse {
  uploadUrl: string;           // S3 presigned PUT URL
  publicUrl: string;           // Public URL of the uploaded file
  key: string;                 // S3 object key
}
