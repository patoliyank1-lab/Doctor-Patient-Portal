import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { ZodError } from "zod";
import * as doctorsService from "./doctors.service";
import {
  doctorIdParamSchema,
  listDoctorsQuerySchema,
  pendingDoctorsQuerySchema,
  updateDoctorStatusBodySchema,
} from "./doctors.validators";

/**
 * @description List approved doctors with pagination/filtering.
 * @route GET /api/v1/doctors
 * @access Public
 */
export const listDoctors = asyncHandler(async (req, res) => {
  try {
    const query = listDoctorsQuerySchema.parse(req.query);
    const result = await doctorsService.listApprovedDoctors(query);
    formattedResponse(res, 200, result, "Doctors fetched successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, {
        errors: error.issues.map((i) => i.message),
      });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Get approved doctor by id.
 * @route GET /api/v1/doctors/:id
 * @access Public
 */
export const getDoctorById = asyncHandler(async (req, res) => {
  try {
    const { id } = doctorIdParamSchema.parse(req.params);
    const doctor = await doctorsService.getApprovedDoctorById(id);
    formattedResponse(res, 200, doctor, "Doctor fetched successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, {
        errors: error.issues.map((i) => i.message),
      });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description List pending doctors (admin).
 * @route GET /api/v1/doctors/pending
 * @access Admin (cookie JWT)
 */
export const listPendingDoctors = asyncHandler(async (req, res) => {
  try {
    const query = pendingDoctorsQuerySchema.parse(req.query);
    const result = await doctorsService.listPendingDoctors(query);
    formattedResponse(res, 200, result, "Pending doctors fetched successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, {
        errors: error.issues.map((i) => i.message),
      });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Update doctor approval status (admin).
 * @route PUT /api/v1/doctors/:id/status
 * @access Admin (cookie JWT)
 */
export const updateDoctorStatus = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = doctorIdParamSchema.parse(req.params);
    const body = updateDoctorStatusBodySchema.parse(req.body);

    const updated = await doctorsService.updateDoctorStatus(req.user.userId, id, body);
    formattedResponse(res, 200, updated, "Doctor status updated successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, {
        errors: error.issues.map((i) => i.message),
      });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

