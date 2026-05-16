const rawApiUrl = import.meta.env.VITE_API_URL?.trim() ?? "";

export const apiUrl =
  rawApiUrl.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "" : "http://localhost:3001");

export const appName = import.meta.env.VITE_APP_NAME ?? "Synastry";
