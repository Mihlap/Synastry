import type { AnalyzeResponse, BirthTimeAccuracy } from "@synastry/contracts";

type NatalChart = AnalyzeResponse["natalChart"];

const ELEMENT_BY_SIGN: Record<string, string> = {
  Овен: "Огонь",
  Лев: "Огонь",
  Стрелец: "Огонь",
  Телец: "Земля",
  Дева: "Земля",
  Козерог: "Земля",
  Близнецы: "Воздух",
  Весы: "Воздух",
  Водолей: "Воздух",
  Рак: "Вода",
  Скорпион: "Вода",
  Рыбы: "Вода",
};

const MODALITY_BY_SIGN: Record<string, string> = {
  Овен: "кардинальный",
  Рак: "кардинальный",
  Весы: "кардинальный",
  Козерог: "кардинальный",
  Телец: "фиксированный",
  Лев: "фиксированный",
  Скорпион: "фиксированный",
  Водолей: "фиксированный",
  Близнецы: "мутабельный",
  Дева: "мутабельный",
  Стрелец: "мутабельный",
  Рыбы: "мутабельный",
};

export function formatPlanetPosition(
  position: NatalChart["positions"][number],
): string {
  const house =
    position.house !== undefined ? `, ${position.house} дом` : "";
  return `${position.body}: ${position.sign} ${position.degree}°${house}`;
}

export function formatAspect(aspect: NatalChart["aspects"][number]): string {
  return `${aspect.a} — ${aspect.type} — ${aspect.b} (орб ${aspect.orb}°)`;
}

function countByElement(positions: NatalChart["positions"]) {
  const counts = { Огонь: 0, Земля: 0, Воздух: 0, Вода: 0 };

  for (const position of positions) {
    const element = ELEMENT_BY_SIGN[position.sign];
    if (element && element in counts) {
      counts[element as keyof typeof counts] += 1;
    }
  }

  return counts;
}

function dominantLabel(counts: Record<string, number>): string {
  const sorted = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  const [top, second] = sorted;

  if (!top || top[1] === 0) {
    return "баланс стихий не выделен";
  }

  if (second && top[1] === second[1]) {
    return `${top[0]} и ${second[0]} (по ${top[1]} планет)`;
  }

  return `${top[0]} (${top[1]} из 10 планет)`;
}

export function buildNatalChartHighlights(
  natalChart: NatalChart,
  birthTimeAccuracy: BirthTimeAccuracy,
) {
  const sun = natalChart.positions.find((position) => position.body === "Солнце");
  const moon = natalChart.positions.find((position) => position.body === "Луна");
  const ascendant = natalChart.positions.find(
    (position) => position.body === "Асцендент",
  );
  const elements = countByElement(natalChart.positions);

  const lines: string[] = [];

  if (sun && moon) {
    lines.push(
      `Солнце в ${sun.sign} (${sun.degree}°, ${MODALITY_BY_SIGN[sun.sign] ?? "—"} знак), Луна в ${moon.sign} (${moon.degree}°) — базовый стиль мотивации и реакции на нагрузку.`,
    );
  }

  lines.push(`Преобладающая стихия: ${dominantLabel(elements)}.`);

  if (birthTimeAccuracy === "unknown") {
    lines.push(
      "Время рождения не указано — дома и асцендент в отчёте не рассчитываются; выводы опираются на положения планет в знаках.",
    );
  } else if (ascendant) {
    lines.push(
      `Асцендент (восходящий знак): ${ascendant.sign} ${ascendant.degree}° — как кандидат может проявляться в новой команде.`,
    );
  } else {
    lines.push(
      "Дома рассчитаны по указанному времени рождения — смотрите колонку «дом» у планет.",
    );
  }

  if (natalChart.aspects.length > 0) {
    lines.push(
      `Напряжённые и поддерживающие связи в карте: ${natalChart.aspects.length} значимых аспектов (см. список ниже).`,
    );
  }

  return lines;
}
