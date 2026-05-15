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
        "Не выдумывай позиции планет: используй только переданный JSON.",
        "Ответь строго валидным JSON без markdown.",
        "Схема ответа: {\"verdict\":\"recommended|conditional|not_recommended\",\"score\":0-100,\"summary\":\"...\",\"pros\":[\"3-5 развёрнутых пункта\"],\"cons\":[\"3-5 развёрнутых рисков\"],\"argumentsFor\":[\"2-4 аргумента ЗА кандидата\"],\"argumentsAgainst\":[\"2-4 аргумента ПРОТИВ или что проверить\"]}.",
        "Оценка score должна соответствовать verdict: recommended 72–94, conditional 48–71, not_recommended 15–47.",
        "Не подставляй шаблонные 85 или 80: опирайся на карту, вакансию и резюме; у разных кандидатов оценка должна заметно отличаться.",
        "В JSON передаётся compatibilityAnchor — ориентир по карте; итоговый score можно сдвинуть на ±12 от него, если вакансия и резюме это обосновывают.",
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
        compatibilityAnchor,
      }),
    },
  ];
}
