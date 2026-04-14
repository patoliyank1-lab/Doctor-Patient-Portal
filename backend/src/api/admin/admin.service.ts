import { prisma } from "../../config/database";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { createNotification } from "../notifications/notifications.service";
import { logAudit } from "../../utils/auditLog";
import type {
  AdminListAppointmentsQuery,
  ListAuditLogsQuery,
  ListUsersQuery,
  ListDoctorsAdminQuery,
} from "./admin.validators";

// ────────────────────────────────────────────────────────────
// GET /admin/dashboard
// ────────────────────────────────────────────────────────────

export const getDashboard = async () => {
  try {
    const [
      totalUsers, totalPatients, totalDoctors,
      pendingDoctors, approvedDoctors,
      totalAppointments, pendingAppointments, approvedAppointments,
      completedAppointments, cancelledAppointments, rejectedAppointments,
      totalMedicalRecords, totalReviews, avgRating,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.doctor.count({ where: { approvalStatus: "PENDING" } }),
      prisma.doctor.count({ where: { approvalStatus: "APPROVED" } }),
      prisma.appointment.count({ where: { deletedAt: null } }),
      prisma.appointment.count({ where: { status: "PENDING",   deletedAt: null } }),
      prisma.appointment.count({ where: { status: "APPROVED",  deletedAt: null } }),
      prisma.appointment.count({ where: { status: "COMPLETED", deletedAt: null } }),
      prisma.appointment.count({ where: { status: "CANCELLED", deletedAt: null } }),
      prisma.appointment.count({ where: { status: "REJECTED",  deletedAt: null } }),
      prisma.medicalRecord.count({ where: { deletedAt: null } }),
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { rating: true } }),
    ]);

    const recentAppointments = await prisma.appointment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, status: true, scheduledAt: true, createdAt: true,
        patient: { select: { firstName: true, lastName: true } },
        doctor:  { select: { firstName: true, lastName: true, specializations: true } },
      },
    });

    return {
      users:          { total: totalUsers, patients: totalPatients, doctors: totalDoctors },
      doctors:        { total: totalDoctors, pending: pendingDoctors, approved: approvedDoctors },
      appointments:   { total: totalAppointments, pending: pendingAppointments, approved: approvedAppointments,
                        completed: completedAppointments, cancelled: cancelledAppointments, rejected: rejectedAppointments },
      medicalRecords: { total: totalMedicalRecords },
      reviews:        { total: totalReviews, averageRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null },
      recentAppointments,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /admin/doctors — list all doctors (any status)
// ────────────────────────────────────────────────────────────

export const listAllDoctors = async (query: ListDoctorsAdminQuery) => {
  try {
    const where: any = {};
    if (query.approvalStatus) where.approvalStatus = query.approvalStatus;
    if (query.search) {
      const term = query.search;
      where.OR = [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName:  { contains: term, mode: "insensitive" } },
        { user: { email: { contains: term, mode: "insensitive" } } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, doctors] = await Promise.all([
      prisma.doctor.count({ where }),
      prisma.doctor.findMany({
        where, skip, take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specializations: true,
          qualification: true,
          experienceYears: true,
          bio: true,
          profileImageUrl: true,
          consultationFee: true,
          approvalStatus: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { email: true, isActive: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return { doctors, pagination: { total, page: query.page, limit: query.limit, totalPages } };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /admin/users
// ────────────────────────────────────────────────────────────

export const listAllUsers = async (query: ListUsersQuery) => {
  try {
    const where: any = { deletedAt: null };
    if (query.role)                   where.role     = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search)                 where.email    = { contains: query.search, mode: "insensitive" };

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where, skip, take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, role: true, isActive: true, emailVerified: true, createdAt: true,
          patient: { select: { id: true, firstName: true, lastName: true, profileImageUrl: true } },
          doctor:  { select: { id: true, firstName: true, lastName: true, approvalStatus: true, profileImageUrl: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return { users, pagination: { total, page: query.page, limit: query.limit, totalPages } };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// PUT /admin/users/:id/deactivate
// ────────────────────────────────────────────────────────────

export const deactivateUser = async (adminUserId: string, targetUserId: string) => {
  try {
    if (adminUserId === targetUserId) throw new AppError("You cannot deactivate your own account", 400);

    const user = await prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true, isActive: true, email: true, role: true },
    });
    if (!user) throw new AppError("User not found", 404);
    if (!user.isActive) throw new AppError("User is already deactivated", 409);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
      select: { id: true, email: true, role: true, isActive: true },
    });

    void logAudit({
      userId: adminUserId,
      action: "DEACTIVATE_USER",
      entity: "user",
      entityId: user.id,
      oldValue: { isActive: true },
      newValue: { isActive: false },
    });

    return { user: updated, message: `User ${updated.email} has been deactivated` };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// PUT /admin/users/:id/activate
// ────────────────────────────────────────────────────────────

export const activateUser = async (targetUserId: string) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true, isActive: true, email: true, role: true },
    });
    if (!user) throw new AppError("User not found", 404);
    if (user.isActive) throw new AppError("User is already active", 409);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true },
      select: { id: true, email: true, role: true, isActive: true },
    });

    // Notify the user their account is active again
    void createNotification({
      userId: updated.id,
      title: "Account Reactivated",
      message: "Your account has been reactivated. You can now log in and use MediConnect.",
      type: "SYSTEM",
    });

    return { user: updated, message: `User ${updated.email} has been activated` };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /admin/audit-logs — paginated audit trail
// ────────────────────────────────────────────────────────────

export const listAuditLogs = async (query: ListAuditLogsQuery) => {
  try {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.entity) where.entity = { contains: query.entity, mode: "insensitive" };
    if (query.action) where.action = { contains: query.action, mode: "insensitive" };
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        // Include the full dateTo day
        const end = new Date(query.dateTo);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          oldValue: true,
          newValue: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          user: {
            select: { id: true, email: true, role: true },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return { logs, pagination: { total, page: query.page, limit: query.limit, totalPages } };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /admin/appointments — all appointments with filters
// ────────────────────────────────────────────────────────────

const dateOnly      = (s: string) => new Date(s);
const startOfNextDay = (s: string) => new Date(new Date(s).getTime() + 86400000);

export const listAllAppointments = async (query: AdminListAppointmentsQuery) => {
  try {
    const where: any = { deletedAt: null };
    if (query.status)    where.status    = query.status;
    if (query.doctorId)  where.doctorId  = query.doctorId;
    if (query.patientId) where.patientId = query.patientId;
    if (query.date) {
      where.scheduledAt = { gte: dateOnly(query.date), lt: startOfNextDay(query.date) };
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take,
        orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          reason: true,
          doctorNotes: true,
          rejectionReason: true,
          createdAt: true,
          updatedAt: true,
          patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
          doctor:  { select: { id: true, firstName: true, lastName: true, specializations: true } },
          slot:    { select: { id: true, date: true, startTime: true, endTime: true } },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return { appointments, pagination: { total, page: query.page, limit: query.limit, totalPages } };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /admin/analytics/patients — patient growth stats
// ────────────────────────────────────────────────────────────

export const getPatientAnalytics = async () => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [totalPatients, activePatients, newThisMonth, monthlyGrowth, topByAppointments] =
      await Promise.all([
        prisma.patient.count(),
        prisma.user.count({ where: { role: "PATIENT", isActive: true, deletedAt: null } }),
        prisma.patient.count({
          where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
        }),
        // Monthly registrations — last 12 months
        prisma.$queryRaw<{ month: string; count: bigint }[]>`
          SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COUNT(*)::bigint AS count
          FROM patients
          WHERE created_at >= ${twelveMonthsAgo}
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY DATE_TRUNC('month', created_at) ASC
        `,
        prisma.appointment.groupBy({
          by: ["patientId"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 5,
          where: { deletedAt: null },
        }),
      ]);

    const topPatientIds = topByAppointments.map((r) => r.patientId);
    const topPatients = await prisma.patient.findMany({
      where: { id: { in: topPatientIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const patientMap = new Map(topPatients.map((p) => [p.id, p]));

    return {
      totals: { total: totalPatients, active: activePatients, newThisMonth },
      monthlyGrowth: monthlyGrowth.map((r) => ({ month: r.month, count: Number(r.count) })),
      topPatientsByAppointments: topByAppointments.map((r) => ({
        patient: patientMap.get(r.patientId) ?? null,
        appointmentCount: r._count.id,
      })),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /admin/analytics/doctors — doctor stats by specialization
// ────────────────────────────────────────────────────────────

export const getDoctorAnalytics = async () => {
  try {
    const now = new Date();

    const [
      totalDoctors, approvedDoctors, pendingDoctors, rejectedDoctors, newThisMonth,
      allDoctors, topByCompletedAppts,
    ] = await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { approvalStatus: "APPROVED" } }),
      prisma.doctor.count({ where: { approvalStatus: "PENDING" } }),
      prisma.doctor.count({ where: { approvalStatus: "REJECTED" } }),
      prisma.doctor.count({
        where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      }),
      prisma.doctor.findMany({
        select: {
          id: true,
          specializations: true,
          reviews: { select: { rating: true } },
        },
      }),
      prisma.appointment.groupBy({
        by: ["doctorId"],
        _count: { id: true },
        where: { status: "COMPLETED", deletedAt: null },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    // Aggregate by specialization
    const specMap = new Map<string, { count: number; totalRating: number; ratingCount: number }>();
    for (const doc of allDoctors) {
      for (const spec of doc.specializations) {
        const s = specMap.get(spec) ?? { count: 0, totalRating: 0, ratingCount: 0 };
        s.count += 1;
        for (const r of doc.reviews) { s.totalRating += r.rating; s.ratingCount += 1; }
        specMap.set(spec, s);
      }
    }
    const bySpecialization = Array.from(specMap.entries())
      .map(([specialization, s]) => ({
        specialization,
        doctorCount: s.count,
        averageRating: s.ratingCount > 0 ? Math.round((s.totalRating / s.ratingCount) * 10) / 10 : null,
      }))
      .sort((a, b) => b.doctorCount - a.doctorCount);

    // Hydrate top doctors
    const topDocIds = topByCompletedAppts.map((r) => r.doctorId);
    const topDocs = await prisma.doctor.findMany({
      where: { id: { in: topDocIds } },
      select: { id: true, firstName: true, lastName: true, specializations: true },
    });
    const docMap = new Map(topDocs.map((d) => [d.id, d]));

    return {
      totals: { total: totalDoctors, approved: approvedDoctors, pending: pendingDoctors, rejected: rejectedDoctors, newThisMonth },
      bySpecialization,
      topDoctorsByCompletedAppointments: topByCompletedAppts.map((r) => ({
        doctor: docMap.get(r.doctorId) ?? null,
        completedAppointments: r._count.id,
      })),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /admin/analytics/appointments — appointment trends
// ────────────────────────────────────────────────────────────

export const getAppointmentAnalytics = async () => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      totalAppointments,
      byStatus,
      monthlyTrend,
      completedCount,
      cancelledCount,
    ] = await Promise.all([
      // Total (not soft-deleted)
      prisma.appointment.count({ where: { deletedAt: null } }),

      // Count per status
      prisma.appointment.groupBy({
        by: ["status"],
        _count: { id: true },
        where: { deletedAt: null },
      }),

      // Monthly appointment booking trend — last 12 months
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
          COUNT(*)::bigint AS count
        FROM appointments
        WHERE created_at >= ${twelveMonthsAgo}
          AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `,

      // Completed this month
      prisma.appointment.count({
        where: {
          status: "COMPLETED",
          deletedAt: null,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      }),

      // Cancelled this month
      prisma.appointment.count({
        where: {
          status: "CANCELLED",
          deletedAt: null,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      }),
    ]);

    // Completion rate
    const completionRate =
      totalAppointments > 0
        ? Math.round((byStatus.find((s) => s.status === "COMPLETED")?._count.id ?? 0) / totalAppointments * 1000) / 10
        : 0;

    // Cancellation rate
    const cancellationRate =
      totalAppointments > 0
        ? Math.round((byStatus.find((s) => s.status === "CANCELLED")?._count.id ?? 0) / totalAppointments * 1000) / 10
        : 0;

    return {
      totals: { total: totalAppointments, completedThisMonth: completedCount, cancelledThisMonth: cancelledCount },
      rates: { completionRate, cancellationRate },
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      monthlyTrend: monthlyTrend.map((r) => ({ month: r.month, count: Number(r.count) })),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// PUT /admin/doctors/:id/approve | /reject
// ────────────────────────────────────────────────────────────

export const updateDoctorApproval = async (
  adminUserId: string,
  doctorId: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string,
) => {
  try {
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId },
      select: { id: true, firstName: true, lastName: true, approvalStatus: true, userId: true },
    });
    if (!doctor) throw new AppError("Doctor not found", 404);

    if (doctor.approvalStatus === status) {
      throw new AppError(`Doctor is already ${status.toLowerCase()}`, 409);
    }

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: { approvalStatus: status },
      select: { id: true, firstName: true, lastName: true, approvalStatus: true },
    });

    // Notify the doctor
    const isApproved = status === "APPROVED";
    void createNotification({
      userId: doctor.userId,
      title: isApproved ? "Application Approved" : "Application Rejected",
      message: isApproved
        ? "Congratulations! Your doctor application has been approved. You can now accept appointments."
        : `Your doctor application has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
      type: "SYSTEM",
    });

    void logAudit({
      userId: adminUserId,
      action: status === "APPROVED" ? "APPROVE_DOCTOR" : "REJECT_DOCTOR",
      entity: "doctor",
      entityId: doctorId,
      oldValue: { approvalStatus: doctor.approvalStatus },
      newValue: { approvalStatus: status, rejectionReason },
    });

    return { doctor: updated, message: `Doctor ${updated.firstName} ${updated.lastName} has been ${status.toLowerCase()}` };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /admin/patients — all patients with filters
// ────────────────────────────────────────────────────────────

export const listAllPatients = async (query: {
  page: number; limit: number; search?: string; isActive?: boolean;
}) => {
  try {
    const where: any = { role: "PATIENT", deletedAt: null };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { patient: { firstName: { contains: query.search, mode: "insensitive" } } },
        { patient: { lastName:  { contains: query.search, mode: "insensitive" } } },
        { patient: { phone:     { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where, skip, take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, isActive: true, createdAt: true,
          patient: {
            select: {
              id: true, firstName: true, lastName: true, phone: true,
              gender: true, dateOfBirth: true, profileImageUrl: true,
              bloodGroup: true, address: true,
              _count: { select: { appointments: true } },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return { patients: users, pagination: { total, page: query.page, limit: query.limit, totalPages } };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// PATCH /admin/appointments/:id/status — update status
// ────────────────────────────────────────────────────────────

const VALID_STATUSES = ["PENDING", "APPROVED", "COMPLETED", "CANCELLED", "REJECTED"] as const;
type AppStatus = (typeof VALID_STATUSES)[number];

export const updateAppointmentStatus = async (
  adminUserId: string,
  appointmentId: string,
  status: AppStatus
) => {
  try {
    const appt = await prisma.appointment.findFirst({
      where: { id: appointmentId, deletedAt: null },
      select: { id: true, status: true, patientId: true, patient: { select: { firstName: true, lastName: true } } },
    });
    if (!appt) throw new AppError("Appointment not found", 404);

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      select: { id: true, status: true, scheduledAt: true },
    });

    void logAudit({
      userId: adminUserId,
      action: "UPDATE_APPOINTMENT_STATUS",
      entity: "appointment",
      entityId: appointmentId,
      oldValue: { status: appt.status },
      newValue: { status },
    });

    return { appointment: updated, message: `Appointment status updated to ${status}` };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

