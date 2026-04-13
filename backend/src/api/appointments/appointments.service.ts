import { Prisma } from "../../../prisma/generated/client/client";
import { AppointmentStatus } from "../../../prisma/generated/client/enums";
import { prisma } from "../../config/database";
import { AppError, UnknownError } from "../../utils/errorHandler";
import type { CreateAppointmentInput, MyAppointmentsQuery } from "./appointments.validators";

const dateOnly = (yyyyMmDd: string) => new Date(yyyyMmDd); // JS treats YYYY-MM-DD as UTC midnight

const startOfNextDayUtc = (yyyyMmDd: string) => {
  const d = dateOnly(yyyyMmDd);
  return new Date(d.getTime() + 24 * 60 * 60 * 1000);
};

const combineDateAndTimeUtc = (date: Date, time: Date) => {
  // Prisma maps @db.Date and @db.Time to JS Date. We interpret both in UTC.
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      time.getUTCHours(),
      time.getUTCMinutes(),
      time.getUTCSeconds(),
      time.getUTCMilliseconds(),
    ),
  );
};

const findPatientIdByUserId = async (userId: string) => {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!patient) throw new AppError("Patient profile not found", 404);
  return patient.id;
};

const appointmentSelect = {
  id: true,
  status: true,
  scheduledAt: true,
  createdAt: true,
  slot: {
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
    },
  },
  doctor: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specializations: true,
      profileImageUrl: true,
      consultationFee: true,
    },
  },
} as const;

export const bookAppointment = async (
  userId: string,
  input: CreateAppointmentInput,
): Promise<{
  id: string;
  status: AppointmentStatus;
  scheduledAt: Date;
  createdAt: Date;
  slot: { id: string; date: Date; startTime: Date; endTime: Date };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specializations: string[];
    profileImageUrl: string | null;
    consultationFee: any;
  };
}> => {
  try {
    const patientId = await findPatientIdByUserId(userId);

    return await prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: input.slotId },
        select: {
          id: true,
          doctorId: true,
          date: true,
          startTime: true,
          endTime: true,
          isBooked: true,
        },
      });
      if (!slot) throw new AppError("Slot not found", 404);
      if (slot.isBooked) throw new AppError("Slot is not available", 409);

      // Concurrency-safe booking: only one transaction can flip isBooked from false -> true.
      const updateResult = await tx.availabilitySlot.updateMany({
        where: { id: input.slotId, isBooked: false },
        data: { isBooked: true },
      });
      if (updateResult.count !== 1) {
        throw new AppError("Slot is not available", 409);
      }

      const scheduledAt = combineDateAndTimeUtc(slot.date, slot.startTime);

      const created = await tx.appointment.create({
        data: {
          patientId,
          doctorId: slot.doctorId,
          slotId: slot.id,
          status: AppointmentStatus.PENDING,
          scheduledAt,
        },
        select: appointmentSelect,
      });

      return created as any;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // slotId is unique on Appointment => prevents double booking at DB-level too
      if (error.code === "P2002") {
        throw new AppError("Slot is not available", 409);
      }
    }
    throw new UnknownError(error);
  }
};

export const listMyAppointments = async (
  userId: string,
  query: MyAppointmentsQuery,
): Promise<{
  appointments: Array<{
    id: string;
    status: AppointmentStatus;
    scheduledAt: Date;
    createdAt: Date;
    slot: { id: string; date: Date; startTime: Date; endTime: Date };
    doctor: {
      id: string;
      firstName: string;
      lastName: string;
      specializations: string[];
      profileImageUrl: string | null;
      consultationFee: any;
    };
  }>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> => {
  try {
    const patientId = await findPatientIdByUserId(userId);

    const where: any = { patientId, deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.date) {
      where.scheduledAt = { gte: dateOnly(query.date), lt: startOfNextDayUtc(query.date) };
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take,
        select: appointmentSelect,
        orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      appointments: appointments as any,
      pagination: { total, page: query.page, limit: query.limit, totalPages },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

