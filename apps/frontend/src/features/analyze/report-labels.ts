import type { AnalyzeResponse } from "@synastry/contracts";

export const verdictLabel: Record<
  AnalyzeResponse["compatibility"]["verdict"],
  string
> = {
  recommended: "Рекомендован",
  conditional: "Подходит с условиями",
  not_recommended: "Не рекомендован",
};
