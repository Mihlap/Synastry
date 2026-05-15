import type { AIProvider, ChatMessage, CompleteOptions } from "./ai-provider.interface.js";
import { env } from "../config/env.js";
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
    const client = await this.createClient();

    const response = await client.chat({
      model: options.model ?? env.GIGACHAT_MODEL,
      messages,
      temperature: options.temperature ?? 0.2,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("GigaChat вернул пустой ответ");
    }

    return content;
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
      timeout: 120,
      httpsAgent: env.GIGACHAT_ALLOW_SELF_SIGNED
        ? new Agent({ rejectUnauthorized: false })
        : undefined,
    });
  }
}
