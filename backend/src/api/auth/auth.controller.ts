import { Role } from "../../../prisma/generated/client/enums";
import { formattedResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import * as authService from "./auth.service";
import { registerSchema, type RegisterInput } from "./auth.validators";

/**
 * @description Registers a new user in the system.
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  try {
    const { email, password, role }: RegisterInput = registerSchema.parse(
      req.body,
    );

    if (role == "ADMIN") throw new AppError("Invalide Role ", 400);

    const response = await authService.register({
      email,
      passwordHash: password,
      role,
    });

    if (response)
      formattedResponse(res, 201, response, "User Register successfully.");
  } catch (error) {
    throw new UnknownError(error);
  }
});
