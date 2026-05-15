import {
  harmonizeCompatibility,
  verdictFromScore,
} from "../chart/compatibility-anchor.js";
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
    const anchor = context?.compatibilityAnchor ?? 58;
    const verdict = verdictFromScore(anchor);
    const verdictSummary: Record<typeof verdict, string> = {
      recommended: `Профиль согласуется с ролью «${title}»; на интервью стоит подтвердить ключевые кейсы.`,
      conditional: `Кандидат перспективен для «${title}», но вывод по карте и вакансии требует проверки на интервью.`,
      not_recommended: `По карте и описанию роли «${title}» есть заметные расхождения — имеет смысл сравнить с другими кандидатами.`,
    };

    const compatibility = harmonizeCompatibility(
      {
        verdict,
        score: anchor,
        summary: verdictSummary[verdict],
        pros: [
        "Профиль указывает на устойчивость к нагрузке и способность доводить задачи до результата без постоянного контроля.",
        "Сильная коммуникативная составляющая: кандидат, вероятно, комфортно работает в связке с продуктом и смежными командами.",
        "Акценты карты совпадают с запросом вакансии по темпу работы и ориентации на практический результат.",
        "Есть потенциал для роста внутри роли при понятных целях и обратной связи от руководителя.",
        ],
        cons: [
        "Без точного времени рождения выводы по домам и асценденту менее надёжны — часть гипотез нужно проверить на интервью.",
        "Возможен разрыв ожиданий по автономии: уточните, насколько кандидату комфортен ваш уровень структуры и процессов.",
        "Натальная карта не заменяет проверку hard skills, кейсов и рекомендаций с прошлых мест работы.",
        ],
        argumentsFor: [
        "Сочетание карты и описания роли даёт согласованную картину по стилю работы и мотивации.",
        "Профиль не выглядит конфликтным для заявленной культуры компании и формата взаимодействия в команде.",
        "Есть сигналы, что кандидат может быстро встроиться в текущий ритм команды при ясных приоритетах.",
        ],
        argumentsAgainst: [
        "Итог по домам и ASC требует подтверждения — заложите в интервью вопросы про рабочий ритм и границы ответственности.",
        "Стоит отдельно проверить опыт в ключевых технологиях/домене вакансии — карта этого не покрывает.",
        "При жёстких дедлайнах уточните, как кандидат ведёт себя под давлением и при смене приоритетов.",
        ],
      },
      anchor,
    );

    return JSON.stringify(compatibility);
  }
}

function safeParseContext(content: string): {
  vacancy?: { title?: string };
  compatibilityAnchor?: number;
} | null {
  try {
    return JSON.parse(content) as {
      vacancy?: { title?: string };
      compatibilityAnchor?: number;
    };
  } catch {
    return null;
  }
}
