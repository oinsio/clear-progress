import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const basePath = process.env.VITE_BASE_PATH ?? env.VITE_BASE_PATH ?? "/";
  return {
    base: basePath,
    plugins: [
      react(),
      VitePWA({
        registerType: "prompt",
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,mjs,css,html,ico,png,svg}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/lh3\.googleusercontent\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-avatar-cache",
                expiration: {
                  maxEntries: 1,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        reporter: ["lcov", "text"],
        reportsDirectory: "./coverage",
        exclude: [
          "src/test/**",
          "src/main.tsx",
          "src/vite-env.d.ts",
          "src/**/*.test.{ts,tsx}",
        ],
        thresholds: {
          statements: 70,
          lines: 70,
          functions: 70,
          branches: 65,
        },
      },
    },
  };
});
