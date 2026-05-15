import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ProvidersResponse,
} from "@synastry/contracts";
import { apiUrl } from "../lib/env";

type ApiErrorBody = {
  message?: string;
  issues?: Array<{ message: string }>;
};

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null;
}

function formatApiError(response: FetchBaseQueryError) {
  const data = response.data;

  if (isApiErrorBody(data)) {
    if (data.issues?.length) {
      return data.issues.map((issue) => issue.message).join(" · ");
    }

    if (data.message) {
      return data.message;
    }
  }

  return "Не удалось получить отчёт. Попробуйте ещё раз чуть позже.";
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${apiUrl}/api`,
  }),
  tagTypes: ["Providers"],
  endpoints: (builder) => ({
    getProviders: builder.query<ProvidersResponse, void>({
      query: () => "/providers",
      providesTags: ["Providers"],
    }),
    analyze: builder.mutation<AnalyzeResponse, AnalyzeRequest>({
      query: (body) => ({
        url: "/analyze",
        method: "POST",
        body,
      }),
      transformErrorResponse: formatApiError,
    }),
  }),
});

export const { useAnalyzeMutation, useGetProvidersQuery } = baseApi;
