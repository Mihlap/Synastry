import { z } from "zod";

export const VerdictSchema = z.enum([
  "recommended",
  "conditional",
  "not_recommended",
]);

export const BirthTimeAccuracySchema = z.enum([
  "exact",
  "approximate",
  "unknown",
]);

const optionalBirthTimeSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Проверьте время: формат ЧЧ:ММ")
    .nullable()
    .optional(),
);

export const CandidateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Укажите ФИО кандидата")
    .min(2, "ФИО слишком короткое — укажите имя и фамилию")
    .max(160, "Слишком длинное ФИО — не больше 160 символов"),
  birthDate: z
    .string()
    .trim()
    .min(1, "Укажите дату рождения")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите дату в календаре"),
  birthTime: optionalBirthTimeSchema,
  birthPlace: z.object({
    city: z
      .string()
      .trim()
      .min(1, "Укажите город и регион рождения")
      .min(2, "Слишком коротко — укажите город и регион или область"),
    latitude: z.number({
      error: "Укажите координаты города",
    }),
    longitude: z.number({
      error: "Укажите координаты города",
    }),
    timezone: z
      .string()
      .trim()
      .min(3, "Не удалось определить часовой пояс места рождения"),
  }),
  resumeText: z
    .string()
    .trim()
    .max(50_000, "Текст резюме слишком длинный")
    .optional(),
});

export const VacancySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Укажите название должности")
    .min(2, "Название должности слишком короткое"),
  companyDescription: z
    .string()
    .trim()
    .min(1, "Расскажите о компании — хотя бы в двух словах")
    .min(20, "Добавьте про компанию: культуру, команду или формат")
    .max(8_000, "Описание компании слишком длинное"),
  jobDescription: z
    .string()
    .trim()
    .min(1, "Опишите вакансию — задачи, навыки и ожидания от кандидата")
    .min(20, "Расширьте описание вакансии — так точнее анализ")
    .max(12_000, "Описание вакансии слишком длинное"),
});

export const AnalyzeRequestSchema = z.object({
  candidate: CandidateSchema,
  vacancy: VacancySchema,
  options: z
    .object({
      providerId: z.string().trim().min(2).max(40).optional(),
      model: z.string().trim().min(2).max(80).optional(),
    })
    .optional(),
  consentAccepted: z.boolean().refine((value) => value, {
    message:
      "Чтобы получить отчёт, подтвердите согласие на обработку введённых данных",
  }),
});

export const ChartPositionSchema = z.object({
  body: z.string(),
  sign: z.string(),
  degree: z.number(),
  house: z.number().int().min(1).max(12).optional(),
});

export const ChartAspectSchema = z.object({
  a: z.string(),
  b: z.string(),
  type: z.string(),
  orb: z.number(),
});

export const NatalChartSchema = z.object({
  summary: z.string(),
  positions: z.array(ChartPositionSchema),
  aspects: z.array(ChartAspectSchema),
});

export const CompatibilitySchema = z.object({
  verdict: VerdictSchema,
  score: z.number().int().min(0).max(100).optional(),
  summary: z.string(),
  pros: z.array(z.string()).min(1),
  cons: z.array(z.string()).min(1),
  arguments: z.array(z.string()).optional(),
  argumentsFor: z.array(z.string()).optional(),
  argumentsAgainst: z.array(z.string()).optional(),
});

export const AnalyzeResponseSchema = z.object({
  natalChart: NatalChartSchema,
  compatibility: CompatibilitySchema,
  meta: z.object({
    provider: z.string(),
    model: z.string(),
    analyzedAt: z.string(),
    disclaimer: z.string(),
    birthTimeAccuracy: BirthTimeAccuracySchema,
  }),
});

export const ProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  models: z.array(z.string()),
});

export const ProvidersResponseSchema = z.object({
  providers: z.array(ProviderSchema),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type BirthTimeAccuracy = z.infer<typeof BirthTimeAccuracySchema>;
export type ProviderInfo = z.infer<typeof ProviderSchema>;
export type ProvidersResponse = z.infer<typeof ProvidersResponseSchema>;
