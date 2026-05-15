import type {
  AnalyzeRequest,
  AnalyzeResponse,
  BirthTimeAccuracy,
} from "@synastry/shared";

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
  const positions = BODIES.map((body, index) => {
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

  const sun = positions.find((position) => position.body === "Солнце");
  const moon = positions.find((position) => position.body === "Луна");

  return {
    summary: `Ключевой акцент карты: Солнце в знаке ${sun?.sign}, Луна в знаке ${moon?.sign}. Расчёт MVP использует детерминированную модель, которую можно заменить Swiss Ephemeris без изменения API.`,
    positions,
    aspects: aspects.slice(0, 8),
  };
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
