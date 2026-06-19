// implements FR6 of simplify-backend-connection
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

    // --- Step 1: Connect via Settings UI ---
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Dismiss onboarding dialog if it appears
    const onboardingDialog = page.getByTestId("onboarding-dialog-decline");
    if (
      await onboardingDialog.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await onboardingDialog.click();
    }

    // Expand Account & Sync accordion section to reveal server connection form
    await page
      .getByTestId("accordion-header-settings-accordion-account-sync")
      .click();

    await page.getByTestId("server-connect-supabase").click();
    await page.getByTestId("server-supabase-url").fill(config.supabaseUrl);
    await page.getByTestId("server-supabase-anon-key").fill(config.anonKey);
    await page.getByTestId("server-supabase-connect").click();

    const oauthButtons = page.getByTestId("server-oauth-buttons");
    await expect(oauthButtons).toBeVisible({
      timeout: CONNECTION_CHECK_TIMEOUT_MS,
    });

    // --- Step 2: Sign in via mock OAuth (keycloak provider) ---
    await page.getByTestId("server-oauth-keycloak").click();

    await page.waitForSelector('input[name="username"]', {
      timeout: SYNC_COMPLETE_TIMEOUT_MS,
    });
    await page.fill('input[name="username"]', "test@example.com");
    await page.locator('input[type="submit"][value="Sign-in"]').click();

    // --- Step 3: App handles callback → navigates to /tasks ---
    await page.waitForURL("**/tasks", { timeout: SYNC_COMPLETE_TIMEOUT_MS });
    await page.waitForSelector('[data-testid="active-tasks-page"]');

    // --- Step 4: Wait for initial sync to complete ---
    await page.waitForFunction(
      () => localStorage.getItem("last_sync") !== null,
      undefined,
      { timeout: SYNC_COMPLETE_TIMEOUT_MS },
    );

    // --- Step 5: Save storageState (localStorage + cookies) ---
    await page.context().storageState({ path: AUTH_STATE_PATH });
  },
);
