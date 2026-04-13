import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import * as doctorService from "./doctor.service";
import {
  createDoctorProfileSchema,
  type CreateDoctorProfileInput,
} from "./doctor.validators";
import { ZodError } from "zod";

/**
 * @description Create doctor profile for authenticated doctor.
 * @route POST /api/v1/doctor/profile
 * @access Doctor (cookie JWT)
 */
export const createDoctorProfile = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);

    const input: CreateDoctorProfileInput = createDoctorProfileSchema.parse(req.body);
    const created = await doctorService.createDoctorProfile(req.user.userId, input);

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

