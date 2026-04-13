import type { NextFunction, Request, Response } from "express";
import type { Role } from "../../prisma/generated/client/enums";
import { AppError, UnknownError } from "../utils/errorHandler";

/**
 * give access route base on role
 */
export const authorize =
  (role: Role) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
      if (!userRole) return next(new AppError("Unauthorized", 401));
      if (userRole !== role) return next(new AppError("Forbidden", 403));
      return next();
    } catch (error) {
      return next(new UnknownError(error));
    }
  };

/**
 * give access route based on any allowed role
 */
export const authorizeAny =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
      if (!userRole) return next(new AppError("Unauthorized", 401));
      if (!roles.includes(userRole)) return next(new AppError("Forbidden", 403));
      return next();
    } catch (error) {
      return next(new UnknownError(error));
    }
  };
