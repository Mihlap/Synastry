import type { AnalyzeRequest, AnalyzeResponse } from "@synastry/contracts";

export function buildCompatibilityMessages(
  request: AnalyzeRequest,
  natalChart: AnalyzeResponse["natalChart"],
  birthTimeAccuracy: string,
  compatibilityAnchor: number,
) {
  return [
    {
      role: "system" as const,
      content: [
        "Ты HR-аналитик, который использует натальную карту как дополнительный контекст.",
        "Пиши деловым человеческим языком, без мистических обещаний и дискриминационных выводов.",
        "Не выдумывай позиции планет, дома и асцендент: используй только переданный natalChart.",
        "Если birthTimeAccuracy = unknown — не упоминай асцендент, дома и «карьерный дом»; опирайся только на знаки и аспекты планет из JSON.",
        "Резюме и опыт: если resumeText отсутствует, null или пустой — запрещено утверждать, что у кандидата нет опыта, навыков или знакомства с инструментами из вакансии.",
        "Без резюме риски по hard skills формулируй как «уточнить на интервью / проверить кейсом», а не как установленный факт.",
        "Итоговые verdict и score уже рассчитаны backend-алгоритмом; верни их без изменений.",
        "Ответь строго валидным JSON без markdown.",
        "Схема: {\"verdict\":\"...\",\"score\":0-100,\"summary\":\"...\",\"pros\":[минимум 5, максимум 7 пунктов],\"cons\":[минимум 5, максимум 7 рисков],\"argumentsFor\":[3-5 пунктов],\"argumentsAgainst\":[3-5 пунктов]}.",
        "В корне JSON обязательно верни те же verdict и score, что уже переданы в calculatedCompatibility — не вкладывай их только во внутренний объект.",
        "Каждый пункт pros/cons/argumentsFor/argumentsAgainst — законченное предложение, конкретно и по делу для HR.",
      ].join(" "),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        candidate: {
          fullName: request.candidate.fullName,
          birthDate: request.candidate.birthDate,
          birthTime: request.candidate.birthTime,
          birthPlace: request.candidate.birthPlace,
        },
        natalChart,
        vacancy: request.vacancy,
        resumeText: request.candidate.resumeText,
        birthTimeAccuracy,
        calculatedCompatibility: {
          verdict:
            compatibilityAnchor >= 72
              ? "recommended"
              : compatibilityAnchor >= 48
                ? "conditional"
                : "not_recommended",
          score: compatibilityAnchor,
        },
      }),
    },
  ];
}
