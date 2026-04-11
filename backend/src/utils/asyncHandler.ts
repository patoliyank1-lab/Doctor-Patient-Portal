import type { NextFunction, RequestHandler, Request, Response } from "express";

/**
 * function for Handler controller
 * @param callback controller function 
 * @returns function 
 */
export const asyncHandler = (
  callback: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => Promise<any>,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(callback(req, res, next)).catch(next);
  };
};