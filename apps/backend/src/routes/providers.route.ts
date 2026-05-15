import type { FastifyPluginAsync } from "fastify";
import { getAvailableProviders } from "../providers/registry.js";

export const providersRouter: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    const providers = await Promise.all(
      getAvailableProviders().map(async (provider) => ({
        id: provider.id,
        name: provider.displayName,
        models: await provider.listModels(),
      })),
    );

    return { providers };
  });
};
