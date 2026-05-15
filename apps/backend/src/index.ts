import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  console.info(`Synastry API is listening on port ${env.PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
