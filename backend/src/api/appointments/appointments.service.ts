import { Prisma } from "../../../prisma/generated/client/client";
import { AppointmentStatus, Role } from "../../../prisma/generated/client/enums";
import { prisma } from "../../config/database";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { createNotification } from "../notifications/notifications.service";
import { logAudit } from "../../utils/auditLog";
import type {
  CancelAppointmentInput,
  CreateAppointmentInput,
  MyAppointmentsQuery,
  RescheduleAppointmentInput,
  UpdateAppointmentStatusInput,
} from "./appointments.validators";

const dateOnly = (yyyyMmDd: string) => new Date(yyyyMmDd);

const startOfNextDayUtc = (yyyyMmDd: string) => {
  const d = dateOnly(yyyyMmDd);
  return new Date(d.getTime() + 24 * 60 * 60 * 1000);
};

const combineDateAndTimeUtc = (date: Date, time: Date) => {
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

const findDoctorIdByUserId = async (userId: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!doctor) throw new AppError("Doctor profile not found", 404);
  return doctor.id;
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

const doctorAppointmentSelect = {
  id: true,
  status: true,
  scheduledAt: true,
  createdAt: true,
  rejectionReason: true,
  slot: {
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
    },
  },
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      phone: true,
      dateOfBirth: true,
    },
  },
} as const;

const appointmentDetailSelect = {
  id: true,
  status: true,
  scheduledAt: true,
  reason: true,
  doctorNotes: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  slot: {
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      doctorId: true,
      isBooked: true,
    },
  },
  doctor: {
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      specializations: true,
      profileImageUrl: true,
      consultationFee: true,
      approvalStatus: true,
    },
  },
  patient: {
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      gender: true,
      phone: true,
      dateOfBirth: true,
      bloodGroup: true,
      profileImageUrl: true,
    },
  },
} as const;

// ─── bookAppointment ─────────────────────────────────────────

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

    // Need patient + doctor userId for notifications after the transaction
    const [patientUser, doctorUser] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId }, select: { userId: true, firstName: true, lastName: true } }),
      prisma.doctor.findFirst({
        where: { availabilitySlots: { some: { id: input.slotId } } },
        select: { userId: true, firstName: true, lastName: true },
      }),
    ]);

    const result = await prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: input.slotId },
        select: { id: true, doctorId: true, date: true, startTime: true, endTime: true, isBooked: true },
      });
      if (!slot) throw new AppError("Slot not found", 404);
      if (slot.isBooked) throw new AppError("Slot is not available", 409);

      const updateResult = await tx.availabilitySlot.updateMany({
        where: { id: input.slotId, isBooked: false },
        data: { isBooked: true },
      });
      if (updateResult.count !== 1) throw new AppError("Slot is not available", 409);

      const scheduledAt = combineDateAndTimeUtc(slot.date, slot.startTime);

      // ── DEBUG: Trace time values at booking ──────────────────────────
      console.log("[TZ-DEBUG] bookAppointment — slot from DB:", {
        slotId: slot.id,
        "slot.date (raw)": slot.date,
        "slot.date (ISO)": slot.date?.toISOString?.(),
        "slot.startTime (raw)": slot.startTime,
        "slot.startTime (ISO)": slot.startTime?.toISOString?.(),
        "slot.endTime (ISO)": slot.endTime?.toISOString?.(),
        "scheduledAt (combined)": scheduledAt.toISOString(),
      });
      // ── END DEBUG ────────────────────────────────────────────────────

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

      // ── DEBUG: Trace created appointment response ────────────────────
      console.log("[TZ-DEBUG] bookAppointment — created appointment:", {
        appointmentId: (created as any).id,
        "created.slot.date (ISO)": (created as any).slot?.date?.toISOString?.(),
        "created.slot.startTime (ISO)": (created as any).slot?.startTime?.toISOString?.(),
        "created.slot.endTime (ISO)": (created as any).slot?.endTime?.toISOString?.(),
        "created.scheduledAt (ISO)": (created as any).scheduledAt?.toISOString?.(),
      });
      // ── END DEBUG ────────────────────────────────────────────────────

      return created as any;
    });

    // Fire notifications after transaction (fire-and-forget)
    if (doctorUser) {
      void createNotification({
        userId: doctorUser.userId,
        title: "New Appointment Request",
        message: `${patientUser?.firstName ?? "A patient"} ${patientUser?.lastName ?? ""} has booked an appointment with you.`,
        type: "APPOINTMENT",
        referenceId: result.id,
        referenceType: "appointment",
      });
    }
    if (patientUser) {
      void createNotification({
        userId: patientUser.userId,
        title: "Appointment Booked",
        message: `Your appointment with Dr. ${result.doctor.firstName} ${result.doctor.lastName} has been submitted and is pending confirmation.`,
        type: "APPOINTMENT",
        referenceId: result.id,
        referenceType: "appointment",
      });
    }

    void logAudit({
      userId,
      action: "CREATE",
      entity: "appointment",
      entityId: result.id,
      newValue: { status: result.status, doctorId: result.doctor.id },
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Slot is not available", 409);
    }
    throw new UnknownError(error);
  }
};

