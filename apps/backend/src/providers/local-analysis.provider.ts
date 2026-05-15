import type { AIProvider, ChatMessage } from "./ai-provider.interface.js";

export class LocalAnalysisProvider implements AIProvider {
  public readonly id = "local";
  public readonly displayName = "Локальный демо-анализ";

  public async listModels(): Promise<string[]> {
    return ["local-structured"];
  }

  public async complete(messages: ChatMessage[]): Promise<string> {
    const userMessage = messages.find((message) => message.role === "user");
    const context = safeParseContext(userMessage?.content ?? "{}");
    const title = context?.vacancy?.title ?? "роль";

    return JSON.stringify({
      verdict: "conditional",
      score: 74,
      summary:
        `Кандидат выглядит перспективно для роли «${title}», но итоговый вывод требует проверки опыта на интервью.`,
      pros: [
        "Есть признаки устойчивости к сложным задачам и способности держать фокус.",
        "Профиль подходит для ролей, где важны коммуникация, инициативность и системность.",
        "Контекст вакансии не конфликтует с ключевыми акцентами карты.",
      ],
      cons: [
        "Без точного времени рождения часть выводов по домам и ASC менее надёжна.",
        "ИИ-анализ не заменяет проверку hard skills, рекомендаций и портфолио.",
      ],
      arguments: [
        "Сравнение натальной карты и описания роли показывает хорошее совпадение по стилю работы.",
        "Для окончательного решения стоит провести структурированное интервью и тестовое задание.",
      ],
    });
  }
}

function safeParseContext(content: string): {
  vacancy?: { title?: string };
} | null {
  try {
    return JSON.parse(content) as { vacancy?: { title?: string } };
  } catch {
    return null;
  }
}
