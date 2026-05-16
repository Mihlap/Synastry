import { AnalyzeRequestSchema, AnalyzeResponseSchema } from "@synastry/contracts";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
  computeCompatibilityAnchor,
  harmonizeCompatibility,
  verdictFromScore,
} from "../chart/compatibility-anchor.js";
import { buildNatalChart, getBirthTimeAccuracy } from "../chart/natal-chart.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error-handler.js";
import { analyzeRateLimitOptions } from "../middleware/security.js";
import { buildCompatibilityMessages } from "../prompt/compatibility-prompt.js";
import { parseCompatibilityJson } from "../prompt/parse-llm-json.js";
import { getProvider } from "../providers/registry.js";
import type { AIProvider, ChatMessage, CompleteOptions } from "../providers/ai-provider.interface.js";

const DISCLAIMER =
  "Результат носит аналитический и ознакомительный характер. Итоговое решение о найме принимается по квалификации, интервью и требованиям законодательства.";
const MAX_COMPATIBILITY_ATTEMPTS = 2;
const MAX_ANALYZE_DEADLINE_MS = 180_000;

async function raceWithAnalyzeDeadline<T>(pipeline: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const deadline = new Promise<never>((_, reject) => {
    const timeoutMs = Math.min(env.ANALYZE_PIPELINE_TIMEOUT_MS, MAX_ANALYZE_DEADLINE_MS);
    const minutes = Math.max(1, Math.round(timeoutMs / 60_000));
    timer = setTimeout(() => {
      reject(
        new AppError(
          `Превышено общее время расчёта (${minutes} мин). Повторите позже или увеличьте ANALYZE_PIPELINE_TIMEOUT_MS в apps/backend/.env.`,
          504,
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([pipeline, deadline]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

export const analyzeRouter: FastifyPluginAsync = async (app) => {
  app.post(
    "/",
    {
      config: {
        rateLimit: analyzeRateLimitOptions,
      },
    },
    async (request) => {
      return raceWithAnalyzeDeadline(handleAnalyzePost(request));
    },
  );
};

async function handleAnalyzePost(request: FastifyRequest) {
  const payload = AnalyzeRequestSchema.parse(request.body);
  const natalChart = buildNatalChart(payload);
  const birthTimeAccuracy = getBirthTimeAccuracy(payload);
  const requestedProviderId = payload.options?.providerId ?? env.AI_PROVIDER;
  const provider = getProvider(requestedProviderId);

  const compatibilityAnchor = computeCompatibilityAnchor(payload, natalChart);
  const messages = buildCompatibilityMessages(
    payload,
    natalChart,
    birthTimeAccuracy,
    compatibilityAnchor,
  );

  console.info(`[analyze] provider=${provider.id} started`);
  const expectedVerdict = verdictFromScore(compatibilityAnchor);
  const rawCompatibility = await completeCompatibility(provider, messages, {
    model: payload.options?.model,
    temperature: 0.35,
    expectedVerdict,
  });
  const compatibility = harmonizeCompatibility(rawCompatibility, compatibilityAnchor);

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
}

type CompleteCompatibilityOptions = CompleteOptions & {
  expectedVerdict?: ReturnType<typeof verdictFromScore>;
};

async function completeCompatibility(
  provider: AIProvider,
  messages: ChatMessage[],
  options: CompleteCompatibilityOptions,
) {
  let retryMessages = messages;

  for (let attempt = 1; attempt <= MAX_COMPATIBILITY_ATTEMPTS; attempt += 1) {
    console.info(`[analyze] provider=${provider.id} attempt=${attempt}/${MAX_COMPATIBILITY_ATTEMPTS}`);
    const rawCompatibility = await provider.complete(retryMessages, options);

    try {
      const compatibility = parseCompatibilityJson(rawCompatibility, options.expectedVerdict);
      console.info(`[analyze] provider=${provider.id} attempt=${attempt} parsed`);
      return compatibility;
    } catch (error) {
      if (attempt === MAX_COMPATIBILITY_ATTEMPTS) {
        console.warn(`[analyze] provider=${provider.id} parse failed: ${formatErrorForLog(error)}`);
        throw new AppError("ИИ вернул некорректный формат ответа", 502);
      }

      console.warn(`[analyze] provider=${provider.id} attempt=${attempt} parse failed, retrying`);

      retryMessages = [
        ...messages,
        {
          role: "assistant",
          content: rawCompatibility,
        },
        {
          role: "user",
          content:
            'Предыдущий ответ не прошёл JSON-схему. Верни только валидный JSON без markdown. ' +
            'Поле verdict строго одно из: "recommended", "conditional", "not_recommended" (латиницей, как в calculatedCompatibility). ' +
            "Минимум 5 пунктов в pros и cons.",
        },
      ];
    }
  }

  throw new AppError("ИИ вернул некорректный формат ответа", 502);
}

function formatErrorForLog(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
