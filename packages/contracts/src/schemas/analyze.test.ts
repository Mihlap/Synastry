import { describe, expect, it } from "vitest";
import { AnalyzeRequestSchema } from "./analyze.js";

describe("AnalyzeRequestSchema", () => {
  it("accepts a valid request with explicit personal data consent", () => {
    const parsed = AnalyzeRequestSchema.parse({
      consentAccepted: true,
      candidate: {
        fullName: "Мария Иванова",
        birthDate: "1992-04-18",
        birthTime: "08:30",
        birthPlace: {
          city: "Москва",
          latitude: 55.7558,
          longitude: 37.6173,
          timezone: "Europe/Moscow",
        },
      },
      vacancy: {
        title: "Product Manager",
        companyDescription:
          "Технологическая компания с распределенной командой и сильной продуктовой культурой.",
        jobDescription:
          "Нужен специалист, который умеет работать с неопределенностью, пользователями и метриками.",
      },
    });

    expect(parsed.candidate.fullName).toBe("Мария Иванова");
  });

  it("rejects requests without consent", () => {
    const result = AnalyzeRequestSchema.safeParse({
      consentAccepted: false,
      candidate: {},
      vacancy: {},
    });

    expect(result.success).toBe(false);
  });
});
