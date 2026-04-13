import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { ZodError } from "zod";
import * as patientsService from "./patients.service";
import { listPatientsQuerySchema, patientIdParamSchema } from "./patients.validators";

/**
 * @description List patients with pagination/filtering.
 * @route GET /api/v1/patients
 * @access Admin (cookie JWT)
 */
export const listPatients = asyncHandler(async (req, res) => {
  try {
    const query = listPatientsQuerySchema.parse(req.query);
    const result = await patientsService.listPatients(query);
    formattedResponse(res, 200, result, "Patients fetched successfully");
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
 * @description Get patient by id (role-scoped).
 * @route GET /api/v1/patients/:id
 * @access Admin, Doctor (cookie JWT)
 */
export const getPatientById = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId || !req.user?.role) throw new AppError("Unauthorized", 401);

    const { id } = patientIdParamSchema.parse(req.params);

    const patient = await patientsService.getPatientById({
      requester: {
        userId: req.user.userId,
        role: req.user.role,
        doctorId: req.user.doctorId,
      },
      patientId: id,
    });

    formattedResponse(res, 200, patient, "Patient fetched successfully");
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

