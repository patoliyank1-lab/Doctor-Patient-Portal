import { Role } from "../../../prisma/generated/client/enums";
import { prisma } from "../../config/database";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { createNotification } from "../notifications/notifications.service";
import { logAudit } from "../../utils/auditLog";
import type { CreateRecordInput, ListRecordsQuery } from "./medical-records.validators";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

const findPatientIdByUserId = async (userId: string) => {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!patient) throw new AppError("Patient profile not found", 404);
  return patient.id;
};

const findDoctorIdByUserId = async (userId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!doctor) throw new AppError("Doctor profile not found", 404);
  return doctor.id;
};

const recordSelect = {
  id: true,
  title: true,
  description: true,
  fileUrl: true,
  fileType: true,
  fileSizeBytes: true,
  createdAt: true,
  updatedAt: true,
  appointmentId: true,
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  doctor: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

// ────────────────────────────────────────────────────────────
// Create Record
// ────────────────────────────────────────────────────────────

/**
 * A patient uploads their own record (no patientId required in body).
 * A doctor uploads a record for a patient (patientId required in body).
 */
export const createRecord = async (
  userId: string,
  role: Role,
  input: CreateRecordInput,
) => {
  try {
    let patientId: string;
    let uploadedByDoctorId: string | undefined;

    if (role === Role.PATIENT) {
      patientId = await findPatientIdByUserId(userId);
    } else if (role === Role.DOCTOR) {
      if (!input.patientId) {
        throw new AppError("patientId is required when uploading as a doctor", 400);
      }
      // Verify patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: input.patientId },
        select: { id: true },
      });
      if (!patient) throw new AppError("Patient not found", 404);

      uploadedByDoctorId = await findDoctorIdByUserId(userId);
      patientId = input.patientId;
    } else {
      throw new AppError("Forbidden", 403);
    }

    // If appointmentId provided, verify it belongs to this patient
    if (input.appointmentId) {
      const appt = await prisma.appointment.findFirst({
        where: { id: input.appointmentId, patientId, deletedAt: null },
        select: { id: true },
      });
      if (!appt) throw new AppError("Appointment not found or does not belong to patient", 404);
    }

    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        uploadedByDoctorId: uploadedByDoctorId ?? null,
        appointmentId: input.appointmentId ?? null,
        title: input.title,
        description: input.description ?? null,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        fileSizeBytes: input.fileSizeBytes ?? null,
      },
      select: recordSelect,
    });

    // When a doctor uploads for a patient, notify the patient
    if (role === Role.DOCTOR) {
      const patientUser = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { userId: true, firstName: true },
      });
      if (patientUser) {
        void createNotification({
          userId: patientUser.userId,
          title: "New Medical Record Added",
          message: `A new medical record "${record.title}" has been added to your profile by your doctor.`,
          type: "SYSTEM",
          referenceId: record.id,
          referenceType: "medical_record",
        });
      }
    }

    void logAudit({
      userId,
      action: "CREATE",
      entity: "medical_record",
      entityId: record.id,
      newValue: { title: record.title, fileType: record.fileType, uploadedByRole: role },
    });

    return record;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// List own records (Patient)
// ────────────────────────────────────────────────────────────

export const listMyRecords = async (userId: string, query: ListRecordsQuery) => {
  try {
    const patientId = await findPatientIdByUserId(userId);

    const where: any = { patientId, deletedAt: null };
    if (query.fileType) where.fileType = query.fileType;

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, records] = await Promise.all([
      prisma.medicalRecord.count({ where }),
      prisma.medicalRecord.findMany({
        where,
        skip,
        take,
        select: recordSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      records,
      pagination: { total, page: query.page, limit: query.limit, totalPages },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// List records for a patient (Doctor)
// ────────────────────────────────────────────────────────────

export const listPatientRecords = async (
  doctorUserId: string,
  patientId: string,
  query: ListRecordsQuery,
) => {
  try {
    // Verify requesting user is a doctor
    await findDoctorIdByUserId(doctorUserId);

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) throw new AppError("Patient not found", 404);

    const where: any = { patientId, deletedAt: null };
    if (query.fileType) where.fileType = query.fileType;

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, records] = await Promise.all([
      prisma.medicalRecord.count({ where }),
      prisma.medicalRecord.findMany({
        where,
        skip,
        take,
        select: recordSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      records,
      pagination: { total, page: query.page, limit: query.limit, totalPages },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// Get single record by ID
// ────────────────────────────────────────────────────────────

export const getRecordById = async (userId: string, role: Role, recordId: string) => {
  try {
    const record = await prisma.medicalRecord.findFirst({
      where: { id: recordId, deletedAt: null },
      select: {
        ...recordSelect,
        patient: {
          select: { id: true, userId: true, firstName: true, lastName: true },
        },
        doctor: {
          select: { id: true, userId: true, firstName: true, lastName: true },
        },
      },
    });

    if (!record) throw new AppError("Medical record not found", 404);

    if (role === Role.ADMIN) return record;

    if (role === Role.PATIENT) {
      if (record.patient.userId !== userId) throw new AppError("Forbidden", 403);
      return record;
    }

    if (role === Role.DOCTOR) {
      // Doctor can see record if they uploaded it OR if the patient has any
      // shared appointment with them — for simplicity we allow any approved doctor
      // to read a patient's record they were linked to.
      // Stricter: only the uploading doctor or an admin is allowed.
      if (!record.doctor || record.doctor.userId !== userId) {
        throw new AppError("Forbidden", 403);
      }
      return record;
    }

    throw new AppError("Unauthorized", 401);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// Soft-delete a record (Patient only — own records)
// ────────────────────────────────────────────────────────────

export const softDeleteRecord = async (userId: string, recordId: string) => {
  try {
    const patientId = await findPatientIdByUserId(userId);

    const record = await prisma.medicalRecord.findFirst({
      where: { id: recordId, patientId, deletedAt: null },
      select: { id: true },
    });
    if (!record) throw new AppError("Medical record not found", 404);

    await prisma.medicalRecord.update({
      where: { id: record.id },
      data: { deletedAt: new Date() },
    });

    void logAudit({
      userId,
      action: "DELETE",
      entity: "medical_record",
      entityId: recordId,
      oldValue: { softDeleted: true },
    });

    return { message: "Medical record deleted successfully" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};
