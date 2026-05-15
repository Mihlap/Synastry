import type {
  AnalyzeRequest,
  AnalyzeResponse,
  BirthTimeAccuracy,
} from "@synastry/contracts";

const SIGNS = [
  "Овен",
  "Телец",
  "Близнецы",
  "Рак",
  "Лев",
  "Дева",
  "Весы",
  "Скорпион",
  "Стрелец",
  "Козерог",
  "Водолей",
  "Рыбы",
] as const;

const BODIES = [
  "Солнце",
  "Луна",
  "Меркурий",
  "Венера",
  "Марс",
  "Юпитер",
  "Сатурн",
  "Уран",
  "Нептун",
  "Плутон",
] as const;

const ELEMENT_BY_SIGN: Record<(typeof SIGNS)[number], string> = {
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

const ASPECTS = [
  { type: "соединение", angle: 0, orb: 8 },
  { type: "секстиль", angle: 60, orb: 5 },
  { type: "квадрат", angle: 90, orb: 6 },
  { type: "трин", angle: 120, orb: 6 },
  { type: "оппозиция", angle: 180, orb: 8 },
] as const;

export function buildNatalChart(
  request: AnalyzeRequest,
): AnalyzeResponse["natalChart"] {
  const birthAccuracy = getBirthTimeAccuracy(request);
  const seed = hashCandidate(request);
  const positions: AnalyzeResponse["natalChart"]["positions"] = BODIES.map((body, index) => {
    const longitude = normalize(seed / (index + 3) + index * 37.9);
    return {
      body,
      sign: SIGNS[Math.floor(longitude / 30)] ?? "Овен",
      degree: round(longitude % 30),
      house:
        birthAccuracy === "unknown"
          ? undefined
          : ((Math.floor(normalize(longitude + seed / 13) / 30) % 12) + 1),
    };
  });

  if (birthAccuracy !== "unknown") {
    const ascLongitude = normalize(seed / 7 + 11.5);
    positions.push({
      body: "Асцендент",
      sign: SIGNS[Math.floor(ascLongitude / 30)] ?? "Овен",
      degree: round(ascLongitude % 30),
      house: 1,
    });
  }

  const aspects = positions.flatMap((left, leftIndex) =>
    positions.slice(leftIndex + 1).flatMap((right) => {
      const leftLongitude = signLongitude(left.sign, left.degree);
      const rightLongitude = signLongitude(right.sign, right.degree);
      const diff = shortestDistance(leftLongitude, rightLongitude);
      const aspect = ASPECTS.find((item) => Math.abs(diff - item.angle) <= item.orb);

      return aspect
        ? [
            {
              a: left.body,
              b: right.body,
              type: aspect.type,
              orb: round(Math.abs(diff - aspect.angle)),
            },
          ]
        : [];
    }),
  );

  return {
    summary: buildNatalSummary(positions, aspects, birthAccuracy),
    positions,
    aspects: aspects.slice(0, 10),
  };
}

function buildNatalSummary(
  positions: AnalyzeResponse["natalChart"]["positions"],
  aspects: AnalyzeResponse["natalChart"]["aspects"],
  birthAccuracy: BirthTimeAccuracy,
): string {
  const sun = positions.find((position) => position.body === "Солнце");
  const moon = positions.find((position) => position.body === "Луна");
  const ascendant = positions.find((position) => position.body === "Асцендент");
  const elementCounts = countElements(positions);
  const dominantElement = pickDominantElement(elementCounts);
  const aspectPreview = aspects
    .slice(0, 4)
    .map((aspect) => `${aspect.a} ${aspect.type} ${aspect.b}`)
    .join("; ");

  const paragraphs = [
    sun && moon
      ? `Солнце в ${sun.sign} (${sun.degree}°), Луна в ${moon.sign} (${moon.degree}°) — ядро личностного профиля для HR-контекста.`
      : undefined,
    `Преобладающая стихия: ${dominantElement}.`,
    birthAccuracy === "unknown"
      ? "Время рождения не указано: дома и асцендент не рассчитаны, опираемся на знаки планет."
      : ascendant
        ? `Асцендент: ${ascendant.sign} ${ascendant.degree}° (1 дом) — стиль входа в команду и первое впечатление.`
        : "Дома рассчитаны по указанному времени рождения.",
    aspects.length > 0
      ? `Ключевые аспекты: ${aspectPreview}${aspects.length > 4 ? ` и ещё ${aspects.length - 4}` : ""}.`
      : "Выраженных мажорных аспектов в пределах орбиса не найдено.",
  ].filter((paragraph): paragraph is string => Boolean(paragraph));

  return paragraphs.join("\n\n");
}

function countElements(positions: AnalyzeResponse["natalChart"]["positions"]) {
  const counts = { Огонь: 0, Земля: 0, Воздух: 0, Вода: 0 };

  for (const position of positions) {
    if (position.body === "Асцендент") {
      continue;
    }

    const element = ELEMENT_BY_SIGN[position.sign as (typeof SIGNS)[number]];
    if (element) {
      counts[element as keyof typeof counts] += 1;
    }
  }

  return counts;
}

function pickDominantElement(counts: Record<string, number>): string {
  const sorted = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  const [top, second] = sorted;

  if (!top || top[1] === 0) {
    return "баланс стихий";
  }

  if (second && top[1] === second[1]) {
    return `${top[0]} и ${second[0]} (по ${top[1]} планет)`;
  }

  return `${top[0]} (${top[1]} из 10 планет)`;
}

export function getBirthTimeAccuracy(request: AnalyzeRequest): BirthTimeAccuracy {
  if (!request.candidate.birthTime) {
    return "unknown";
  }

  return "exact";
}

function hashCandidate(request: AnalyzeRequest): number {
  const source = [
    request.candidate.fullName,
    request.candidate.birthDate,
    request.candidate.birthTime ?? "12:00",
    request.candidate.birthPlace.city,
    request.candidate.birthPlace.latitude,
    request.candidate.birthPlace.longitude,
  ].join("|");

  return Array.from(source).reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) % 360_000,
    17,
  );
}

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function signLongitude(sign: string, degree: number): number {
  const signIndex = SIGNS.findIndex((item) => item === sign);
  return normalize(signIndex * 30 + degree);
}

function shortestDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
