import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

// ============================================================================
// Helpers
// ============================================================================

const SETTINGS_URL = "/settings";
const HOURS_TEST_ID = "day-boundary-hours-input";
const MINUTES_TEST_ID = "day-boundary-minutes-input";

// ============================================================================
// Background
// ============================================================================

// Verifies FR11 of day-boundary
Given("user is on the settings page", async ({ page }) => {
  await page.goto(SETTINGS_URL);
  await page.getByTestId(HOURS_TEST_ID).waitFor({ state: "visible" });
});

// ============================================================================
// FR11: Valid time input
// ============================================================================

// Verifies FR11 of day-boundary
When(
  "user enters {string} into hours and {string} into minutes",
  async ({ page }, hours: string, minutes: string) => {
    const hoursInput = page.getByTestId(HOURS_TEST_ID);
    const minutesInput = page.getByTestId(MINUTES_TEST_ID);

    await hoursInput.click();
    await hoursInput.fill(hours);
    await minutesInput.click();
    await minutesInput.fill(minutes);
    await minutesInput.blur();
  },
);

// Verifies FR11 of day-boundary
Then(
  "day boundary displays {string} hours and {string} minutes",
  async ({ page }, expectedHours: string, expectedMinutes: string) => {
    const hoursInput = page.getByTestId(HOURS_TEST_ID);
    const minutesInput = page.getByTestId(MINUTES_TEST_ID);

    await expect(hoursInput).toHaveValue(expectedHours);
    await expect(minutesInput).toHaveValue(expectedMinutes);
  },
);

// ============================================================================
// FR11: Invalid hours/minutes revert
// ============================================================================

// Verifies FR11 of day-boundary
When(
  "user enters {string} into hours and blurs",
  async ({ page }, hours: string) => {
    const hoursInput = page.getByTestId(HOURS_TEST_ID);
    await hoursInput.click();
    await hoursInput.fill(hours);
    await hoursInput.blur();
  },
);

// Verifies FR11 of day-boundary
When(
  "user enters {string} into minutes and blurs",
  async ({ page }, minutes: string) => {
    const minutesInput = page.getByTestId(MINUTES_TEST_ID);
    await minutesInput.click();
    await minutesInput.fill(minutes);
    await minutesInput.blur();
  },
);

// ============================================================================
// FR11: Non-digit stripping
// ============================================================================

// Verifies FR11 of day-boundary
When("user types {string} into hours", async ({ page }, value: string) => {
  const hoursInput = page.getByTestId(HOURS_TEST_ID);
  await hoursInput.click();
  await hoursInput.fill("");
  await hoursInput.pressSequentially(value);
});

// Verifies FR11 of day-boundary
Then("hours input contains {string}", async ({ page }, expected: string) => {
  const hoursInput = page.getByTestId(HOURS_TEST_ID);
  await expect(hoursInput).toHaveValue(expected);
});

// ============================================================================
// FR11: Auto-focus from hours to minutes
// ============================================================================

// Verifies FR11 of day-boundary
Then("minutes input is focused", async ({ page }) => {
  const minutesInput = page.getByTestId(MINUTES_TEST_ID);
  await expect(minutesInput).toBeFocused();
});

// ============================================================================
// FR11: Enter key commits
// ============================================================================

// Verifies FR11 of day-boundary
When(
  "user types {string} into minutes and presses Enter",
  async ({ page }, value: string) => {
    const minutesInput = page.getByTestId(MINUTES_TEST_ID);
    await minutesInput.click();
    await minutesInput.fill("");
    await minutesInput.pressSequentially(value);
    await minutesInput.press("Enter");
  },
);