// ─── listMyAppointments (Patient) ─────────────────────────────

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

// ─── getAppointmentDetail ────────────────────────────────────

export const getAppointmentDetail = async (
  userId: string,
  role: Role,
  appointmentId: string,
): Promise<{
  id: string;
  status: AppointmentStatus;
  scheduledAt: Date;
  reason: string | null;
  doctorNotes: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  slot: { id: string; date: Date; startTime: Date; endTime: Date; doctorId: string; isBooked: boolean };
  doctor: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    specializations: string[];
    profileImageUrl: string | null;
    consultationFee: any;
    approvalStatus: any;
  };
  patient: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    gender: any;
    phone: string | null;
    dateOfBirth: Date | null;
    bloodGroup: string | null;
    profileImageUrl: string | null;
  };
}> => {
  try {
    const appt = await prisma.appointment.findFirst({
      where: { id: appointmentId, deletedAt: null },
      select: appointmentDetailSelect,
    });
    if (!appt) throw new AppError("Appointment not found", 404);

    if (role === Role.ADMIN) return appt as any;
    if (role === Role.PATIENT) {
      if (appt.patient.userId !== userId) throw new AppError("Forbidden", 403);
      return appt as any;
    }
    if (role === Role.DOCTOR) {
      if (appt.doctor.userId !== userId) throw new AppError("Forbidden", 403);
      return appt as any;
    }
    throw new AppError("Unauthorized", 401);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ─── listMyAppointmentsForDoctor ─────────────────────────────

export const listMyAppointmentsForDoctor = async (
  userId: string,
  query: MyAppointmentsQuery,
): Promise<{
  appointments: Array<{
    id: string;
    status: AppointmentStatus;
    scheduledAt: Date;
    createdAt: Date;
    rejectionReason: string | null;
    slot: { id: string; date: Date; startTime: Date; endTime: Date };
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      gender: any;
      phone: string | null;
      dateOfBirth: Date | null;
    };
  }>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> => {
  try {
    const doctorId = await findDoctorIdByUserId(userId);

    const where: any = { doctorId, deletedAt: null };
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
        select: doctorAppointmentSelect,
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

// ─── updateAppointmentStatusForDoctor ────────────────────────

export const updateAppointmentStatusForDoctor = async (
  userId: string,
  appointmentId: string,
  input: UpdateAppointmentStatusInput,
): Promise<{
  id: string;
  status: AppointmentStatus;
  scheduledAt: Date;
  createdAt: Date;
  rejectionReason: string | null;
  slot: { id: string; date: Date; startTime: Date; endTime: Date };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    gender: any;
    phone: string | null;
    dateOfBirth: Date | null;
  };
}> => {
  try {
    const doctorId = await findDoctorIdByUserId(userId);

    const doctorProfile = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { firstName: true, lastName: true },
    });

    const statusMap: Record<UpdateAppointmentStatusInput["status"], AppointmentStatus> = {
      approved: AppointmentStatus.APPROVED,
      rejected: AppointmentStatus.REJECTED,
      completed: AppointmentStatus.COMPLETED,
    };
    const targetStatus = statusMap[input.status];

    // Need patient userId for notification
    const apptForNotification = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId, deletedAt: null },
      select: {
        patient: { select: { userId: true, firstName: true, lastName: true } },
      },
    });

    const result = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findFirst({
        where: { id: appointmentId, doctorId, deletedAt: null },
        select: { id: true, status: true, slotId: true },
      });
      if (!appt) throw new AppError("Appointment not found", 404);

      if (appt.status === AppointmentStatus.CANCELLED) throw new AppError("Cancelled appointments cannot be updated", 409);
      if (appt.status === AppointmentStatus.COMPLETED) throw new AppError("Completed appointments cannot be updated", 409);

      const isValidTransition =
        (appt.status === AppointmentStatus.PENDING &&
          (targetStatus === AppointmentStatus.APPROVED || targetStatus === AppointmentStatus.REJECTED)) ||
        (appt.status === AppointmentStatus.APPROVED && targetStatus === AppointmentStatus.COMPLETED);

      if (!isValidTransition) throw new AppError("Invalid appointment status transition", 409);

      const updated = await tx.appointment.update({
        where: { id: appt.id },
        data: {
          status: targetStatus,
          rejectionReason: targetStatus === AppointmentStatus.REJECTED ? input.rejectionReason : null,
        },
        select: doctorAppointmentSelect,
      });

      // Free up the availability slot if rejected
      if (targetStatus === AppointmentStatus.REJECTED) {
        await tx.availabilitySlot.update({
          where: { id: appt.slotId },
          data: { isBooked: false },
        });
      }

      return updated as any;
    });

    // Fire notification to patient (fire-and-forget)
    if (apptForNotification) {
      const patientUserId = apptForNotification.patient.userId;
      const drName = `Dr. ${doctorProfile?.firstName ?? ""} ${doctorProfile?.lastName ?? ""}`.trim();

      const notifMap: Record<AppointmentStatus, { title: string; message: string } | null> = {
        [AppointmentStatus.APPROVED]:   { title: "Appointment Approved", message: `Your appointment with ${drName} has been approved.` },
        [AppointmentStatus.REJECTED]:   { title: "Appointment Rejected", message: `Your appointment with ${drName} has been rejected.${input.rejectionReason ? ` Reason: ${input.rejectionReason}` : ""}` },
        [AppointmentStatus.COMPLETED]:  { title: "Appointment Completed", message: `Your appointment with ${drName} has been marked as completed.` },
        [AppointmentStatus.PENDING]:    null,
        [AppointmentStatus.CANCELLED]:  null,
      };

      const notif = notifMap[targetStatus];
      if (notif) {
        void createNotification({
          userId: patientUserId,
          title: notif.title,
          message: notif.message,
          type: "APPOINTMENT",
          referenceId: result.id,
          referenceType: "appointment",
        });
      }
    }

    void logAudit({
      userId,
      action: input.status.toUpperCase(),
      entity: "appointment",
      entityId: result.id,
      newValue: { status: result.status },
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ─── cancelAppointment (Patient) ─────────────────────────────

export const cancelAppointment = async (
  userId: string,
  appointmentId: string,
  input: CancelAppointmentInput,
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

    // Fetch doctor userId for notification before transaction
    const apptForNotification = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId, deletedAt: null },
      select: {
        doctor: { select: { userId: true, firstName: true, lastName: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    const result = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findFirst({
        where: { id: appointmentId, patientId, deletedAt: null },
        select: { id: true, status: true, slotId: true },
      });
      if (!appt) throw new AppError("Appointment not found", 404);

      if (appt.status !== AppointmentStatus.PENDING && appt.status !== AppointmentStatus.APPROVED) {
        throw new AppError("Appointment cannot be cancelled", 409);
      }

      const updated = await tx.appointment.update({
        where: { id: appt.id },
        data: {
          status: AppointmentStatus.CANCELLED,
          ...(input.cancelReason ? { reason: input.cancelReason } : {}),
        },
        select: appointmentSelect,
      });

      await tx.availabilitySlot.update({
        where: { id: appt.slotId },
        data: { isBooked: false },
      });

      return updated as any;
    });

    // Notify the doctor that the patient cancelled
    if (apptForNotification) {
      const patientName = `${apptForNotification.patient.firstName} ${apptForNotification.patient.lastName}`;
      void createNotification({
        userId: apptForNotification.doctor.userId,
        title: "Appointment Cancelled",
        message: `${patientName} has cancelled their appointment with you.${input.cancelReason ? ` Reason: ${input.cancelReason}` : ""}`,
        type: "APPOINTMENT",
        referenceId: result.id,
        referenceType: "appointment",
      });
    }

    void logAudit({
      userId,
      action: "CANCEL",
      entity: "appointment",
      entityId: result.id,
      newValue: { status: "CANCELLED", reason: input.cancelReason },
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ─── rescheduleAppointment ───────────────────────────────────

export const rescheduleAppointment = async (
  userId: string,
  appointmentId: string,
  input: RescheduleAppointmentInput,
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

    // Fetch context for notification before transaction
    const apptForNotification = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId, deletedAt: null },
      select: {
        doctor: { select: { userId: true, firstName: true, lastName: true } },
        patient: { select: { userId: true, firstName: true, lastName: true } },
      },
    });

    const result = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findFirst({
        where: { id: appointmentId, patientId, deletedAt: null },
        select: { id: true, status: true, slotId: true },
      });
      if (!appt) throw new AppError("Appointment not found", 404);

      if (appt.status !== AppointmentStatus.PENDING && appt.status !== AppointmentStatus.APPROVED) {
        throw new AppError("Appointment cannot be rescheduled", 409);
      }

      if (input.newSlotId === appt.slotId) throw new AppError("newSlotId must be different from current slot", 400);

      const newSlot = await tx.availabilitySlot.findUnique({
        where: { id: input.newSlotId },
        select: { id: true, doctorId: true, date: true, startTime: true, isBooked: true },
      });
      if (!newSlot) throw new AppError("Slot not found", 404);
      if (newSlot.isBooked) throw new AppError("Slot is not available", 409);

      const bookNew = await tx.availabilitySlot.updateMany({
        where: { id: input.newSlotId, isBooked: false },
        data: { isBooked: true },
      });
      if (bookNew.count !== 1) throw new AppError("Slot is not available", 409);

      await tx.availabilitySlot.update({
        where: { id: appt.slotId },
        data: { isBooked: false },
      });

      const scheduledAt = combineDateAndTimeUtc(newSlot.date, newSlot.startTime);

      const updated = await tx.appointment.update({
        where: { id: appt.id },
        data: { slotId: newSlot.id, doctorId: newSlot.doctorId, status: AppointmentStatus.PENDING, scheduledAt },
        select: appointmentSelect,
      });

      return updated as any;
    });

    // Notify doctor of the reschedule
    if (apptForNotification) {
      const patientName = `${apptForNotification.patient.firstName} ${apptForNotification.patient.lastName}`;
      void createNotification({
        userId: apptForNotification.doctor.userId,
        title: "Appointment Rescheduled",
        message: `${patientName} has rescheduled their appointment with you to a new time slot.`,
        type: "APPOINTMENT",
        referenceId: result.id,
        referenceType: "appointment",
      });
    }

    void logAudit({
      userId,
      action: "RESCHEDULE",
      entity: "appointment",
      entityId: result.id,
      newValue: { newSlotId: input.newSlotId, status: "PENDING" },
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") throw new AppError("Slot is not available", 409);
    }
    throw new UnknownError(error);
  }
};

// ─── saveAppointmentNotes ─────────────────────────────────────

/**
 * Allow a doctor to save or overwrite clinical notes on any appointment they own.
 * Notes can be added regardless of status (pending/approved/completed).
 */
export const saveAppointmentNotes = async (
  userId: string,
  appointmentId: string,
  notes: string,
): Promise<{
  id: string;
  status: AppointmentStatus;
  doctorNotes: string | null;
  scheduledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}> => {
  try {
    const doctorId = await findDoctorIdByUserId(userId);

    const appt = await prisma.appointment.findFirst({
      where: { id: appointmentId, doctorId, deletedAt: null },
      select: { id: true },
    });
    if (!appt) throw new AppError("Appointment not found or access denied", 404);

    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: { doctorNotes: notes.trim() || null },
      select: {
        id: true,
        status: true,
        doctorNotes: true,
        scheduledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    void logAudit({
      userId,
      action: "UPDATE_NOTES",
      entity: "appointment",
      entityId: updated.id,
      newValue: { doctorNotes: !!updated.doctorNotes },
    });

    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};
