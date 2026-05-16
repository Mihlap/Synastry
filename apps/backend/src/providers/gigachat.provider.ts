import type { AIProvider, ChatMessage, CompleteOptions } from "./ai-provider.interface.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error-handler.js";
import { Agent } from "node:https";

type GigaChatMessage = {
  role: ChatMessage["role"];
  content: string;
};

type GigaChatClient = {
  chat(payload: {
    model: string;
    messages: GigaChatMessage[];
    temperature?: number;
  }): Promise<{ choices?: Array<{ message?: { content?: string } }> }>;
};

const MAX_GIGACHAT_TIMEOUT_MS = 90_000;

function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new AppError(
          `GigaChat не ответил за ${Math.round(timeoutMs / 1000)} секунд. Проверьте доступ к API и повторите запрос.`,
          504,
        ),
      );
    }, timeoutMs);
  });

  return Promise.race([operation, timeout]).finally(() => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  });
}

export class GigaChatProvider implements AIProvider {
  public readonly id = "gigachat";
  public readonly displayName = "GigaChat";

  public async listModels(): Promise<string[]> {
    return [env.GIGACHAT_MODEL, "GigaChat-Pro"].filter(
      (model, index, models) => models.indexOf(model) === index,
    );
  }

  public async complete(
    messages: ChatMessage[],
    options: CompleteOptions = {},
  ): Promise<string> {
    let client;
    try {
      client = await this.createClient();
    } catch (error: unknown) {
      throw GigaChatProvider.normalizeInitError(error);
    }

    let response;
    try {
      response = await withTimeout(
        client.chat({
          model: options.model ?? env.GIGACHAT_MODEL,
          messages,
          temperature: options.temperature ?? 0.2,
        }),
        Math.min(env.GIGACHAT_TIMEOUT_SECONDS * 1000, MAX_GIGACHAT_TIMEOUT_MS),
      );
    } catch (error: unknown) {
      throw GigaChatProvider.normalizeRequestError(error);
    }

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new AppError("GigaChat вернул пустой ответ.", 502);
    }

    return content;
  }

  private static normalizeInitError(error: unknown): AppError | Error {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(`Не удалось инициализировать GigaChat: ${error.message}`, 503);
    }

    return new AppError("Не удалось инициализировать GigaChat.", 503);
  }

  private static normalizeRequestError(error: unknown): AppError | Error {
    if (error instanceof AppError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const lowered = message.toLowerCase();

    if (lowered.includes("timeout")) {
      return new AppError(
        "Превышено время ожидания ответа от GigaChat (медленная генерация или сеть). " +
          "Увеличьте GIGACHAT_TIMEOUT_SECONDS в apps/backend/.env и перезапустите backend.",
        504,
      );
    }

    if (/(econnreset|etimedout|enotfound|eai_again|socket)/i.test(message)) {
      return new AppError(
        "Сетевая ошибка при обращении к GigaChat. Проверьте интернет, VPN и повторите запрос.",
        503,
      );
    }

    return new AppError(`GigaChat: ${message}`, 502);
  }

  private async createClient(): Promise<GigaChatClient> {
    if (!env.GIGACHAT_CREDENTIALS) {
      throw new Error("GIGACHAT_CREDENTIALS is not configured");
    }

    const module = (await import("gigachat")) as {
      default?: new (options: Record<string, unknown>) => GigaChatClient;
      GigaChat?: new (options: Record<string, unknown>) => GigaChatClient;
    };

    const GigaChat = module.default ?? module.GigaChat;
    if (!GigaChat) {
      throw new Error("GigaChat SDK export is not available");
    }

    return new GigaChat({
      credentials: env.GIGACHAT_CREDENTIALS,
      scope: env.GIGACHAT_SCOPE,
      model: env.GIGACHAT_MODEL,
      timeout: env.GIGACHAT_TIMEOUT_SECONDS,
      httpsAgent: env.GIGACHAT_ALLOW_SELF_SIGNED
        ? new Agent({ rejectUnauthorized: false })
        : undefined,
    });
  }
}
