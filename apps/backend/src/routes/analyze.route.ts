import { AnalyzeRequestSchema, AnalyzeResponseSchema } from "@synastry/contracts";
import type { FastifyPluginAsync } from "fastify";
import {
  computeCompatibilityAnchor,
  harmonizeCompatibility,
} from "../chart/compatibility-anchor.js";
import { buildNatalChart, getBirthTimeAccuracy } from "../chart/natal-chart.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error-handler.js";
import { analyzeRateLimitOptions } from "../middleware/security.js";
import { buildCompatibilityMessages } from "../prompt/compatibility-prompt.js";
import { parseCompatibilityJson } from "../prompt/parse-llm-json.js";
import { getFallbackProvider, getProvider } from "../providers/registry.js";
import type { AIProvider, ChatMessage, CompleteOptions } from "../providers/ai-provider.interface.js";

const DISCLAIMER =
  "Результат носит аналитический и ознакомительный характер. Итоговое решение о найме принимается по квалификации, интервью и требованиям законодательства.";
const MAX_COMPATIBILITY_ATTEMPTS = 3;

export const analyzeRouter: FastifyPluginAsync = async (app) => {
  app.post(
    "/",
    {
      config: {
        rateLimit: analyzeRateLimitOptions,
      },
    },
    async (request) => {
      const payload = AnalyzeRequestSchema.parse(request.body);
      const natalChart = buildNatalChart(payload);
      const birthTimeAccuracy = getBirthTimeAccuracy(payload);
      const requestedProviderId = payload.options?.providerId ?? env.AI_PROVIDER;
      const provider =
        requestedProviderId === "gigachat" && !env.GIGACHAT_CREDENTIALS
          ? getFallbackProvider()
          : getProvider(requestedProviderId);

      const compatibilityAnchor = computeCompatibilityAnchor(payload, natalChart);
      const messages = buildCompatibilityMessages(
        payload,
        natalChart,
        birthTimeAccuracy,
        compatibilityAnchor,
      );

      const rawCompatibility = await completeCompatibility(provider, messages, {
        model: payload.options?.model,
        temperature: 0.35,
      });
      const compatibility = harmonizeCompatibility(
        rawCompatibility,
        compatibilityAnchor,
      );

      const response = AnalyzeResponseSchema.parse({
        natalChart,
        compatibility,
        meta: {
          provider: provider.id,
          model: payload.options?.model ?? env.AI_DEFAULT_MODEL,
          analyzedAt: new Date().toISOString(),
          disclaimer: DISCLAIMER,
          birthTimeAccuracy,
        },
      });

      return response;
    },
  );
};

async function completeCompatibility(
  provider: AIProvider,
  messages: ChatMessage[],
  options: CompleteOptions,
) {
  let retryMessages = messages;

  for (let attempt = 1; attempt <= MAX_COMPATIBILITY_ATTEMPTS; attempt += 1) {
    const rawCompatibility = await provider.complete(retryMessages, options);

    try {
      return parseCompatibilityJson(rawCompatibility);
    } catch {
      if (attempt === MAX_COMPATIBILITY_ATTEMPTS) {
        throw new AppError("ИИ вернул некорректный формат ответа", 502);
      }

      retryMessages = [
        ...messages,
        {
          role: "assistant",
          content: rawCompatibility,
        },
        {
          role: "user",
          content:
            "Предыдущий ответ не прошёл JSON-схему. Верни только валидный JSON без markdown и пояснений.",
        },
      ];
    }
  }

  throw new AppError("ИИ вернул некорректный формат ответа", 502);
}
