import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
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

const ANALYZE_TIMEOUT_MS = 190_000;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${apiUrl}/api`,
});

const baseQueryWithTimeout: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError | string
> = async (args, api, extraOptions) => {
  if (typeof args === "string") {
    return rawBaseQuery(args, api, extraOptions);
  }

  const { timeout: timeoutMs, ...fetchArgs } = args;

  if (!timeoutMs) {
    return rawBaseQuery(args, api, extraOptions);
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await rawBaseQuery(
      { ...fetchArgs, signal: controller.signal },
      api,
      extraOptions,
    );
  } finally {
    window.clearTimeout(timer);
  }
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithTimeout,
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
        timeout: 190_000,
      }),
      transformErrorResponse: formatApiError,
    }),
  }),
});

export const { useAnalyzeMutation, useGetProvidersQuery } = baseApi;
