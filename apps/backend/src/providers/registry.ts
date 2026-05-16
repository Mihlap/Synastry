import { enabledProviders, env } from "../config/env.js";
import { AppError } from "../middleware/error-handler.js";
import type { AIProvider } from "./ai-provider.interface.js";
import { GigaChatProvider } from "./gigachat.provider.js";

const allProviders = new Map<string, AIProvider>([
  ["gigachat", new GigaChatProvider()],
]);

export function getProvider(providerId = env.AI_PROVIDER): AIProvider {
  const provider = allProviders.get(providerId);

  if (!provider || !enabledProviders.includes(provider.id)) {
    throw new AppError("Выбранная ИИ-модель недоступна", 400);
  }

  return provider;
}

export function getAvailableProviders(): AIProvider[] {
  return enabledProviders
    .map((providerId) => allProviders.get(providerId))
    .filter((provider): provider is AIProvider => Boolean(provider));
}
