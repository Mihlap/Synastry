import { Router } from "express";
import { getAvailableProviders } from "../providers/registry.js";

export const providersRouter = Router();

providersRouter.get("/", async (_req, res, next) => {
  try {
    const providers = await Promise.all(
      getAvailableProviders().map(async (provider) => ({
        id: provider.id,
        name: provider.displayName,
        models: await provider.listModels(),
      })),
    );

    res.json({ providers });
  } catch (error) {
    next(error);
  }
});
