import { describe, expect, it } from "vitest";
import { buildNatalChart } from "./natal-chart.js";
import {
  computeCompatibilityAnchor,
  harmonizeCompatibility,
  verdictFromScore,
} from "./compatibility-anchor.js";

const sampleRequest = {
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
    companyDescription: "Продуктовая компания с инженерной культурой и распределённой командой.",
    jobDescription: "React, TypeScript, продуктовая разработка интерфейсов.",
  },
} as const;

describe("compatibility anchor", () => {
  it("varies score anchor for different candidates", () => {
    const chartA = buildNatalChart(sampleRequest);
    const chartB = buildNatalChart({
      ...sampleRequest,
      candidate: {
        ...sampleRequest.candidate,
        fullName: "Мария Иванова",
        birthDate: "1988-03-02",
      },
    });

    const anchorA = computeCompatibilityAnchor(sampleRequest, chartA);
    const anchorB = computeCompatibilityAnchor(
      {
        ...sampleRequest,
        candidate: {
          ...sampleRequest.candidate,
          fullName: "Мария Иванова",
          birthDate: "1988-03-02",
        },
      },
      chartB,
    );

    expect(anchorA).not.toBe(anchorB);
  });

  it("keeps calculated score instead of generic model score", () => {
    const chart = buildNatalChart(sampleRequest);
    const anchor = computeCompatibilityAnchor(sampleRequest, chart);

    const harmonized = harmonizeCompatibility(
      {
        verdict: "recommended",
        score: 85,
        summary: "test",
        pros: ["a"],
        cons: ["b"],
      },
      anchor,
    );

    expect(harmonized.score).toBe(anchor);
    expect(harmonized.verdict).toBe(verdictFromScore(anchor));
  });

  it("maps score ranges to verdict", () => {
    expect(verdictFromScore(80)).toBe("recommended");
    expect(verdictFromScore(60)).toBe("conditional");
    expect(verdictFromScore(30)).toBe("not_recommended");
  });
});
