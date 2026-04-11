import type { NextFunction, Request, Response } from "express";
import type { Role } from "../../prisma/generated/client/enums";

/**
 * give access route base on role
 */
export const authorize = async (
  role:Role
) => {};
