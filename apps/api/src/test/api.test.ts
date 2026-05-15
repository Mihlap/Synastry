import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

const app = createApp();

describe("Synastry API", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body.status).toBe("ok");
  });

  it("returns enabled providers without leaking secrets", async () => {
    const response = await request(app).get("/api/providers").expect(200);

    expect(response.body.providers[0]).toMatchObject({
      id: "gigachat",
      name: "GigaChat",
    });
    expect(JSON.stringify(response.body)).not.toContain("SECRET");
  });

  it("analyzes a valid request through the local fallback when GigaChat secrets are absent", async () => {
    const response = await request(app)
      .post("/api/analyze")
      .send({
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
      })
      .expect(200);

    expect(response.body.compatibility.verdict).toBe("conditional");
    expect(response.body.meta.provider).toBe("local");
    expect(response.body.meta.birthTimeAccuracy).toBe("unknown");
  });

  it("rejects requests without personal data consent", async () => {
    await request(app)
      .post("/api/analyze")
      .send({
        consentAccepted: false,
      })
      .expect(400);
  });
});
