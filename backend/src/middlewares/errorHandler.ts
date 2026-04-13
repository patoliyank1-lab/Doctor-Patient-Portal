import type { ErrorRequestHandler } from "express";
import { formattedError } from "../utils/ApiResponse";

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
  if (statusCode >= 500) {
    req.log.error(err);
  } else {
    req.log.warn(`${statusCode} - ${message}`); // highlight error by bold red color
  }
  formattedError(res, statusCode, message, errors);
};