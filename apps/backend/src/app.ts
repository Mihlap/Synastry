import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { corsMiddleware, helmetMiddleware } from "./middleware/security.js";
import { analyzeRouter } from "./routes/analyze.route.js";
import { healthRouter } from "./routes/health.route.js";
import { providersRouter } from "./routes/providers.route.js";

export function createApp() {
  const app = express();

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/providers", providersRouter);
  app.use("/api/analyze", analyzeRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
