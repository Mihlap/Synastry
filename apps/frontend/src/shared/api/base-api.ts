import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ProvidersResponse,
} from "@synastry/contracts";
import { apiUrl } from "../lib/env";

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
    }),
  }),
});

export const { useAnalyzeMutation, useGetProvidersQuery } = baseApi;
