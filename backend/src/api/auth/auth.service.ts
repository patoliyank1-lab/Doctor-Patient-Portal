import { Prisma } from "../../../prisma/generated/client/client";
import { TokenType } from "../../../prisma/generated/client/enums";
import { prisma } from "../../config/database";
import type { UserType } from "../../types";
import { AppError, UnknownError } from "../../utils/errorHandler";
import { comparePassword, hashPassword } from "../../utils/password";
import { createAccessToken, createRefreshToken, verifyToken } from "../../utils/token";
import bcrypt from "bcrypt";
import { createOneTimeToken, consumeOneTimeToken } from "../../utils/verificationToken";
import { buildForgotPasswordTemplate, buildVerifyEmailTemplate, sendEmail } from "../../utils/email";
import jwt from "jsonwebtoken";

const DUMMY_PASSWORD_HASH = bcrypt.hashSync("invalid-password", 10);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

/**
 * create new user
 * @param user user details
 * @returns return new created user's email and username
 */
export const register = async (user: UserType) => {
  try {
    user.passwordHash = await hashPassword(user.passwordHash);

    const newUser = await prisma.user.create({ data: user });

    return {
      email: newUser.email,
      role: newUser.role,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation (email already exists)
      if (error.code === "P2002") {
        throw new AppError("Email is already registered", 409);
      }
    }
    throw new UnknownError(error);
  }
};

export const login = async (email: string, password: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, role: true },
    });

    // Avoid user enumeration: always run a bcrypt comparison
    const hashToCompare = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const isValid = await comparePassword(password, hashToCompare);
    if (!user || !isValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const accessToken = createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = createRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: { id: user.id, email: user.email, role: user.role },
      tokens: { accessToken, refreshToken },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const sendVerificationEmail = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) throw new AppError("User not found", 404);
    if (user.emailVerified) throw new AppError("Email already verified", 400);

    const { rawToken } = await createOneTimeToken({
      userId: user.id,
      type: TokenType.EMAIL_VERIFICATION,
      ttlMs: 15 * 60 * 1000,
    });

    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;
    const tpl = buildVerifyEmailTemplate({ verifyUrl });
    await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html });

    return { sent: true };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const verifyEmailToken = async (rawToken: string) => {
  try {
    const consumed = await consumeOneTimeToken({
      rawToken,
      type: TokenType.EMAIL_VERIFICATION,
    });

    if (!consumed) throw new AppError("Invalid token", 400);
    if (consumed.status === "EXPIRED") throw new AppError("Token expired", 400);
    if (consumed.status === "USED") throw new AppError("Token already used", 400);

    const user = await prisma.user.findUnique({
      where: { id: consumed.record.userId },
      select: { id: true, email: true, emailVerified: true },
    });
    if (!user) throw new AppError("User not found", 404);
    if (user.emailVerified) throw new AppError("Email already verified", 400);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return { verified: true, email: user.email };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const forgotPassword = async (email: string) => {
  const genericResponse = { sent: true };
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // Prevent user enumeration: always return success.
    if (!user) return genericResponse;

    const { rawToken } = await createOneTimeToken({
      userId: user.id,
      type: TokenType.PASSWORD_RESET,
      ttlMs: 15 * 60 * 1000,
    });

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const tpl = buildForgotPasswordTemplate({ resetUrl });

    try {
      await sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html });
    } catch (mailErr) {
      // Do not leak whether the email exists; log and still respond success.
      // eslint-disable-next-line no-console
      console.error("forgotPassword email send failed:", mailErr);
    }

    return genericResponse;
  } catch (error) {
    // Do not leak existence even on DB issues; return generic error only for systemic failures.
    throw new UnknownError(error);
  }
};

export const resetPassword = async (rawToken: string, newPassword: string) => {
  try {
    const consumed = await consumeOneTimeToken({
      rawToken,
      type: TokenType.PASSWORD_RESET,
    });

    if (!consumed || consumed.status !== "OK") {
      throw new AppError("Invalid or expired token", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: consumed.record.userId },
      select: { id: true },
    });
    if (!user) throw new AppError("Invalid or expired token", 400);

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { reset: true };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const getCurrentUser = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
      },
    });
    if (!user) throw new AppError("User not found", 404);
    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const payload = verifyToken(refreshToken) as any;

    const userId = payload?.userId;
    if (!userId || typeof userId !== "string") {
      throw new AppError("Unauthorized", 401, { errors: ["Invalid refresh token"] });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new AppError("Unauthorized", 401, { errors: ["User is inactive"] });
    }

    const accessToken = createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError("Unauthorized", 401, { errors: ["Refresh token expired"] });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError("Unauthorized", 401, { errors: ["Invalid refresh token"] });
    }
    if (error instanceof AppError) throw error;
    throw new UnknownError(error);
  }
};
