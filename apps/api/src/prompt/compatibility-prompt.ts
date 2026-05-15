import type { AnalyzeRequest, AnalyzeResponse } from "@synastry/shared";

export function buildCompatibilityMessages(
  request: AnalyzeRequest,
  natalChart: AnalyzeResponse["natalChart"],
  birthTimeAccuracy: string,
) {
  return [
    {
      role: "system" as const,
      content: [
        "Ты HR-аналитик, который использует натальную карту как дополнительный контекст.",
        "Пиши деловым человеческим языком, без мистических обещаний и дискриминационных выводов.",
        "Не выдумывай позиции планет: используй только переданный JSON.",
        "Ответь строго валидным JSON без markdown.",
        "Схема ответа: {\"verdict\":\"recommended|conditional|not_recommended\",\"score\":0-100,\"summary\":\"...\",\"pros\":[\"...\"],\"cons\":[\"...\"],\"arguments\":[\"...\"]}.",
      ].join(" "),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        natalChart,
        vacancy: request.vacancy,
        resumeText: request.candidate.resumeText,
        birthTimeAccuracy,
      }),
    },
  ];
}
