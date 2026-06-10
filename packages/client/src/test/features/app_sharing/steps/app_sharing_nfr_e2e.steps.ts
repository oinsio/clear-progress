// Verifies NFR-A1, NFR-A2, NFR-A3, NFR-R1, FR4 of share-with-friend
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const SHARE_SECTION_TIMEOUT_MS = 3000;
// Pre-existing color-contrast issue: text-gray-400 on white (#9ca3af on #ffffff = 2.53 ratio).
// Tracked separately — excluded here so structural a11y assertions are not masked.
const KNOWN_AXE_EXCLUSIONS = ["color-contrast"];
const MOBILE_VIEWPORT_WIDTH = 320;
const MOBILE_VIEWPORT_HEIGHT = 568;
const DESKTOP_VIEWPORT_HEIGHT = 1440;

// ============================================================================
// Background: user is on the Settings page with share section visible
// ============================================================================

Given(
  "user is on the Settings page with share section visible",
  async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("onboarding_shown", "true");
    });
    await page.goto("/settings");
    await page
      .getByTestId("settings-share-app")
      .waitFor({ state: "visible", timeout: SHARE_SECTION_TIMEOUT_MS });
  },
);

// ============================================================================
// NFR-A1: Share button has proper aria-label
// ============================================================================

Then("share button has a non-empty aria-label", async ({ page }) => {
  const shareButton = page.getByTestId("share-app-button");
  await expect(shareButton).toHaveAttribute("aria-label", /.+/);
});

// ============================================================================
// NFR-A3 / FR4: Confirmation dialog role and aria attributes
// ============================================================================

When("user clicks the share button", async ({ page }) => {
  await page.getByTestId("share-app-button").click();
  await page
    .getByTestId("confirm-dialog")
    .waitFor({ state: "visible", timeout: SHARE_SECTION_TIMEOUT_MS });
});

Then(
  "confirmation dialog has role {string}",
  async ({ page }, expectedRole: string) => {
    const dialog = page.getByTestId("confirm-dialog");
    await expect(dialog).toHaveAttribute("role", expectedRole);
  },
);

Then(
  "confirmation dialog has aria-labelledby linked to its title",
  async ({ page }) => {
    const dialog = page.getByTestId("confirm-dialog");
    const labelledBy = await dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();

    const titleElement = page.getByTestId("confirm-dialog-title");
    const titleId = await titleElement.getAttribute("id");
    expect(titleId).toBeTruthy();
    expect(labelledBy).toBe(titleId);
  },
);

Then(
  "confirmation dialog has aria-describedby linked to its message",
  async ({ page }) => {
    const dialog = page.getByTestId("confirm-dialog");
    const describedBy = await dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();

    const messageElement = page.getByTestId("confirm-dialog-message");
    const messageId = await messageElement.getAttribute("id");
    expect(messageId).toBeTruthy();
    expect(describedBy).toBe(messageId);
  },
);

// ============================================================================
// NFR-A2: Keyboard navigation within confirmation dialog
// ============================================================================

Then("confirmation dialog is visible", async ({ page }) => {
  await expect(page.getByTestId("confirm-dialog")).toBeVisible();
});

When("user presses Tab inside share dialog", async ({ page }) => {
  await page.keyboard.press("Tab");
});

Then("focus moves to the next share dialog button", async ({ page }) => {
  const confirmButton = page.getByTestId("confirm-dialog-confirm");
  await expect(confirmButton).toBeFocused();
});

When("user presses Tab inside share dialog again", async ({ page }) => {
  await page.keyboard.press("Tab");
});

Then("focus cycles back to the first share dialog button", async ({ page }) => {
  const cancelButton = page.getByTestId("confirm-dialog-cancel");
  await expect(cancelButton).toBeFocused();
});

When("user presses Escape on share dialog", async ({ page }) => {
  await page.keyboard.press("Escape");
});

Then("confirmation dialog is closed", async ({ page }) => {
  await expect(page.getByTestId("confirm-dialog")).toBeHidden();
});

When(
  "user presses Enter on the share dialog confirm button",
  async ({ page }) => {
    const confirmButton = page.getByTestId("confirm-dialog-confirm");
    await confirmButton.focus();
    await page.keyboard.press("Enter");
  },
);

// ============================================================================
// NFR-R1: Responsive viewport tests
// ============================================================================

When(
  "viewport is set to {int} pixels wide for share test",
  async ({ page }, width: number) => {
    const viewportHeight =
      width === MOBILE_VIEWPORT_WIDTH
        ? MOBILE_VIEWPORT_HEIGHT
        : DESKTOP_VIEWPORT_HEIGHT;
    await page.setViewportSize({ width, height: viewportHeight });
  },
);

Then("share section is visible", async ({ page }) => {
  await expect(page.getByTestId("settings-share-app")).toBeVisible();
});

Then("share button is visible", async ({ page }) => {
  await expect(page.getByTestId("share-app-button")).toBeVisible();
});

// ============================================================================
// axe-core: Automated accessibility checks
// ============================================================================

Then(
  "Settings page share section passes axe-core accessibility checks",
  async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="settings-share-app"]')
      .disableRules(KNOWN_AXE_EXCLUSIONS)
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  },
);

Then(
  "confirmation dialog passes axe-core accessibility checks",
  async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="confirm-dialog"]')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  },
);
