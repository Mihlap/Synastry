import type { AnalyzeRequest, AnalyzeResponse } from "@synastry/contracts";

export type CompatibilityVerdict = AnalyzeResponse["compatibility"]["verdict"];

const VERDICT_SCORE_BANDS: Record<
  CompatibilityVerdict,
  readonly [min: number, max: number]
> = {
  recommended: [72, 94],
  conditional: [48, 71],
  not_recommended: [15, 47],
};

export function computeCompatibilityAnchor(
  request: AnalyzeRequest,
  natalChart: AnalyzeResponse["natalChart"],
): number {
  const seed = hashCandidate(request);
  const tension = natalChart.aspects.filter(
    (aspect) => aspect.type === "квадрат" || aspect.type === "оппозиция",
  ).length;
  const harmony = natalChart.aspects.filter(
    (aspect) => aspect.type === "трин" || aspect.type === "секстиль",
  ).length;

  const raw = 48 + (seed % 41) + harmony * 3 - tension * 4;
  return Math.min(94, Math.max(35, Math.round(raw)));
}

export function verdictFromScore(score: number): CompatibilityVerdict {
  if (score >= 72) {
    return "recommended";
  }

  if (score >= 48) {
    return "conditional";
  }

  return "not_recommended";
}

export function harmonizeCompatibility(
  compatibility: AnalyzeResponse["compatibility"],
  anchor: number,
): AnalyzeResponse["compatibility"] {
  let score = compatibility.score ?? anchor;

  if (score >= 82 && score <= 88 && Math.abs(score - anchor) > 12) {
    score = Math.round(anchor * 0.55 + score * 0.45);
  }

  const verdict = compatibility.verdict;
  const [min, max] = VERDICT_SCORE_BANDS[verdict];

  if (score < min || score > max) {
    score = Math.min(max, Math.max(min, anchor));
  }

  return { ...compatibility, score };
}

function hashCandidate(request: AnalyzeRequest): number {
  const source = [
    request.candidate.fullName,
    request.candidate.birthDate,
    request.candidate.birthTime ?? "12:00",
    request.candidate.birthPlace.city,
    request.candidate.birthPlace.latitude,
    request.candidate.birthPlace.longitude,
    request.vacancy.title,
  ].join("|");

  return Array.from(source).reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) % 360_000,
    17,
  );
}
