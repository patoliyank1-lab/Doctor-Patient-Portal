import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Logger, winLogger } from "./utils/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import Router from "./api"
import cookieParser from "cookie-parser";
import { validateEnv } from "./config/validateEnv.js";

// Fail-fast: crash immediately if required env vars are missing
validateEnv();

const app = express();
const port = process.env.PORT ?? 4000;

// ── Security headers
app.use(helmet());

// ── Global rate limit: 100 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900_000),  // 15 min
  max:       Number(process.env.RATE_LIMIT_MAX ?? 100),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// ── Strict rate limit for auth routes: 10 requests per 15 min
const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900_000),
  max: 10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many auth attempts, please try again later." },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", true);

app.use(winLogger);

// Auth routes get the strict limiter, everything else gets the global limiter
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1", globalLimiter, Router);

app.get("/", (_req, res) => {
  res.send("Welcome to MediConnect API!");
});

app.use(errorHandler);

app.listen(port, function (err) {
  if (err) Logger.error(err);
  Logger.info(`Server is running on : http://localhost:${port}/`);
});

export { app };
