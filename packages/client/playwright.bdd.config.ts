import { defineConfig, devices } from "@playwright/test";
import { cucumberReporter, defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "src/test/features/**/*_e2e.feature",
  steps: "src/test/features/**/steps/*_e2e.steps.ts",
  featuresRoot: "./src/test/features",
  outputDir: ".features-gen",
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html"],
    cucumberReporter("html", { outputFile: "cucumber-report/index.html" }),
  ],
  timeout: 60000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
