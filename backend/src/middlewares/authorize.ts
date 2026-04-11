import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

/**
 * give access route base on role
 */
export const authorize = async (
  role:Role
) => {};
