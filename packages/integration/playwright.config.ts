// implements FR1, D2, D8 of add-supabase-integration-tests
import { defineConfig, devices } from "@playwright/test";

const CLIENT_DEV_URL = "http://localhost:5173";
const TEST_TIMEOUT_MS = 120_000;

export default defineConfig({
  testDir: "./src/tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "html",
  timeout: TEST_TIMEOUT_MS,
  globalSetup: "./src/global-setup.ts",
  globalTeardown: "./src/global-teardown.ts",
  use: {
    baseURL: CLIENT_DEV_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: [
            // Resolve host.docker.internal → 127.0.0.1 for OAuth redirect
            // GoTrue uses this hostname for browser redirects to mock OAuth adapter
            "--host-resolver-rules=MAP host.docker.internal 127.0.0.1",
          ],
        },
      },
    },
  ],
  webServer: {
    command: "pnpm --filter client dev",
    url: CLIENT_DEV_URL,
    reuseExistingServer: true,
    timeout: TEST_TIMEOUT_MS,
  },
});
