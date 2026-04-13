import { prisma } from "../../config/database";
import { AppError, UnknownError } from "../../utils/errorHandler";
import type { ListNotificationsQuery } from "./notifications.validators";

// ────────────────────────────────────────────────────────────
// Shared select shape
// ────────────────────────────────────────────────────────────

const notificationSelect = {
  id: true,
  title: true,
  message: true,
  type: true,
  isRead: true,
  referenceId: true,
  referenceType: true,
  createdAt: true,
} as const;

// ────────────────────────────────────────────────────────────
// createNotification — INTERNAL HELPER (not a public endpoint)
// Import and call this from any other service to fire a notification.
// ────────────────────────────────────────────────────────────

export type CreateNotificationInput = {
  /** The User.id who should receive the notification */
  userId: string;
  title: string;
  message: string;
  type: "APPOINTMENT" | "SYSTEM" | "ALERT";
  /** ID of the related entity (e.g. appointment id, record id) */
  referenceId?: string;
  /** Human-readable entity type, e.g. "appointment" | "medical_record" */
  referenceType?: string;
};

/**
 * Create a single in-app notification.
 *
 * Fire-and-forget safe — errors are swallowed so a failed notification
 * never rolls back the parent business transaction.
 *
 * @example — inside appointments.service.ts after booking:
 * ```ts
 * import { createNotification } from "../notifications/notifications.service";
 *
 * await createNotification({
 *   userId: patientUserId,
 *   title: "Appointment Booked",
 *   message: `Your appointment with Dr. ${doctor.lastName} has been booked.`,
 *   type: "APPOINTMENT",
 *   referenceId: appointment.id,
 *   referenceType: "appointment",
 * });
 * ```
 */
export const createNotification = async (
  input: CreateNotificationInput,
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        referenceId: input.referenceId ?? null,
        referenceType: input.referenceType ?? null,
      },
    });
  } catch {
    // Intentionally swallowed — notification failure must not break
    // the business transaction that triggered it.
    console.error("[createNotification] failed silently for userId:", input.userId);
  }
};

// ────────────────────────────────────────────────────────────
// GET /notifications — paginated list for current user
// ────────────────────────────────────────────────────────────

export const listNotifications = async (
  userId: string,
  query: ListNotificationsQuery,
) => {
  try {
    const where: {
      userId: string;
      isRead?: boolean;
      type?: "APPOINTMENT" | "SYSTEM" | "ALERT";
    } = { userId };

    if (query.isRead !== undefined) where.isRead = query.isRead;
    if (query.type) where.type = query.type;

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take,
        select: notificationSelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      notifications,
      pagination: { total, page: query.page, limit: query.limit, totalPages },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// GET /notifications/unread-count
// ────────────────────────────────────────────────────────────

export const getUnreadCount = async (userId: string) => {
  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// PUT /notifications/:id/read
// ────────────────────────────────────────────────────────────

export const markAsRead = async (userId: string, notificationId: string) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true, isRead: true },
    });
    if (!notification) throw new AppError("Notification not found", 404);

    if (notification.isRead) return { message: "Notification already marked as read" };

    await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });
    return { message: "Notification marked as read" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// PUT /notifications/read-all
// ────────────────────────────────────────────────────────────

export const markAllRead = async (userId: string) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updatedCount: result.count };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

// ────────────────────────────────────────────────────────────
// DELETE /notifications/:id
// ────────────────────────────────────────────────────────────

export const deleteNotification = async (userId: string, notificationId: string) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    });
    if (!notification) throw new AppError("Notification not found", 404);

    await prisma.notification.delete({ where: { id: notification.id } });
    return { message: "Notification deleted successfully" };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};
