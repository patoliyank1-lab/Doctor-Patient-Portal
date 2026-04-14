import type { ErrorRequestHandler } from "express";
import { formattedError } from "../utils/ApiResponse";
import { Logger } from "../utils/logger.js";

export const errorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next,
): void => {
  const statusCode = err.statusCode ?? 500;
  const message =
    typeof err.message === "string" && err.message.length > 0
      ? err.message
      : "Something went wrong!";
  const errors =
    Array.isArray(err.errors) && err.errors.every((e: unknown) => typeof e === "string")
      ? (err.errors as string[])
      : null;

  // req.log is attached by winLogger middleware — fall back to module Logger
  // if the error occurred before that middleware ran (e.g. CORS errors)
  const log = req.log ?? Logger;

  if (statusCode >= 500) {
    log.error(err);
  } else {
    log.warn(`${statusCode} - ${message}`);
  }
  formattedError(res, statusCode, message, errors);
};