import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { ZodError } from "zod";
import * as slotsService from "./slots.service";
import { bulkSlotInputSchema, slotInputSchema } from "./slots.validators";

/**
 * @description Create a single availability slot for authenticated doctor.
 * @route POST /api/v1/slots
 * @access Doctor (cookie JWT)
 */
export const createSlot = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const input = slotInputSchema.parse(req.body);
    const created = await slotsService.createSlotForDoctor(req.user.userId, input);
    formattedResponse(res, 201, created, "Slot created successfully");
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
 * @description Create multiple availability slots for authenticated doctor.
 * @route POST /api/v1/slots/bulk
 * @access Doctor (cookie JWT)
 */
export const createSlotsBulk = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const body = bulkSlotInputSchema.parse(req.body);
    const result = await slotsService.bulkCreateSlotsForDoctor(req.user.userId, body.slots);
    formattedResponse(res, 201, result, "Slots created successfully");
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

