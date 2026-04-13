import { ZodError } from "zod";
import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import * as notificationsService from "./notifications.service";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from "./notifications.validators";

/**
 * @description Get paginated notifications for the authenticated user.
 * @route GET /api/v1/notifications
 * @access Auth
 */
export const getNotifications = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const query = listNotificationsQuerySchema.parse(req.query);
    const result = await notificationsService.listNotifications(req.user.userId, query);
    formattedResponse(res, 200, result, "Notifications fetched successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Get total count of unread notifications.
 * @route GET /api/v1/notifications/unread-count
 * @access Auth
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const result = await notificationsService.getUnreadCount(req.user.userId);
    formattedResponse(res, 200, result, "Unread count fetched successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Mark a single notification as read.
 * @route PUT /api/v1/notifications/:id/read
 * @access Auth
 */
export const markAsRead = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = notificationIdParamSchema.parse(req.params);
    const result = await notificationsService.markAsRead(req.user.userId, id);
    formattedResponse(res, 200, result, result.message);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Mark all unread notifications as read.
 * @route PUT /api/v1/notifications/read-all
 * @access Auth
 */
export const markAllRead = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const result = await notificationsService.markAllRead(req.user.userId);
    formattedResponse(res, 200, result, "All notifications marked as read");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Permanently delete a notification.
 * @route DELETE /api/v1/notifications/:id
 * @access Auth
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = notificationIdParamSchema.parse(req.params);
    const result = await notificationsService.deleteNotification(req.user.userId, id);
    formattedResponse(res, 200, result, "Notification deleted successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});
