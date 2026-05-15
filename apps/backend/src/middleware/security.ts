import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "../config/env.js";

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

export const corsMiddleware = cors({
  credentials: false,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
});

export const analyzeRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Слишком много запросов. Подождите минуту и попробуйте снова.",
  },
});
