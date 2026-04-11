import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next,
): void => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? "Something went wrong!";
  if (statusCode >= 500) {
    req.log.error(err);
  } else {
    req.log.warn(`${statusCode} - ${message}`); // highlight error by bold red color
  }
  // send error response
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
  });
};