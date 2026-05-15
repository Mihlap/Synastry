import { CompatibilitySchema } from "@synastry/contracts";

export function parseCompatibilityJson(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const json = fenced?.[1] ?? trimmed;

  return CompatibilitySchema.parse(JSON.parse(json));
}
