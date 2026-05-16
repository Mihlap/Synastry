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
    base: "/",
    plugins: [
      tailwindcss(),
      react(),
      {
        name: "synastry-log-api-proxy-target",
        configureServer(server) {
          server.httpServer?.once("listening", () => {
            console.info(
              `[synastry] vite proxy → http://127.0.0.1:${backendPort} (берёт apps/backend PORT из .env)`,
            );
          });
        },
      },
    ],
    server: {
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          timeout: 0,
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});
