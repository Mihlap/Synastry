import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

type ApiErrorBody = {
  message?: string;
  issues?: Array<{ message: string }>;
};

export function getAnalyzeErrorMessage(error: unknown): string {
  if (!error) {
    return "Не удалось получить отчёт. Попробуйте ещё раз чуть позже.";
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  const fetchError = error as FetchBaseQueryError;

  if (fetchError.status === "FETCH_ERROR") {
    return (
      "Не удалось связаться с API: проверьте, что backend запущен, порт совпадает с настройкой (в dev Vite проксирует /api на PORT из apps/backend/.env)." +
      " Если в apps/frontend/.env задан VITE_API_URL вручную — он должен указывать на этот же порт, иначе оставьте переменную пустой для proxy."
    );
  }

  if (fetchError.status === "TIMEOUT_ERROR") {
    return "GigaChat не успел сформировать отчёт за отведённое время. Повторите запрос или проверьте доступность GigaChat API.";
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
