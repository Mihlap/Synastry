import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const backendEnv = loadEnv(mode, resolve(rootDir, "../backend"), "");
  const backendPort = backendEnv.PORT || "3001";

  return {
    base: process.env.GITHUB_PAGES === "true" ? "/Synastry/" : "/",
    plugins: [tailwindcss(), react()],
    server: {
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});
