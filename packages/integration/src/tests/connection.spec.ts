// implements FR1, FR2 of simplify-backend-connection
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
  await page.goto("/settings");
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

  await page.getByTestId("server-connect-supabase").click();
  await page.getByTestId("server-supabase-url").fill(supabaseUrl);
  await page.getByTestId("server-supabase-anon-key").fill(anonKey);
  await page.getByTestId("server-supabase-connect").click();

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
  await page.goto("/settings");
  await page.evaluate(
    (key) => localStorage.removeItem(key),
    CONNECTION_CONFIG_KEY,
  );
  await page.reload();
  await page.waitForLoadState("networkidle");

  await page.getByTestId("server-connect-supabase").click();
  await page.getByTestId("server-supabase-url").fill(INVALID_URL);
  await page.getByTestId("server-supabase-anon-key").fill("some-key");
  await page.getByTestId("server-supabase-connect").click();

  await expect(page.getByTestId("server-supabase-error")).toBeVisible({
    timeout: CONNECTION_CHECK_TIMEOUT_MS,
  });
});
