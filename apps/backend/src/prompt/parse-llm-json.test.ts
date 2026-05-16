import { describe, expect, it } from "vitest";
import { normalizeVerdict, parseCompatibilityJson } from "./parse-llm-json.js";

const validPayload = {
  verdict: "conditional",
  score: 65,
  summary: "Краткий итог для HR.",
  pros: ["a", "b", "c", "d", "e"],
  cons: ["f", "g", "h", "i", "j"],
  argumentsFor: ["k", "l", "m"],
  argumentsAgainst: ["n", "o", "p"],
};

describe("parseCompatibilityJson", () => {
  it("parses valid JSON", () => {
    const result = parseCompatibilityJson(JSON.stringify(validPayload));
    expect(result.verdict).toBe("conditional");
    expect(result.pros).toHaveLength(5);
  });

  it("normalizes Russian verdict labels", () => {
    const result = parseCompatibilityJson(
      JSON.stringify({
        ...validPayload,
        verdict: "условно",
      }),
    );
    expect(result.verdict).toBe("conditional");
  });

  it("uses fallback verdict when model returns an unknown label", () => {
    const result = parseCompatibilityJson(
      JSON.stringify({
        ...validPayload,
        verdict: "maybe_hire",
      }),
      "recommended",
    );
    expect(result.verdict).toBe("recommended");
  });
});

describe("normalizeVerdict", () => {
  it("maps recommended aliases", () => {
    expect(normalizeVerdict("рекомендуется")).toBe("recommended");
  });
});
