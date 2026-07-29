// Verifies NFR-A1 of configurable-sync-timing
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

// ============================================================================
// Helpers
// ============================================================================

const SETTINGS_URL = "/settings";
const SYNC_TIMING_SECTION_TEST_ID = "settings-sync-timing";
const SYNC_INTERVAL_INPUT_TEST_ID = "sync-interval-input";
const AUTO_SYNC_DELAY_INPUT_TEST_ID = "auto-sync-delay-input";
const ACCOUNT_SYNC_ACCORDION_HEADER_TEST_ID =
  "accordion-header-settings-accordion-account-sync";
const ONBOARDING_DISMISSED_STORAGE_KEY = "onboarding_shown";

// ============================================================================
// Background
// ============================================================================

// The sync timing controls live inside the collapsible "Account & Sync"
// accordion section on the settings page, so — unlike the plain
// "user is on the settings page" step used elsewhere — reaching them also
// requires dismissing the first-run onboarding dialog and expanding that
// section.
Given(
  "user is on the settings page with the sync timing controls visible",
  async ({ page }) => {
    await page.goto(SETTINGS_URL);
    await page.evaluate((storageKey) => {
      localStorage.setItem(storageKey, "true");
    }, ONBOARDING_DISMISSED_STORAGE_KEY);
    await page.reload();

    const syncTimingSection = page.getByTestId(SYNC_TIMING_SECTION_TEST_ID);
    if (!(await syncTimingSection.isVisible())) {
      await page.getByTestId(ACCOUNT_SYNC_ACCORDION_HEADER_TEST_ID).click();
    }
    await syncTimingSection.waitFor({ state: "visible" });
  },
);

// ============================================================================
// NFR-A1: Sync interval input has an accessible label and description
// ============================================================================

Then("sync interval input has a non-empty aria-label", async ({ page }) => {
  const syncIntervalInput = page.getByTestId(SYNC_INTERVAL_INPUT_TEST_ID);
  await expect(syncIntervalInput).toHaveAttribute("aria-label", /.+/);
});

Then(
  "sync interval input has an aria-describedby pointing to visible help text",
  async ({ page }) => {
    const syncIntervalInput = page.getByTestId(SYNC_INTERVAL_INPUT_TEST_ID);
    const describedById =
      await syncIntervalInput.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();

    const descriptionElement = page.locator(`#${describedById}`);
    await expect(descriptionElement).toBeVisible();
    const descriptionText = await descriptionElement.textContent();
    expect(descriptionText?.trim().length).toBeGreaterThan(0);
  },
);

// ============================================================================
// NFR-A1: Auto sync delay input has an accessible label and description
// ============================================================================

Then("auto sync delay input has a non-empty aria-label", async ({ page }) => {
  const autoSyncDelayInput = page.getByTestId(AUTO_SYNC_DELAY_INPUT_TEST_ID);
  await expect(autoSyncDelayInput).toHaveAttribute("aria-label", /.+/);
});

Then(
  "auto sync delay input has an aria-describedby pointing to visible help text",
  async ({ page }) => {
    const autoSyncDelayInput = page.getByTestId(AUTO_SYNC_DELAY_INPUT_TEST_ID);
    const describedById =
      await autoSyncDelayInput.getAttribute("aria-describedby");
    expect(describedById).toBeTruthy();

    const descriptionElement = page.locator(`#${describedById}`);
    await expect(descriptionElement).toBeVisible();
    const descriptionText = await descriptionElement.textContent();
    expect(descriptionText?.trim().length).toBeGreaterThan(0);
  },
);

// ============================================================================
// NFR-A1: axe-core checks
// ============================================================================

Then(
  "sync timing controls pass axe-core accessibility checks",
  async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include(`[data-testid="${SYNC_TIMING_SECTION_TEST_ID}"]`)
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  },
);
