import { ZodError } from "zod";
import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { Role } from "../../../prisma/generated/client/enums";
import * as appointmentsService from "./appointments.service";
import {
  appointmentIdParamSchema,
  cancelAppointmentSchema,
  createAppointmentSchema,
  myAppointmentsQuerySchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
  addDoctorNotesSchema,
} from "./appointments.validators";

/**
 * @description Book an appointment for authenticated patient using a slot
 * @route POST /api/v1/appointments
 * @access Patient (cookie JWT)
 */
export const createAppointment = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input = createAppointmentSchema.parse(req.body);
    const created = await appointmentsService.bookAppointment(req.user.userId, input);
    formattedResponse(res, 201, created, "Appointment booked successfully");
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
 * @description Get authenticated patient's appointments (paginated)
 * @route GET /api/v1/appointments/my
 * @access Patient/Doctor (cookie JWT) — response scoped by role
 */
export const getMyAppointments = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const query = myAppointmentsQuerySchema.parse(req.query);
    const result =
      req.user.role === Role.DOCTOR
        ? await appointmentsService.listMyAppointmentsForDoctor(req.user.userId, query)
        : await appointmentsService.listMyAppointments(req.user.userId, query);
    formattedResponse(res, 200, result, "Appointments fetched successfully");
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
 * @description Get appointment details with role-based access control
 * @route GET /api/v1/appointments/:id
 * @access Patient/Doctor/Admin (cookie JWT)
 */
export const getAppointmentById = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId || !req.user?.role) throw new AppError("Unauthorized", 401);
    const { id } = appointmentIdParamSchema.parse(req.params);
    const result = await appointmentsService.getAppointmentDetail(req.user.userId, req.user.role, id);
    formattedResponse(res, 200, result, "Appointment fetched successfully");
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
 * @description Update appointment status for authenticated doctor
 * @route PUT /api/v1/appointments/:id/status
 * @access Doctor (cookie JWT)
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = appointmentIdParamSchema.parse(req.params);
    const input = updateAppointmentStatusSchema.parse(req.body);
    const updated = await appointmentsService.updateAppointmentStatusForDoctor(req.user.userId, id, input);
    formattedResponse(res, 200, updated, "Appointment status updated successfully");
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
 * @description Cancel an appointment owned by authenticated patient
 * @route PUT /api/v1/appointments/:id/cancel
 * @access Patient (cookie JWT)
 */
export const cancelAppointment = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = appointmentIdParamSchema.parse(req.params);
    const body = cancelAppointmentSchema.parse(req.body ?? {});
    const updated = await appointmentsService.cancelAppointment(req.user.userId, id, body);
    formattedResponse(res, 200, updated, "Appointment cancelled successfully");
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
 * @description Reschedule an appointment owned by authenticated patient to a new slot
 * @route PUT /api/v1/appointments/:id/reschedule
 * @access Patient (cookie JWT)
 */
export const rescheduleAppointment = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = appointmentIdParamSchema.parse(req.params);
    const input = rescheduleAppointmentSchema.parse(req.body);
    const updated = await appointmentsService.rescheduleAppointment(req.user.userId, id, input);
    formattedResponse(res, 200, updated, "Appointment rescheduled successfully");
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
 * @description Add or update clinical notes on an appointment (Doctor)
 * @route PUT /api/v1/appointments/:id/notes
 * @access Doctor (cookie JWT)
 */
export const addDoctorNotes = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const { id } = appointmentIdParamSchema.parse(req.params);
    const input = addDoctorNotesSchema.parse(req.body);
    const updated = await appointmentsService.saveAppointmentNotes(req.user.userId, id, input.notes);
    formattedResponse(res, 200, updated, "Clinical notes saved successfully");
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
