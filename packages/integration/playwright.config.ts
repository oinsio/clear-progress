// implements FR1, D2, D8 of add-supabase-integration-tests
import { defineConfig, devices } from "@playwright/test";
import { AUTH_STATE_PATH } from "./src/config.js";

const CLIENT_DEV_URL = "http://localhost:5173";
const TEST_TIMEOUT_MS = 60_000;

const CHROME_LAUNCH_OPTIONS = {
  args: [
    // Resolve host.docker.internal → 127.0.0.1 for OAuth redirect
    // GoTrue uses this hostname for browser redirects to mock OAuth adapter
    "--host-resolver-rules=MAP host.docker.internal 127.0.0.1",
  ],
};

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
    // Auth setup — runs OAuth once, saves storageState for reuse
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: CHROME_LAUNCH_OPTIONS,
      },
    },
    // Connection tests — no auth needed
    {
      name: "connection",
      testMatch: /connection\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: CHROME_LAUNCH_OPTIONS,
      },
    },
    // All sync/flow tests — depend on shared auth setup
    {
      name: "chromium",
      testIgnore: [/auth\.setup\.ts/, /connection\.spec\.ts/],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: CHROME_LAUNCH_OPTIONS,
        storageState: AUTH_STATE_PATH,
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
