// Verifies FR2, FR3, NFR-A1, NFR-A2, NFR-R1 of onboarding-goal
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const DIALOG_TIMEOUT_MS = 5000;
const NAVIGATION_TIMEOUT_MS = 5000;

// ============================================================================
// Background: user is a first-time visitor
// ============================================================================

Given("user is a first-time visitor", async ({ page }) => {
  await page.goto("/");
  await page
    .getByTestId("onboarding-dialog")
    .waitFor({ state: "visible", timeout: DIALOG_TIMEOUT_MS });
});

// ============================================================================
// FR2: Accept flow creates onboarding goal and tasks
// ============================================================================

Then("onboarding dialog is visible", async ({ page }) => {
  const dialog = page.getByTestId("onboarding-dialog");
  await expect(dialog).toBeVisible();
});

When("user accepts onboarding", async ({ page }) => {
  await page.getByTestId("onboarding-dialog-accept").click();
});

Then("onboarding dialog is dismissed", async ({ page }) => {
  const dialog = page.getByTestId("onboarding-dialog");
  await expect(dialog).not.toBeVisible();
});

Then("onboarding goal is visible on the goals page", async ({ page }) => {
  await page.goto("/goals");
  const goalName = page.getByText("Get to know Clear Progress");
  await goalName.waitFor({
    state: "visible",
    timeout: NAVIGATION_TIMEOUT_MS,
  });
  await expect(goalName).toBeVisible();
});

// ============================================================================
// FR3: Decline flow skips onboarding
// ============================================================================

When("user declines onboarding", async ({ page }) => {
  await page.getByTestId("onboarding-dialog-decline").click();
});

Then("no onboarding goal exists on the goals page", async ({ page }) => {
  await page.goto("/goals");
  await page.waitForTimeout(1000);
  const goalName = page.getByText("Get to know Clear Progress");
  await expect(goalName).not.toBeVisible();
});

// ============================================================================
// NFR-A1: Dialog has proper ARIA attributes
// ============================================================================

Then(
  "onboarding dialog has role {string}",
  async ({ page }, expectedRole: string) => {
    const dialog = page.getByTestId("onboarding-dialog");
    await expect(dialog).toHaveAttribute("role", expectedRole);
  },
);

Then(
  "onboarding dialog has aria-modal set to {string}",
  async ({ page }, expectedValue: string) => {
    const dialog = page.getByTestId("onboarding-dialog");
    await expect(dialog).toHaveAttribute("aria-modal", expectedValue);
  },
);

Then("onboarding dialog has a non-empty aria-labelledby", async ({ page }) => {
  const dialog = page.getByTestId("onboarding-dialog");
  await expect(dialog).toHaveAttribute("aria-labelledby", /.+/);
});

Then("onboarding dialog has a non-empty aria-describedby", async ({ page }) => {
  const dialog = page.getByTestId("onboarding-dialog");
  await expect(dialog).toHaveAttribute("aria-describedby", /.+/);
});

// ============================================================================
// NFR-A2: Focus trap cycles between dialog buttons
// ============================================================================

Then("accept button receives initial focus", async ({ page }) => {
  const acceptButton = page.getByTestId("onboarding-dialog-accept");
  await expect(acceptButton).toBeFocused();
});

When("user presses Tab", async ({ page }) => {
  await page.keyboard.press("Tab");
});

Then("decline button receives focus", async ({ page }) => {
  const declineButton = page.getByTestId("onboarding-dialog-decline");
  await expect(declineButton).toBeFocused();
});

Then("accept button receives focus again", async ({ page }) => {
  const acceptButton = page.getByTestId("onboarding-dialog-accept");
  await expect(acceptButton).toBeFocused();
});

// ============================================================================
// NFR-A2: Keyboard activation of accept button
// ============================================================================

When("user presses Enter", async ({ page }) => {
  await page.keyboard.press("Enter");
});

// ============================================================================
// NFR-A1: Escape key closes dialog as decline
// ============================================================================

When("user presses Escape key", async ({ page }) => {
  await page.keyboard.press("Escape");
});

// ============================================================================
// NFR-A1, NFR-A2: axe-core accessibility checks
// ============================================================================

Then(
  "onboarding dialog passes axe-core accessibility checks",
  async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="onboarding-dialog"]')
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  },
);
