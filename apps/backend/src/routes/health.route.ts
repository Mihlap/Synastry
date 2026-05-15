import type { FastifyPluginAsync } from "fastify";

export const healthRouter: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({
    status: "ok",
    service: "synastry-api",
    version: "0.1.0",
  }));
};
