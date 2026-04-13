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
  userId: string;
  user: User;
  specialization: string;
  qualifications: string[];
  experience: number;          // years
  bio: string;
  consultationFee: number;
  clinicName?: string;
  clinicAddress?: string;
  phone: string;
  status: DoctorStatus;
  avgRating: number;
  totalReviews: number;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Patient ───────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  userId: string;
  user: User;
  dateOfBirth: string;         // ISO date string
  gender: "male" | "female" | "other";
  phone: string;
  address?: string;
  bloodGroup?: string;
  allergies?: string[];
  profileImage?: string;
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
  appointmentId: string;
  rating: number;              // 1–5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// ── Admin Analytics ───────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  pendingDoctors: number;
  completedAppointments: number;
  cancelledAppointments: number;
  revenueTotal: number;
}

export interface PatientGrowthStat {
  month: string;               // e.g. "Jan 2024"
  count: number;
}

export interface DoctorSpecializationStat {
  specialization: string;
  count: number;
}

export interface AppointmentTrendStat {
  month: string;               // e.g. "Jan 2024"
  total: number;
  completed: number;
  cancelled: number;
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string;
  user: User;
  action: string;              // e.g. "DOCTOR_APPROVED", "APPOINTMENT_CANCELLED"
  entity: string;              // e.g. "Doctor", "Appointment"
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
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
  fileUrl: string;             // Public URL of the uploaded file
  key: string;                 // S3 object key
}
