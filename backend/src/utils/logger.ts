import winston from "winston";
import { v4 as uuidv4 } from "uuid";
import type { NextFunction, Request, Response } from "express";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = (): string => {
  return "debug";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const transports = [new winston.transports.Console()];

export const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export const winLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers["x-request-id"] || uuidv4();
  const { method, url, ip, headers } = req;
  const userAgent = headers["user-agent"];

  req.log = Logger.child({
    request_id: requestId,
  });

  req.log.info(
    `requestId:${requestId} method:${method}, url:${url}, ip:${ip} userAgent:${userAgent}`,
  );
  next();
};
