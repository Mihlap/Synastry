import type { Body as AstronomyBody } from "astronomy-engine";
import { Astronomy } from "./astronomy-engine.js";
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

const BODIES: ReadonlyArray<{ label: string; body: AstronomyBody }> = [
  { label: "Солнце", body: "Sun" as AstronomyBody },
  { label: "Луна", body: "Moon" as AstronomyBody },
  { label: "Меркурий", body: "Mercury" as AstronomyBody },
  { label: "Венера", body: "Venus" as AstronomyBody },
  { label: "Марс", body: "Mars" as AstronomyBody },
  { label: "Юпитер", body: "Jupiter" as AstronomyBody },
  { label: "Сатурн", body: "Saturn" as AstronomyBody },
  { label: "Уран", body: "Uranus" as AstronomyBody },
  { label: "Нептун", body: "Neptune" as AstronomyBody },
  { label: "Плутон", body: "Pluto" as AstronomyBody },
];

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
  const birthDate = resolveBirthDate(request);
  const ascendantLongitude =
    birthAccuracy === "unknown" ? undefined : calculateAscendantLongitude(request, birthDate);
  const positions: AnalyzeResponse["natalChart"]["positions"] = BODIES.map(({ label, body }) => {
    const longitude = getEclipticLongitude(body, birthDate);
    return {
      body: label,
      sign: signFromLongitude(longitude),
      degree: degreeInSign(longitude),
      house:
        ascendantLongitude === undefined
          ? undefined
          : wholeSignHouse(longitude, ascendantLongitude),
    };
  });

  if (ascendantLongitude !== undefined) {
    positions.push({
      body: "Асцендент",
      sign: signFromLongitude(ascendantLongitude),
      degree: degreeInSign(ascendantLongitude),
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
    summary: buildNatalSummary(positions, aspects, birthAccuracy, birthDate),
    positions,
    aspects: aspects.slice(0, 10),
  };
}

function buildNatalSummary(
  positions: AnalyzeResponse["natalChart"]["positions"],
  aspects: AnalyzeResponse["natalChart"]["aspects"],
  birthAccuracy: BirthTimeAccuracy,
  birthDate: Date,
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
    `Расчёт выполнен по реальным геоцентрическим тропическим долготам планет на ${birthDate.toISOString()}.`,
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

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function resolveBirthDate(request: AnalyzeRequest): Date {
  const birthTime = request.candidate.birthTime ?? "12:00";
  return zonedDateTimeToUtc(
    request.candidate.birthDate,
    birthTime,
    request.candidate.birthPlace.timezone,
  );
}

function getEclipticLongitude(body: AstronomyBody, date: Date): number {
  if (body === "Moon") {
    return normalize(Astronomy.EclipticGeoMoon(date).lon);
  }

  return normalize(Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon);
}

function calculateAscendantLongitude(request: AnalyzeRequest, date: Date): number {
  const latitude = clamp(request.candidate.birthPlace.latitude, -66.5, 66.5);
  const localSiderealDegrees = normalize(
    Astronomy.SiderealTime(date) * 15 + request.candidate.birthPlace.longitude,
  );
  const theta = toRadians(localSiderealDegrees);
  const phi = toRadians(latitude);
  const epsilon = toRadians(23.4392911);
  const ascendant = Math.atan2(
    -Math.cos(theta),
    Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon),
  );

  return normalize(toDegrees(ascendant));
}

function zonedDateTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  if (!year || !month || !day || hour === undefined || minute === undefined) {
    return new Date(`${date}T${time}:00.000Z`);
  }

  let utcMs = Date.UTC(year, month - 1, day, hour, minute);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, new Date(utcMs));
    utcMs = Date.UTC(year, month - 1, day, hour, minute) - offsetMinutes * 60_000;
  }

  return new Date(utcMs);
}

function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(date).map((part) => [part.type, part.value]),
    );
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );

    return (asUtc - date.getTime()) / 60_000;
  } catch {
    return 0;
  }
}

function signFromLongitude(longitude: number): (typeof SIGNS)[number] {
  return SIGNS[Math.floor(normalize(longitude) / 30)] ?? "Овен";
}

function degreeInSign(longitude: number): number {
  return round(normalize(longitude) % 30);
}

function wholeSignHouse(longitude: number, ascendantLongitude: number): number {
  const signIndex = Math.floor(normalize(longitude) / 30);
  const ascendantSignIndex = Math.floor(normalize(ascendantLongitude) / 30);
  return ((signIndex - ascendantSignIndex + 12) % 12) + 1;
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

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
