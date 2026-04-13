import { ZodError } from "zod";
import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import * as medicalRecordsService from "./medical-records.service";
import {
  createRecordSchema,
  listRecordsQuerySchema,
  patientIdParamSchema,
  recordIdParamSchema,
} from "./medical-records.validators";

/**
 * @description Upload a new medical record.
 *   - Patient: uploads their own record (patientId inferred from auth).
 *   - Doctor:  uploads for a patient (patientId required in body).
 * @route POST /api/v1/medical-records
 * @access Patient | Doctor
 */
export const createRecord = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId || !req.user?.role) throw new AppError("Unauthorized", 401);
    const input = createRecordSchema.parse(req.body);
    const record = await medicalRecordsService.createRecord(req.user.userId, req.user.role, input);
    formattedResponse(res, 201, record, "Medical record uploaded successfully");
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
 * @description Get the authenticated patient's own medical records (paginated).
 * @route GET /api/v1/medical-records/my
 * @access Patient
 */
export const getMyRecords = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const query = listRecordsQuerySchema.parse(req.query);
    const result = await medicalRecordsService.listMyRecords(req.user.userId, query);
    formattedResponse(res, 200, result, "Medical records fetched successfully");
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
 * @description Get all medical records of a specific patient (doctor view).
 * @route GET /api/v1/medical-records/patient/:patientId
 * @access Doctor
 */
export const getPatientRecords = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { patientId } = patientIdParamSchema.parse(req.params);
    const query = listRecordsQuerySchema.parse(req.query);
    const result = await medicalRecordsService.listPatientRecords(req.user.userId, patientId, query);
    formattedResponse(res, 200, result, "Patient medical records fetched successfully");
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
 * @description Get a single medical record by ID (role-based access control).
 * @route GET /api/v1/medical-records/:id
 * @access Auth (Patient/Doctor/Admin)
 */
export const getRecord = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId || !req.user?.role) throw new AppError("Unauthorized", 401);
    const { id } = recordIdParamSchema.parse(req.params);
    const record = await medicalRecordsService.getRecordById(req.user.userId, req.user.role, id);
    formattedResponse(res, 200, record, "Medical record fetched successfully");
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
 * @description Soft-delete a patient's own medical record.
 * @route DELETE /api/v1/medical-records/:id
 * @access Patient
 */
export const deleteRecord = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = recordIdParamSchema.parse(req.params);
    const result = await medicalRecordsService.softDeleteRecord(req.user.userId, id);
    formattedResponse(res, 200, result, "Medical record deleted successfully");
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
