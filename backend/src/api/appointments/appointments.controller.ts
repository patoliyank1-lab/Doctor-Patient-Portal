import { ZodError } from "zod";
import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import * as appointmentsService from "./appointments.service";
import { createAppointmentSchema, myAppointmentsQuerySchema } from "./appointments.validators";

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
 * @access Patient (cookie JWT)
 */
export const getMyAppointments = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const query = myAppointmentsQuerySchema.parse(req.query);
    const result = await appointmentsService.listMyAppointments(req.user.userId, query);
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

