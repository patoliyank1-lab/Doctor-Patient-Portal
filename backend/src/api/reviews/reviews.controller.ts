import { ZodError } from "zod";
import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import * as reviewsService from "./reviews.service";
import {
  createReviewSchema,
  doctorIdParamSchema,
  listReviewsQuerySchema,
  reviewIdParamSchema,
} from "./reviews.validators";

/**
 * @description Submit a review for a completed appointment.
 * @route POST /api/v1/reviews
 * @access Patient
 */
export const createReview = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input = createReviewSchema.parse(req.body);
    const review = await reviewsService.submitReview(req.user.userId, input);
    formattedResponse(res, 201, review, "Review submitted successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Get all reviews for a specific doctor (with average rating).
 * @route GET /api/v1/reviews/doctor/:doctorId
 * @access Auth
 */
export const getDoctorReviews = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { doctorId } = doctorIdParamSchema.parse(req.params);
    const query = listReviewsQuerySchema.parse(req.query);
    const result = await reviewsService.listDoctorReviews(doctorId, query);
    formattedResponse(res, 200, result, "Doctor reviews fetched successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Get all reviews submitted by the authenticated patient.
 * @route GET /api/v1/reviews/my
 * @access Patient
 */
export const getMyReviews = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const query = listReviewsQuerySchema.parse(req.query);
    const result = await reviewsService.listMyReviews(req.user.userId, query);
    formattedResponse(res, 200, result, "Your reviews fetched successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Delete a review. Patient can delete own; Admin can delete any.
 * @route DELETE /api/v1/reviews/:id
 * @access Patient | Admin
 */
export const deleteReview = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId || !req.user?.role) throw new AppError("Unauthorized", 401);
    const { id } = reviewIdParamSchema.parse(req.params);
    const result = await reviewsService.deleteReview(req.user.userId, req.user.role, id);
    formattedResponse(res, 200, result, "Review deleted successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});
