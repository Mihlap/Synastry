import { AnalyzeRequestSchema, AnalyzeResponseSchema } from "@synastry/shared";
import { Router } from "express";
import { buildNatalChart, getBirthTimeAccuracy } from "../chart/natal-chart.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error-handler.js";
import { analyzeRateLimit } from "../middleware/security.js";
import { buildCompatibilityMessages } from "../prompt/compatibility-prompt.js";
import { parseCompatibilityJson } from "../prompt/parse-llm-json.js";
import { getFallbackProvider, getProvider } from "../providers/registry.js";
import type { AIProvider, ChatMessage, CompleteOptions } from "../providers/ai-provider.interface.js";

const DISCLAIMER =
  "Результат носит аналитический и ознакомительный характер. Итоговое решение о найме принимается по квалификации, интервью и требованиям законодательства.";
const MAX_COMPATIBILITY_ATTEMPTS = 3;

export const analyzeRouter = Router();

analyzeRouter.post("/", analyzeRateLimit, async (req, res, next) => {
  try {
    const payload = AnalyzeRequestSchema.parse(req.body);
    const natalChart = buildNatalChart(payload);
    const birthTimeAccuracy = getBirthTimeAccuracy(payload);
    const requestedProviderId = payload.options?.providerId ?? env.AI_PROVIDER;
    const provider =
      requestedProviderId === "gigachat" && !env.GIGACHAT_CREDENTIALS
        ? getFallbackProvider()
        : getProvider(requestedProviderId);

    const messages = buildCompatibilityMessages(
      payload,
      natalChart,
      birthTimeAccuracy,
    );

    const compatibility = await completeCompatibility(provider, messages, {
      model: payload.options?.model,
      temperature: 0.2,
    });

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

    res.json(response);
  } catch (error) {
    next(error);
  }
});

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
