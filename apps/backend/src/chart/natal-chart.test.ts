import { describe, expect, it } from "vitest";
import type { AnalyzeRequest } from "@synastry/contracts";
import { buildNatalChart, getBirthTimeAccuracy } from "./natal-chart.js";

const sampleRequest: AnalyzeRequest = {
  consentAccepted: true,
  candidate: {
    fullName: "Test User",
    birthDate: "1990-01-15",
    birthTime: null,
    birthPlace: {
      city: "Moscow",
      latitude: 55.7558,
      longitude: 37.6173,
      timezone: "Europe/Moscow",
    },
  },
  vacancy: {
    title: "Frontend Engineer",
    companyDescription: "Product company.",
    jobDescription: "React development.",
  },
};

describe("buildNatalChart", () => {
  it("builds planet positions without throwing", () => {
    const chart = buildNatalChart(sampleRequest);

    expect(chart.positions.length).toBeGreaterThanOrEqual(10);
    expect(chart.positions.some((position) => position.body === "Солнце")).toBe(true);
    expect(chart.summary).toContain("Солнце");
  });

  it("marks birth time as unknown when time is omitted", () => {
    expect(getBirthTimeAccuracy(sampleRequest)).toBe("unknown");
  });
});
