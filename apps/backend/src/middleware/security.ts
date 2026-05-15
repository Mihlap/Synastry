import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit, { type RateLimitOptions } from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const analyzeRateLimitOptions: RateLimitOptions = {
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_WINDOW_MS,
};

export function registerSecurityPlugins(app: FastifyInstance) {
  app.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  app.register(cors, {
    credentials: false,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"), false);
    },
  });

  app.register(rateLimit, {
    global: false,
    errorResponseBuilder: () => ({
      message: "Слишком много запросов. Подождите минуту и попробуйте снова.",
    }),
  });
}
