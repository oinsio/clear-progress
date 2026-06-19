// implements FR6 of add-supabase-integration-tests
import { expect, test } from "@playwright/test";
import {
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

// ---------------------------------------------------------------------------

interface SettingsPullResponse {
  ok: boolean;
  settings: Array<{
    key: string;
    value: string;
    updated_at: string;
  }>;
}

// ---------------------------------------------------------------------------
// 5.8.1 — Change setting value → push → pull → verify persisted
// ---------------------------------------------------------------------------
test("change setting value → push → pull → verify persisted", async () => {
  const page = getPage();
  // Navigate to Settings page
  await page.goto("/settings");
  await page.waitForSelector('[data-testid="settings-page"]');

  // Expand Look & Feel accordion section to reveal accent color options
  await page
    .getByTestId("accordion-header-settings-accordion-look-and-feel")
    .click();

  // Change accent color to "green" — this is stored via settingsRepository.set()
  // and synced to the server (unlike colorScheme which is localStorage-only)
  await page.getByTestId("settings-color-option-green").click();

  // Trigger push + pull immediately
  await triggerSyncAndWait(page);

  // Pull from server and verify the setting was persisted
  const pullResponse = await pullFromServer<SettingsPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const accentSetting = pullResponse.settings.find(
    (setting) => setting.key === "accent_color",
  );
  expect(accentSetting).toBeDefined();
  expect(accentSetting?.value).toBe("green");
});
