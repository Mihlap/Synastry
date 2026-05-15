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

export const CandidateSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  birthPlace: z.object({
    city: z.string().trim().min(2).max(120),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    timezone: z.string().trim().min(3).max(80),
  }),
  resumeText: z.string().trim().max(50_000).optional(),
});

export const VacancySchema = z.object({
  title: z.string().trim().min(2).max(160),
  companyDescription: z.string().trim().min(20).max(8_000),
  jobDescription: z.string().trim().min(20).max(12_000),
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
    message: "Нужно согласие на обработку данных",
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
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  arguments: z.array(z.string()),
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
