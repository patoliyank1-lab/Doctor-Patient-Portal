import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_COOKIE_NAME } from "../utils/ApiResponse";
import { AppError, UnknownError } from "../utils/errorHandler";
import { verifyToken } from "../utils/token";

/**
 * authenticate user for all service  
 * @param req
 * @param res
 * @param next
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];
    if (!token || typeof token !== "string") {
      throw new AppError("Unauthorized", 401);
    }

    const payload = verifyToken(token);
    if (
      !payload ||
      typeof payload !== "object" ||
      typeof (payload as any).userId !== "string" ||
      typeof (payload as any).email !== "string" ||
      typeof (payload as any).role !== "string"
    ) {
      throw new AppError("Unauthorized", 401);
    }

    req.user = payload as any;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("Unauthorized", 401, { errors: ["Token expired"] }));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Unauthorized", 401, { errors: ["Invalid token"] }));
    }
    if (error instanceof AppError) return next(error);
    return next(new UnknownError(error));
  }
};
