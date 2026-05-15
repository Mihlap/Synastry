import fastify from "fastify";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { registerSecurityPlugins } from "./middleware/security.js";
import { analyzeRouter } from "./routes/analyze.route.js";
import { healthRouter } from "./routes/health.route.js";
import { providersRouter } from "./routes/providers.route.js";

export function createApp() {
  const app = fastify({
    bodyLimit: 1_048_576,
    logger: false,
  });

  registerSecurityPlugins(app);

  app.register(healthRouter, { prefix: "/api/health" });
  app.register(providersRouter, { prefix: "/api/providers" });
  app.register(analyzeRouter, { prefix: "/api/analyze" });

  app.setNotFoundHandler(notFoundHandler);
  app.setErrorHandler(errorHandler);

  return app;
}
