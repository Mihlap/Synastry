import { config } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV !== "test") {
  config();
}

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  GIGACHAT_CREDENTIALS: z.string().optional(),
  GIGACHAT_SCOPE: z.string().default("GIGACHAT_API_PERS"),
  GIGACHAT_MODEL: z.string().default("GigaChat"),
  GIGACHAT_ALLOW_SELF_SIGNED: z.coerce.boolean().default(false),
  AI_PROVIDER: z.string().default("gigachat"),
  AI_DEFAULT_MODEL: z.string().default("GigaChat"),
  ENABLED_PROVIDERS: z.string().default("gigachat"),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

export const env = EnvSchema.parse(process.env);

export const enabledProviders = env.ENABLED_PROVIDERS.split(",")
  .map((provider) => provider.trim())
  .filter(Boolean);
