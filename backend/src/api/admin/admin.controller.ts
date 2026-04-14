import { ZodError } from "zod";
import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import * as adminService from "./admin.service";
import {
  adminListAppointmentsQuerySchema,
  doctorIdParamSchema,
  listAuditLogsQuerySchema,
  listDoctorsAdminQuerySchema,
  listUsersQuerySchema,
  updateDoctorApprovalSchema,
  userIdParamSchema,
} from "./admin.validators";

export const getDashboard = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const result = await adminService.getDashboard();
    formattedResponse(res, 200, result, "Dashboard analytics fetched successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

export const listUsers = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const query = listUsersQuerySchema.parse(req.query);
    const result = await adminService.listAllUsers(query);
    formattedResponse(res, 200, result, "Users fetched successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

export const deactivateUser = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = userIdParamSchema.parse(req.params);
    const result = await adminService.deactivateUser(req.user.userId, id);
    formattedResponse(res, 200, result, result.message);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

export const activateUser = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = userIdParamSchema.parse(req.params);
    const result = await adminService.activateUser(id);
    formattedResponse(res, 200, result, result.message);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const query = listAuditLogsQuerySchema.parse(req.query);
    const result = await adminService.listAuditLogs(query);
    formattedResponse(res, 200, result, "Audit logs fetched successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

export const getAllAppointments = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const query = adminListAppointmentsQuerySchema.parse(req.query);
    const result = await adminService.listAllAppointments(query);
    formattedResponse(res, 200, result, "Appointments fetched successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

export const getPatientAnalytics = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const result = await adminService.getPatientAnalytics();
    formattedResponse(res, 200, result, "Patient analytics fetched successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

export const getDoctorAnalytics = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const result = await adminService.getDoctorAnalytics();
    formattedResponse(res, 200, result, "Doctor analytics fetched successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @route GET /api/v1/admin/analytics/appointments
 * @access Admin
 */
export const getAppointmentAnalytics = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const result = await adminService.getAppointmentAnalytics();
    formattedResponse(res, 200, result, "Appointment analytics fetched successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @route GET /api/v1/admin/doctors
 * @access Admin
 */
export const listDoctors = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const query = listDoctorsAdminQuerySchema.parse(req.query);
    const result = await adminService.listAllDoctors(query);
    formattedResponse(res, 200, result, "Doctors fetched successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @route PUT /api/v1/admin/doctors/:id/approve
 * @access Admin
 */
export const approveDoctor = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = doctorIdParamSchema.parse(req.params);
    const result = await adminService.updateDoctorApproval(req.user.userId, id, "APPROVED");
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
 * @route PUT /api/v1/admin/doctors/:id/reject
 * @access Admin
 */
export const rejectDoctor = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = doctorIdParamSchema.parse(req.params);
    const body = updateDoctorApprovalSchema.parse(req.body);
    const result = await adminService.updateDoctorApproval(req.user.userId, id, "REJECTED", body.rejectionReason);
    formattedResponse(res, 200, result, result.message);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Validation failed", 400, { errors: error.issues.map((i) => i.message) });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

export const listPatients = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search    = typeof req.query.search === "string" ? req.query.search : undefined;
    const isActiveR = req.query.isActive;
    const isActive  = isActiveR === "true" ? true : isActiveR === "false" ? false : undefined;
    const result = await adminService.listAllPatients({ page, limit, search, isActive });
    formattedResponse(res, 200, result, "Patients fetched successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = req.params;
    if (!id) throw new AppError("Appointment id required", 400);
    const { status } = req.body as { status: string };
    const ALLOWED = ["PENDING", "APPROVED", "COMPLETED", "CANCELLED", "REJECTED"];
    if (!status || !ALLOWED.includes(status)) {
      throw new AppError(`status must be one of ${ALLOWED.join(", ")}`, 400);
    }
    const result = await adminService.updateAppointmentStatus(req.user.userId, id, status as any);
    formattedResponse(res, 200, result, result.message);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});
