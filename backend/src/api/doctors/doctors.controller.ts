import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { ZodError } from "zod";
import * as doctorsService from "./doctors.service";
import { doctorIdParamSchema, listDoctorsQuerySchema } from "./doctors.validators";

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

