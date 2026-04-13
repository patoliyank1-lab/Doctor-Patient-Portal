import { clearAuthCookies, formattedError, formattedResponse, REFRESH_TOKEN_COOKIE_NAME, setAccessTokenCookie, setAuthCookies } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, UnknownError } from "../../utils/errorHandler";
import * as authService from "./auth.service";
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type VerifyEmailInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "./auth.validators";
import { ZodError } from "zod";

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

    const response = await authService.register({
      email,
      passwordHash: password,
      role,
    });

    if (response)
      formattedResponse(res, 201, response, "User Register successfully.");
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
 * @description Login user (NOT implemented yet).
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password }: LoginInput = loginSchema.parse(req.body);
    const { user, tokens } = await authService.login(email, password);
    setAuthCookies(res, tokens);
    formattedResponse(res, 200, user, "Login successful");
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
 * @description Logout user (NOT implemented yet).
 * @route POST /api/auth/logout
 * @access Auth
 */
export const logoutUser = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);
  formattedResponse(res, 200, { loggedOut: true }, "Logout successful");
});

/**
 * @description Verify email via token (NOT implemented yet).
 * @route POST /api/auth/verify-email
 * @access Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const token = String((req.body?.token ?? req.query?.token) ?? "");
    const { token: parsedToken }: VerifyEmailInput = verifyEmailSchema.parse({
      token,
    });
    const result = await authService.verifyEmailToken(parsedToken);
    formattedResponse(res, 200, result, "Email verified successfully");
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
 * @description Send reset link to user email.
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const { email }: ForgotPasswordInput = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);
    formattedResponse(
      res,
      200,
      { sent: true },
      "If an account exists for this email, a reset link has been sent",
    );
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
 * @description Reset password using token.
 * @route POST /api/auth/reset-password
 * @access Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  try {
    const { token, password }: ResetPasswordInput = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(token, password);
    clearAuthCookies(res);
    formattedResponse(res, 200, result, "Password reset successfully");
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
 * @description Get current user.
 * @route GET /api/auth/me
 * @access Protected
 */
export const me = asyncHandler(async (req, res) => {
  try {
    if (!req.user?.userId) throw new AppError("Unauthorized", 401);
    const user = await authService.getCurrentUser(req.user.userId);
    formattedResponse(res, 200, user, "Current user fetched successfully");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});

/**
 * @description Refresh access token using refresh token cookie.
 * @route POST /api/auth/refresh-token
 * @access Public (cookie-based)
 */
export const refreshToken = asyncHandler(async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!token || typeof token !== "string") {
      throw new AppError("Unauthorized", 401, { errors: ["Missing refresh token"] });
    }

    const { accessToken } = await authService.refreshAccessToken(token);
    setAccessTokenCookie(res, accessToken);
    formattedResponse(res, 200, null, "Access token refreshed");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
});
