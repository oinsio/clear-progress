// implements FR6 of add-supabase-integration-tests
// Shared auth setup — runs OAuth once, saves storageState for all test files.

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { expect, test as setup } from "@playwright/test";
import { AUTH_STATE_PATH, readTestConfig } from "../config.js";

const SYNC_COMPLETE_TIMEOUT_MS = 30_000;
const CONNECTION_CHECK_TIMEOUT_MS = 5_000;

setup(
  "authenticate via mock OAuth and wait for initial sync",
  async ({ page }) => {
    const config = readTestConfig();

    // Ensure .auth directory exists
    mkdirSync(dirname(AUTH_STATE_PATH), { recursive: true });

    // --- Step 1: Connect via Setup UI ---
    await page.goto("/setup");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("setup-supabase-section-toggle").click();
    await page.getByTestId("setup-supabase-url-input").fill(config.supabaseUrl);
    await page
      .getByTestId("setup-supabase-anon-key-input")
      .fill(config.anonKey);
    await page.getByTestId("setup-supabase-connect-button").click();

    const oauthButtons = page.getByTestId("setup-supabase-oauth-buttons");
    await expect(oauthButtons).toBeVisible({
      timeout: CONNECTION_CHECK_TIMEOUT_MS,
    });

    // --- Step 2: Sign in via mock OAuth (keycloak provider) ---
    await page.getByTestId("setup-supabase-oauth-keycloak").click();

    await page.waitForSelector('input[name="username"]', {
      timeout: SYNC_COMPLETE_TIMEOUT_MS,
    });
    await page.fill('input[name="username"]', "test@example.com");
    await page.locator('input[type="submit"][value="Sign-in"]').click();

    // --- Step 3: App handles callback → navigates to /tasks ---
    await page.waitForURL("**/tasks", { timeout: SYNC_COMPLETE_TIMEOUT_MS });
    await page.waitForSelector('[data-testid="inbox-page"]');

    // --- Step 4: Wait for access token ---
    await page.waitForFunction(
      () => localStorage.getItem("access_token") !== null,
      undefined,
      { timeout: SYNC_COMPLETE_TIMEOUT_MS },
    );

    // --- Step 5: Wait for initial sync to complete ---
    await page.waitForFunction(
      () => localStorage.getItem("last_sync") !== null,
      undefined,
      { timeout: SYNC_COMPLETE_TIMEOUT_MS },
    );

    // --- Step 6: Save storageState (localStorage + cookies) ---
    await page.context().storageState({ path: AUTH_STATE_PATH });
  },
);
