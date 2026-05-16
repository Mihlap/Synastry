import { CompatibilitySchema, type AnalyzeResponse } from "@synastry/contracts";

type CompatibilityVerdict = AnalyzeResponse["compatibility"]["verdict"];

const VERDICT_ALIASES: Record<string, CompatibilityVerdict> = {
  recommended: "recommended",
  recommend: "recommended",
  hire: "recommended",
  yes: "recommended",
  conditional: "conditional",
  conditionally: "conditional",
  maybe: "conditional",
  neutral: "conditional",
  not_recommended: "not_recommended",
  notrecommended: "not_recommended",
  reject: "not_recommended",
  rejected: "not_recommended",
  no: "not_recommended",
  рекомендуется: "recommended",
  рекомендован: "recommended",
  рекомендовано: "recommended",
  рекомендую: "recommended",
  условно: "conditional",
  условная: "conditional",
  условный: "conditional",
  сомнительно: "conditional",
  "не рекомендуется": "not_recommended",
  нерекомендуется: "not_recommended",
  "не рекомендован": "not_recommended",
};

function compatFieldsFromParsed(data: Record<string, unknown>): Record<string, unknown> {
  const nested = data.calculatedCompatibility;

  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const c = nested as Record<string, unknown>;
    return {
      ...data,
      verdict: data.verdict ?? c.verdict,
      score: data.score ?? c.score,
    };
  }

  return data;
}

export function normalizeVerdict(
  value: unknown,
  fallback?: CompatibilityVerdict,
): CompatibilityVerdict | undefined {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  const direct = VERDICT_ALIASES[normalized];
  if (direct) {
    return direct;
  }

  if (
    normalized === "recommended" ||
    normalized === "conditional" ||
    normalized === "not_recommended"
  ) {
    return normalized;
  }

  return fallback;
}

function normalizeCompatibilityFields(
  data: Record<string, unknown>,
  fallbackVerdict?: CompatibilityVerdict,
): Record<string, unknown> {
  const nested = data.calculatedCompatibility;
  const nestedVerdict =
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? (nested as Record<string, unknown>).verdict
      : undefined;

  const verdict =
    normalizeVerdict(data.verdict, undefined) ??
    normalizeVerdict(nestedVerdict, undefined) ??
    fallbackVerdict;

  return {
    ...data,
    verdict,
  };
}

export function parseCompatibilityJson(
  content: string,
  fallbackVerdict?: CompatibilityVerdict,
) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const json = fenced?.[1] ?? trimmed;

  const parsed = JSON.parse(json) as Record<string, unknown>;
  const merged = normalizeCompatibilityFields(compatFieldsFromParsed(parsed), fallbackVerdict);

  return CompatibilitySchema.parse(merged);
}
