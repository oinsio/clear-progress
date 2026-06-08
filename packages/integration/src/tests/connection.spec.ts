// implements FR1, FR2 of simplify-backend-connection
import { type Browser, expect, type Page, test } from "@playwright/test";
import { readTestConfig } from "../config.js";

const CONNECTION_CHECK_TIMEOUT_MS = 10_000;
const ONBOARDING_DISMISS_TIMEOUT_MS = 2000;
const INVALID_URL = "http://localhost:1";
const CONNECTION_CONFIG_KEY = "connection_config";

async function fillAndSubmitConnectionForm(
  targetPage: Page,
  url: string,
  key: string,
): Promise<void> {
  await targetPage.getByTestId("server-connect-supabase").click();
  await targetPage.getByTestId("server-supabase-url").fill(url);
  await targetPage.getByTestId("server-supabase-anon-key").fill(key);
  await targetPage.getByTestId("server-supabase-connect").click();
}

async function resetConnectionState(targetPage: Page): Promise<void> {
  await targetPage.goto("/settings");
  await targetPage.evaluate(
    (key) => localStorage.removeItem(key),
    CONNECTION_CONFIG_KEY,
  );
  await targetPage.reload();
  await targetPage.waitForLoadState("networkidle");

  const onboardingDecline = targetPage.getByTestId("onboarding-dialog-decline");
  if (
    await onboardingDecline
      .isVisible({ timeout: ONBOARDING_DISMISS_TIMEOUT_MS })
      .catch(() => false)
  ) {
    await onboardingDecline.click();
  }
}

test.describe.configure({ mode: "serial" });

let browser: Browser;
let page: Page;

test.beforeAll(async ({ browser: b }) => {
  browser = b;
  const context = await browser.newContext();
  page = await context.newPage();

  await resetConnectionState(page);
});

test.afterAll(async () => {
  await page.close();
});

// 5.1.1
test("connect with valid URL + anon key → verify connected status", async () => {
  const { supabaseUrl, anonKey } = readTestConfig();

  await fillAndSubmitConnectionForm(page, supabaseUrl, anonKey);

  // Connection succeeds → either OAuth providers listed or "no providers" message
  const connectedStatus = page.locator(
    "[data-testid='server-oauth-buttons'], [data-testid='server-no-providers']",
  );
  await expect(connectedStatus).toBeVisible({
    timeout: CONNECTION_CHECK_TIMEOUT_MS,
  });
});

// 5.1.2 — builds on 5.1.1: connection is saved, navigate back to fresh setup form
test("connect with invalid URL → verify error state", async () => {
  // Reload /settings: localStorage now has connection_config → shows connected status.
  // Clear it so the setup form is accessible again.
  await resetConnectionState(page);

  await fillAndSubmitConnectionForm(page, INVALID_URL, "some-key");

  await expect(page.getByTestId("server-supabase-error")).toBeVisible({
    timeout: CONNECTION_CHECK_TIMEOUT_MS,
  });
});
