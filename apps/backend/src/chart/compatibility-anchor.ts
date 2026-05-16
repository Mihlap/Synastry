import type { AnalyzeRequest, AnalyzeResponse } from "@synastry/contracts";

export type CompatibilityVerdict = AnalyzeResponse["compatibility"]["verdict"];

type RequirementKey =
  | "communication"
  | "leadership"
  | "structure"
  | "creativity"
  | "analysis"
  | "stress"
  | "autonomy";

type RequirementProfile = Record<RequirementKey, number>;

const REQUIREMENT_KEYWORDS: Record<RequirementKey, readonly string[]> = {
  communication: [
    "коммуника",
    "переговор",
    "презентац",
    "стейкхолдер",
    "клиент",
    "команд",
    "обсужд",
    "фасилитац",
  ],
  leadership: [
    "лидер",
    "руковод",
    "ментор",
    "управлен",
    "ownership",
    "ответствен",
    "инициатив",
  ],
  structure: [
    "процесс",
    "регламент",
    "документ",
    "планирован",
    "качество",
    "контроль",
    "системн",
  ],
  creativity: [
    "креатив",
    "дизайн",
    "гипотез",
    "исследован",
    "продукт",
    "нов",
    "концепц",
  ],
  analysis: [
    "аналит",
    "метрик",
    "данн",
    "исслед",
    "архитект",
    "стратег",
    "сложн",
  ],
  stress: [
    "стресс",
    "дедлайн",
    "быстр",
    "нагруз",
    "кризис",
    "неопредел",
    "изменен",
  ],
  autonomy: [
    "самостоят",
    "автоном",
    "инициатив",
    "ownership",
    "без контроля",
    "стартап",
    "удален",
  ],
};

export function computeCompatibilityAnchor(
  request: AnalyzeRequest,
  natalChart: AnalyzeResponse["natalChart"],
): number {
  const roleProfile = buildRequirementProfile(request);
  const chartProfile = buildChartProfile(natalChart);
  const fit = average(
    Object.entries(roleProfile).map(([key, requirement]) => {
      const candidate = chartProfile[key as RequirementKey];
      const distance = Math.abs(requirement - candidate);
      return Math.max(0, 10 - distance) * 10;
    }),
  );
  const harmony = countAspects(natalChart, ["трин", "секстиль", "соединение"]);
  const tension = countAspects(natalChart, ["квадрат", "оппозиция"]);
  const aspectAdjustment = clamp((harmony - tension) * 2.5, -14, 14);
  const requirementIntensity = average(Object.values(roleProfile));
  const score = fit * 0.74 + requirementIntensity * 2.1 + aspectAdjustment;

  return clamp(Math.round(score), 22, 92);
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
  const score = clamp(Math.round(anchor), 0, 100);
  return { ...compatibility, verdict: verdictFromScore(score), score };
}

function buildRequirementProfile(request: AnalyzeRequest): RequirementProfile {
  const text = [
    request.vacancy.title,
    request.vacancy.companyDescription,
    request.vacancy.jobDescription,
  ].join(" ").toLowerCase();

  return mapValues(REQUIREMENT_KEYWORDS, (keywords) => {
    const hits = keywords.reduce(
      (total, keyword) => total + (text.includes(keyword) ? 1 : 0),
      0,
    );
    return clamp(4 + hits * 1.45, 2, 10);
  });
}

function buildChartProfile(natalChart: AnalyzeResponse["natalChart"]): RequirementProfile {
  const elementCounts = countElements(natalChart.positions);
  const harmonicAspects = countAspects(natalChart, ["трин", "секстиль"]);
  const tenseAspects = countAspects(natalChart, ["квадрат", "оппозиция"]);
  const sun = signOf(natalChart, "Солнце");
  const moon = signOf(natalChart, "Луна");
  const mercury = signOf(natalChart, "Меркурий");
  const mars = signOf(natalChart, "Марс");

  return {
    communication: clamp(elementCounts.air * 1.8 + signBonus(mercury, ["Близнецы", "Весы", "Водолей"]) + 3, 1, 10),
    leadership: clamp(elementCounts.fire * 1.7 + signBonus(sun, ["Овен", "Лев", "Козерог"]) + signBonus(mars, ["Овен", "Лев", "Скорпион"]) + 2, 1, 10),
    structure: clamp(elementCounts.earth * 1.8 + signBonus(sun, ["Телец", "Дева", "Козерог"]) + signBonus(moon, ["Телец", "Дева", "Козерог"]) + 2, 1, 10),
    creativity: clamp((elementCounts.fire + elementCounts.water) * 1.25 + signBonus(sun, ["Лев", "Рыбы", "Водолей"]) + 2, 1, 10),
    analysis: clamp((elementCounts.air + elementCounts.earth) * 1.25 + signBonus(mercury, ["Близнецы", "Дева", "Козерог", "Водолей"]) + 2, 1, 10),
    stress: clamp(5 + harmonicAspects * 0.9 - tenseAspects * 0.8 + elementCounts.earth * 0.7, 1, 10),
    autonomy: clamp(elementCounts.fire * 1.2 + elementCounts.air + signBonus(mars, ["Овен", "Стрелец", "Водолей"]) + 2, 1, 10),
  };
}

function countElements(positions: AnalyzeResponse["natalChart"]["positions"]) {
  const counts = { fire: 0, earth: 0, air: 0, water: 0 };

  for (const position of positions) {
    if (position.body === "Асцендент") {
      continue;
    }

    if (["Овен", "Лев", "Стрелец"].includes(position.sign)) {
      counts.fire += 1;
    } else if (["Телец", "Дева", "Козерог"].includes(position.sign)) {
      counts.earth += 1;
    } else if (["Близнецы", "Весы", "Водолей"].includes(position.sign)) {
      counts.air += 1;
    } else {
      counts.water += 1;
    }
  }

  return counts;
}

function countAspects(
  natalChart: AnalyzeResponse["natalChart"],
  aspectTypes: readonly string[],
): number {
  return natalChart.aspects.filter((aspect) => aspectTypes.includes(aspect.type)).length;
}

function signOf(natalChart: AnalyzeResponse["natalChart"], body: string): string | undefined {
  return natalChart.positions.find((position) => position.body === body)?.sign;
}

function signBonus(sign: string | undefined, signs: readonly string[]): number {
  return sign && signs.includes(sign) ? 1.6 : 0;
}

function average(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function mapValues<TValue>(
  value: Record<RequirementKey, readonly string[]>,
  mapper: (keywords: readonly string[]) => TValue,
): Record<RequirementKey, TValue> {
  return Object.fromEntries(
    Object.entries(value).map(([key, keywords]) => [key, mapper(keywords)]),
  ) as Record<RequirementKey, TValue>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
