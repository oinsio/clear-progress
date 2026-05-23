// implements FR1, FR2 of add-supabase-integration-tests
import { type Browser, expect, type Page, test } from "@playwright/test";
import { readTestConfig } from "../config.js";

const CONNECTION_CHECK_TIMEOUT_MS = 10_000;
const INVALID_URL = "http://localhost:1";
const CONNECTION_CONFIG_KEY = "connection_config";

test.describe.configure({ mode: "serial" });

let browser: Browser;
let page: Page;

test.beforeAll(async ({ browser: b }) => {
  browser = b;
  const context = await browser.newContext();
  page = await context.newPage();

  // Start from clean state: no saved connection
  await page.goto("/setup");
  await page.evaluate(
    (key) => localStorage.removeItem(key),
    CONNECTION_CONFIG_KEY,
  );
  await page.reload();
  await page.waitForLoadState("networkidle");
});

test.afterAll(async () => {
  await page.close();
});

// 5.1.1
test("connect with valid URL + anon key → verify connected status", async () => {
  const { supabaseUrl, anonKey } = readTestConfig();

  await page.getByTestId("setup-supabase-section-toggle").click();
  await page.getByTestId("setup-supabase-url-input").fill(supabaseUrl);
  await page.getByTestId("setup-supabase-anon-key-input").fill(anonKey);
  await page.getByTestId("setup-supabase-connect-button").click();

  // Connection succeeds → either OAuth providers listed or "no providers" message
  const connectedStatus = page.locator(
    "[data-testid='setup-supabase-oauth-buttons'], [data-testid='setup-supabase-no-providers']",
  );
  await expect(connectedStatus).toBeVisible({
    timeout: CONNECTION_CHECK_TIMEOUT_MS,
  });
});

// 5.1.2 — builds on 5.1.1: connection is saved, navigate back to fresh setup form
test("connect with invalid URL → verify error state", async () => {
  // Reload /setup: localStorage now has connection_config → shows SupabaseConnectedSection.
  // Clear it so the setup form is accessible again.
  await page.goto("/setup");
  await page.evaluate(
    (key) => localStorage.removeItem(key),
    CONNECTION_CONFIG_KEY,
  );
  await page.reload();
  await page.waitForLoadState("networkidle");

  await page.getByTestId("setup-supabase-section-toggle").click();
  await page.getByTestId("setup-supabase-url-input").fill(INVALID_URL);
  await page.getByTestId("setup-supabase-anon-key-input").fill("some-key");
  await page.getByTestId("setup-supabase-connect-button").click();

  await expect(page.getByTestId("setup-supabase-error")).toBeVisible({
    timeout: CONNECTION_CHECK_TIMEOUT_MS,
  });
});
