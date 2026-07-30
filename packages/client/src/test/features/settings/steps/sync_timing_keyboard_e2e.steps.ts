// Verifies NFR-A1 of configurable-sync-timing
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { When, Then } = createBdd();

// ============================================================================
// Helpers
// ============================================================================

const SYNC_INTERVAL_INPUT_TEST_ID = "sync-interval-input";
const AUTO_SYNC_DELAY_INPUT_TEST_ID = "auto-sync-delay-input";
const ACCOUNT_SYNC_ACCORDION_HEADER_TEST_ID =
  "accordion-header-settings-accordion-account-sync";

// The "reach the settings page with the sync timing controls visible" Given
// step is intentionally NOT redefined here: playwright-bdd registers step
// definitions globally across every *_e2e.steps.ts file it loads, so reusing
// the exact step wording from sync_timing_a11y_e2e.steps.ts is enough for
// this feature's Background to resolve to that existing step.

// ============================================================================
// NFR-A1: Tab reaches the sync interval input
// ============================================================================

When(
  "user tabs from the accordion header to the sync interval input",
  async ({ page }) => {
    await page.getByTestId(ACCOUNT_SYNC_ACCORDION_HEADER_TEST_ID).focus();
    await page.keyboard.press("Tab");
  },
);

Then("sync interval input is focused", async ({ page }) => {
  const syncIntervalInput = page.getByTestId(SYNC_INTERVAL_INPUT_TEST_ID);
  await expect(syncIntervalInput).toBeFocused();
});

// ============================================================================
// NFR-A1: Typing and blurring/Enter commits values
// ============================================================================

When(
  "user types {string} into the sync interval input and blurs",
  async ({ page }, value: string) => {
    const syncIntervalInput = page.getByTestId(SYNC_INTERVAL_INPUT_TEST_ID);
    await syncIntervalInput.click();
    await syncIntervalInput.fill("");
    await syncIntervalInput.pressSequentially(value);
    await syncIntervalInput.blur();
  },
);

Then(
  "sync interval input displays {string}",
  async ({ page }, expected: string) => {
    const syncIntervalInput = page.getByTestId(SYNC_INTERVAL_INPUT_TEST_ID);
    await expect(syncIntervalInput).toHaveValue(expected);
  },
);

When(
  "user types {string} into the auto sync delay input and presses Enter",
  async ({ page }, value: string) => {
    const autoSyncDelayInput = page.getByTestId(AUTO_SYNC_DELAY_INPUT_TEST_ID);
    await autoSyncDelayInput.click();
    await autoSyncDelayInput.fill("");
    await autoSyncDelayInput.pressSequentially(value);
    await autoSyncDelayInput.press("Enter");
  },
);

Then(
  "auto sync delay input displays {string}",
  async ({ page }, expected: string) => {
    const autoSyncDelayInput = page.getByTestId(AUTO_SYNC_DELAY_INPUT_TEST_ID);
    await expect(autoSyncDelayInput).toHaveValue(expected);
  },
);

// ============================================================================
// NFR-A1: Full keyboard-only sequence across both controls
// ============================================================================

When(
  "user types {string} into the sync interval input and presses Enter",
  async ({ page }, value: string) => {
    const syncIntervalInput = page.getByTestId(SYNC_INTERVAL_INPUT_TEST_ID);
    await syncIntervalInput.fill("");
    await syncIntervalInput.pressSequentially(value);
    await syncIntervalInput.press("Enter");
  },
);

When(
  "user tabs from the sync interval input to the auto sync delay input",
  async ({ page }) => {
    await page.getByTestId(SYNC_INTERVAL_INPUT_TEST_ID).focus();
    await page.keyboard.press("Tab");
  },
);
