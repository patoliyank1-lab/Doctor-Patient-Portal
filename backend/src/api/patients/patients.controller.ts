import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { ZodError } from "zod";
import * as patientsService from "./patients.service";
import {
  createPatientProfileSchema,
  listPatientsQuerySchema,
  patientIdParamSchema,
  type CreatePatientProfileInput,
  updateMyPatientImageSchema,
  updateMyPatientProfileSchema,
  type UpdateMyPatientImageInput,
  type UpdateMyPatientProfileInput,
} from "./patients.validators";

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

/**
 * @description Get own patient profile.
 * @route GET /api/v1/patients/me
 * @access Patient (cookie JWT)
 */
export const getMyPatientProfile = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const patient = await patientsService.getPatientProfileByUserId(req.user.userId);
    formattedResponse(res, 200, patient, "Patient profile fetched successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Create own patient profile.
 * @route POST /api/v1/patients/me
 * @access Patient (cookie JWT)
 */
export const createMyPatientProfile = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input: CreatePatientProfileInput = createPatientProfileSchema.parse(req.body);
    const created = await patientsService.createPatientProfileForUser(req.user.userId, input);
    formattedResponse(res, 201, created, "Patient profile created successfully");
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
 * @description Update own patient profile (partial update).
 * @route PUT /api/v1/patients/me
 * @access Patient (cookie JWT)
 */
export const updateMyPatientProfile = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input: UpdateMyPatientProfileInput = updateMyPatientProfileSchema.parse(req.body);
    const updated = await patientsService.updateMyPatientProfile(req.user.userId, input);
    formattedResponse(res, 200, updated, "Patient profile updated successfully");
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
 * @description Update own patient profile image.
 * @route PUT /api/v1/patients/me/image
 * @access Patient (cookie JWT)
 */
export const updateMyPatientImage = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input: UpdateMyPatientImageInput = updateMyPatientImageSchema.parse(req.body);
    const updated = await patientsService.updateMyPatientImage(req.user.userId, input);
    formattedResponse(res, 200, updated, "Patient profile image updated successfully");
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
 * @description Deactivate patient account (soft delete).
 * @route PUT /api/v1/patients/me/deactivate
 * @access Patient (cookie JWT)
 */
export const deactivateMyPatientAccount = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    await patientsService.deactivateMyPatientAccount(req.user.userId);
    formattedResponse(res, 200, null, "Account deactivated successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

