import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

const app = createApp();

describe("Synastry API", () => {
  it("returns health status", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("ok");
  });

  it("returns enabled providers without leaking secrets", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/providers",
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.providers[0]).toMatchObject({
      id: "gigachat",
      name: "GigaChat",
    });
    expect(JSON.stringify(body)).not.toContain("SECRET");
  });

  it("analyzes a valid request through the local fallback when GigaChat secrets are absent", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/analyze",
      payload: {
        consentAccepted: true,
        candidate: {
          fullName: "Антон Петров",
          birthDate: "1990-10-11",
          birthTime: null,
          birthPlace: {
            city: "Санкт-Петербург",
            latitude: 59.9386,
            longitude: 30.3141,
            timezone: "Europe/Moscow",
          },
        },
        vacancy: {
          title: "Frontend Engineer",
          companyDescription:
            "Продуктовая компания с аккуратной инженерной культурой и распределенной командой.",
          jobDescription:
            "Нужен инженер, который умеет развивать интерфейсы, работать с React и обсуждать решения с продуктом.",
        },
      },
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.compatibility.score).toBeGreaterThanOrEqual(35);
    expect(body.compatibility.score).toBeLessThanOrEqual(94);
    expect(body.natalChart.aspects.length).toBeGreaterThan(0);
    expect(body.meta.provider).toBe("local");
    expect(body.meta.birthTimeAccuracy).toBe("unknown");
  });

  it("rejects requests without personal data consent", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/analyze",
      payload: {
        consentAccepted: false,
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
