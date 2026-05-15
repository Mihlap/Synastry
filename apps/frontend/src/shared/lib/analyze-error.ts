import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

type ApiErrorBody = {
  message?: string;
  issues?: Array<{ message: string }>;
};

export function getAnalyzeErrorMessage(error: unknown): string {
  if (!error) {
    return "Не удалось получить отчёт. Попробуйте ещё раз чуть позже.";
  }

  const fetchError = error as FetchBaseQueryError;

  if (fetchError.status === "FETCH_ERROR") {
    return "Не удалось связаться с сервером. Запустите backend (npm run dev:backend) и перезапустите frontend.";
  }

  if (typeof fetchError.data === "string" && fetchError.data.trim()) {
    return fetchError.data;
  }

  if (fetchError.data && typeof fetchError.data === "object") {
    const body = fetchError.data as ApiErrorBody;

    if (body.issues?.length) {
      return body.issues.map((issue) => issue.message).join(" · ");
    }

    if (body.message) {
      return body.message;
    }
  }

  return "Не удалось получить отчёт. Попробуйте ещё раз чуть позже.";
}
