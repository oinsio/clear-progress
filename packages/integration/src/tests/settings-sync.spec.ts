// implements FR6 of add-supabase-integration-tests
import { expect, type Page, test } from "@playwright/test";
import {
  closeAuthenticatedPage,
  createAuthenticatedPage,
  triggerSyncAndWait,
} from "../test-helpers.js";

test.describe.configure({ mode: "serial" });

let page: Page;
let accessToken: string;
let supabaseUrl: string;
let anonKey: string;

test.beforeAll(async ({ browser: b }) => {
  const auth = await createAuthenticatedPage(b);
  page = auth.page;
  accessToken = auth.accessToken;
  supabaseUrl = auth.supabaseUrl;
  anonKey = auth.anonKey;
});

test.afterAll(async () => {
  await closeAuthenticatedPage(page);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calls the pull Edge Function from Node.js to verify server-side state.
 * Uses since_revision=0 to receive the full dataset.
 */
async function pullFromServer(): Promise<{
  ok: boolean;
  settings: Array<{
    key: string;
    value: string;
    updated_at: string;
  }>;
}> {
  const response = await fetch(`${supabaseUrl}/functions/v1/pull`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ since_revision: 0 }),
  });
  if (!response.ok) {
    throw new Error(`pull failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as Promise<{
    ok: boolean;
    settings: Array<{
      key: string;
      value: string;
      updated_at: string;
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// 5.8.1 — Change setting value → push → pull → verify persisted
// ---------------------------------------------------------------------------
test("change setting value → push → pull → verify persisted", async () => {
  // Navigate to Settings page
  await page.goto("/settings");
  await page.waitForSelector('[data-testid="settings-page"]');

  // Change accent color to "green" — this is stored via settingsRepository.set()
  // and synced to the server (unlike colorScheme which is localStorage-only)
  await page.getByTestId("settings-color-option-green").click();

  // Trigger push + pull immediately
  await triggerSyncAndWait(page);

  // Pull from server and verify the setting was persisted
  const pullResponse = await pullFromServer();
  expect(pullResponse.ok).toBe(true);

  const accentSetting = pullResponse.settings.find(
    (setting) => setting.key === "accent_color",
  );
  expect(accentSetting).toBeDefined();
  expect(accentSetting?.value).toBe("green");
});
