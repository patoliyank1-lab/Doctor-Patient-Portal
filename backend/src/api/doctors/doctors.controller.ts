import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { ZodError } from "zod";
import * as doctorsService from "./doctors.service";
import {
  doctorIdParamSchema,
  createDoctorProfileSchema,
  listDoctorsQuerySchema,
  pendingDoctorsQuerySchema,
  type CreateDoctorProfileInput,
  updateMyDoctorImageSchema,
  updateMyDoctorProfileSchema,
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

/**
 * @description Get own doctor profile.
 * @route GET /api/v1/doctors/me
 * @access Doctor (cookie JWT)
 */
export const getMyDoctorProfile = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const doctor = await doctorsService.getDoctorProfileByUserId(req.user.userId);
    formattedResponse(res, 200, doctor, "Doctor profile fetched successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Create own doctor profile.
 * @route POST /api/v1/doctors/me
 * @access Doctor (cookie JWT)
 */
export const createMyDoctorProfile = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input: CreateDoctorProfileInput = createDoctorProfileSchema.parse(req.body);
    const created = await doctorsService.createDoctorProfileForUser(req.user.userId, input);
    formattedResponse(res, 201, created, "Doctor profile created successfully");
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
 * @description Update own doctor profile.
 * @route PUT /api/v1/doctors/me
 * @access Doctor (cookie JWT)
 */
export const updateMyDoctorProfile = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input = updateMyDoctorProfileSchema.parse(req.body);
    const result = await doctorsService.updateMyDoctorProfile(req.user.userId, input);
    formattedResponse(res, 200, result, "Doctor profile updated successfully");
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
 * @description Update own doctor profile image.
 * @route PUT /api/v1/doctors/me/image
 * @access Doctor (cookie JWT)
 */
export const updateMyDoctorImage = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input = updateMyDoctorImageSchema.parse(req.body);
    const updated = await doctorsService.updateMyDoctorImage(req.user.userId, input);
    formattedResponse(res, 200, updated, "Doctor profile image updated successfully");
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
 * @description Deactivate doctor account (soft delete).
 * @route PUT /api/v1/doctors/me/deactivate
 * @access Doctor (cookie JWT)
 */
export const deactivateMyDoctorAccount = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    await doctorsService.deactivateMyDoctorAccount(req.user.userId);
    formattedResponse(res, 200, null, "Account deactivated successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

