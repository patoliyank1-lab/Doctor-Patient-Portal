import { AppointmentStatus, Role } from "../../../prisma/generated/client/enums";
import { Prisma } from "../../../prisma/generated/client/client";
import { prisma } from "../../config/database";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { createNotification } from "../notifications/notifications.service";
import { logAudit } from "../../utils/auditLog";
import type {
  CreateReviewInput,
  ListReviewsQuery,
} from "./reviews.validators";

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

const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: { id: true, firstName: true, lastName: true, profileImageUrl: true },
  },
  doctor: {
    select: { id: true, firstName: true, lastName: true, specializations: true },
  },
  appointment: {
    select: { id: true, scheduledAt: true },
  },
} as const;

// ────────────────────────────────────────────────────────────
// POST /reviews — Patient submits a review for a completed appointment
// ────────────────────────────────────────────────────────────

export const submitReview = async (userId: string, input: CreateReviewInput) => {
  try {
    const patientId = await findPatientIdByUserId(userId);

    // Verify the appointment belongs to this patient and is COMPLETED
    const appointment = await prisma.appointment.findFirst({
      where: { id: input.appointmentId, patientId, deletedAt: null },
      select: {
        id: true,
        status: true,
        doctorId: true,
        doctor: { select: { id: true, firstName: true, lastName: true, userId: true } },
      },
    });
    if (!appointment) throw new AppError("Appointment not found", 404);
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new AppError("You can only review completed appointments", 400);
    }

    // Check if a review already exists for this appointment
    const existing = await prisma.review.findUnique({
      where: { appointmentId: input.appointmentId },
      select: { id: true },
    });
    if (existing) throw new AppError("You have already reviewed this appointment", 409);

    const review = await prisma.review.create({
      data: {
        patientId,
        doctorId: appointment.doctorId,
        appointmentId: input.appointmentId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
      select: reviewSelect,
    });

    // Notify the doctor
    await createNotification({
      userId: appointment.doctor.userId,
      title: "New Review Received",
      message: `You received a ${input.rating}-star review from ${review.patient.firstName} ${review.patient.lastName}.`,
      type: "SYSTEM",
      referenceId: review.id,
      referenceType: "review",
    });

    void logAudit({
      userId,
      action: "CREATE",
      entity: "review",
      entityId: review.id,
      newValue: { rating: review.rating, doctorId: review.doctor.id, appointmentId: input.appointmentId },
    });

    return review;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new AppError("You have already reviewed this appointment", 409);
      }
    }
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /reviews/doctor/:doctorId — all reviews for a doctor
// ────────────────────────────────────────────────────────────

export const listDoctorReviews = async (
  doctorId: string,
  query: ListReviewsQuery,
) => {
  try {
    // Verify the doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true },
    });
    if (!doctor) throw new AppError("Doctor not found", 404);

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where: { doctorId } }),
      prisma.review.findMany({
        where: { doctorId },
        skip,
        take,
        select: reviewSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Compute average rating
    const aggregate = await prisma.review.aggregate({
      where: { doctorId },
      _avg: { rating: true },
    });

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      reviews,
      averageRating: aggregate._avg.rating
        ? Math.round(aggregate._avg.rating * 10) / 10
        : null,
      pagination: { total, page: query.page, limit: query.limit, totalPages },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /reviews/my — patient's own submitted reviews
// ────────────────────────────────────────────────────────────

export const listMyReviews = async (userId: string, query: ListReviewsQuery) => {
  try {
    const patientId = await findPatientIdByUserId(userId);

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where: { patientId } }),
      prisma.review.findMany({
        where: { patientId },
        skip,
        take,
        select: reviewSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      reviews,
      pagination: { total, page: query.page, limit: query.limit, totalPages },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// DELETE /reviews/:id — Patient deletes own review | Admin deletes any
// ────────────────────────────────────────────────────────────

export const deleteReview = async (
  userId: string,
  role: Role,
  reviewId: string,
) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        patient: { select: { userId: true } },
      },
    });
    if (!review) throw new AppError("Review not found", 404);

    // Admin can delete any review; patient can only delete their own
    if (role !== Role.ADMIN && review.patient.userId !== userId) {
      throw new AppError("Forbidden", 403);
    }

    await prisma.review.delete({ where: { id: review.id } });

    void logAudit({
      userId,
      action: "DELETE",
      entity: "review",
      entityId: reviewId,
      oldValue: { deletedByRole: role },
    });

    return { message: "Review deleted successfully" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};
