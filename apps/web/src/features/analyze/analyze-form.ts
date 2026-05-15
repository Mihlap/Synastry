import { AnalyzeRequestSchema, type AnalyzeRequest } from "@synastry/shared";

export const defaultAnalyzeValues: AnalyzeRequest = {
  consentAccepted: false,
  candidate: {
    fullName: "",
    birthDate: "",
    birthTime: null,
    birthPlace: {
      city: "Москва",
      latitude: 55.7558,
      longitude: 37.6173,
      timezone: "Europe/Moscow",
    },
  },
  vacancy: {
    title: "",
    companyDescription: "",
    jobDescription: "",
  },
  options: {
    providerId: "gigachat",
    model: "GigaChat",
  },
};

export const analyzeFormSchema = AnalyzeRequestSchema;
