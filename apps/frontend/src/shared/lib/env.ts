export const apiUrl =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

export const appName = import.meta.env.VITE_APP_NAME ?? "Synastry";
