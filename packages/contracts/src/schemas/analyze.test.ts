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
          city: "Москва, Московская область",
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

  it("returns russian messages for short vacancy description", () => {
    const result = AnalyzeRequestSchema.safeParse({
      consentAccepted: true,
      candidate: {
        fullName: "Иван Иванов",
        birthDate: "1990-01-01",
        birthPlace: {
          city: "Москва, Московская область",
          latitude: 55.7558,
          longitude: 37.6173,
          timezone: "Europe/Moscow",
        },
      },
      vacancy: {
        title: "Аналитик",
        companyDescription: "Коротко",
        jobDescription: "Тоже мало",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages.some((message) => message.includes("компани"))).toBe(true);
      expect(messages.some((message) => message.includes("ваканс"))).toBe(true);
      expect(messages.some((message) => message.includes("Too small"))).toBe(
        false,
      );
    }
  });
});
