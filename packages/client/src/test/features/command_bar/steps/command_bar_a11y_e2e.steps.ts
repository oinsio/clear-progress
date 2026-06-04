// Verifies NFR-A1, NFR-A2, NFR-A3, NFR-A4, NFR-A5 of command-bar
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const COMMAND_BAR_TIMEOUT_MS = 3000;

// ============================================================================
// Background: user is on a page with full CommandBar configuration
// ============================================================================

Given(
  "user is on a page with full CommandBar configuration",
  async ({ page }) => {
    await page.goto("/tasks");
    await page
      .getByTestId("command-bar")
      .waitFor({ state: "visible", timeout: COMMAND_BAR_TIMEOUT_MS });
  },
);

// ============================================================================
// NFR-A1: All interactive elements have aria-labels
// ============================================================================

Then("filter toggle has a non-empty aria-label", async ({ page }) => {
  const filterToggle = page.getByTestId("command-bar-filter-toggle");
  await expect(filterToggle).toHaveAttribute("aria-label", /.+/);
});

Then("box buttons have non-empty aria-labels", async ({ page }) => {
  // Expand the filter first to reveal box buttons
  await page.getByTestId("command-bar-filter-toggle").click();
  const filterArea = page.getByTestId("command-bar-filter-area");
  await filterArea.waitFor({ state: "visible" });

  const boxButtons = filterArea.locator("button[aria-label]");
  const buttonCount = await boxButtons.count();
  expect(buttonCount).toBeGreaterThan(0);

  for (let buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++) {
    await expect(boxButtons.nth(buttonIndex)).toHaveAttribute(
      "aria-label",
      /.+/,
    );
  }
});

Then("eye toggle has a non-empty aria-label", async ({ page }) => {
  const eyeToggle = page.getByTestId("command-bar-eye-toggle");
  await expect(eyeToggle).toHaveAttribute("aria-label", /.+/);
});

Then("create button has a non-empty aria-label", async ({ page }) => {
  const createButton = page.getByTestId("command-bar-create-button");
  await expect(createButton).toHaveAttribute("aria-label", /.+/);
});

Then("textarea has a non-empty aria-label", async ({ page }) => {
  const textarea = page.getByTestId("command-bar-textarea");
  await expect(textarea).toHaveAttribute("aria-label", /.+/);
});

// ============================================================================
// NFR-A2: Filter toggle has aria-expanded attribute
// ============================================================================

Then(
  "filter toggle has aria-expanded set to {string}",
  async ({ page }, expectedValue: string) => {
    const filterToggle = page.getByTestId("command-bar-filter-toggle");
    await expect(filterToggle).toHaveAttribute("aria-expanded", expectedValue);
  },
);

When("user expands the filter", async ({ page }) => {
  await page.getByTestId("command-bar-filter-toggle").click();
  await page
    .getByTestId("command-bar-filter-area")
    .waitFor({ state: "visible" });
});

// ============================================================================
// NFR-A3: Eye toggle has aria-pressed attribute
// ============================================================================

Then(
  "eye toggle has aria-pressed set to {string}",
  async ({ page }, expectedValue: string) => {
    const eyeToggle = page.getByTestId("command-bar-eye-toggle");
    await expect(eyeToggle).toHaveAttribute("aria-pressed", expectedValue);
  },
);

When("user toggles hidden task visibility", async ({ page }) => {
  await page.getByTestId("command-bar-eye-toggle").click();
});

// ============================================================================
// NFR-A4: All buttons are keyboard focusable and activatable
// ============================================================================

When("user navigates to filter toggle via keyboard", async ({ page }) => {
  await page.getByTestId("command-bar-filter-toggle").focus();
});

Then("filter toggle receives keyboard focus", async ({ page }) => {
  const filterToggle = page.getByTestId("command-bar-filter-toggle");
  await expect(filterToggle).toBeFocused();
});

When("user activates filter toggle via keyboard", async ({ page }) => {
  await page.keyboard.press("Enter");
});

Then("filter is expanded", async ({ page }) => {
  const filterArea = page.getByTestId("command-bar-filter-area");
  await expect(filterArea).toBeVisible();
});

When("user navigates to create button via keyboard", async ({ page }) => {
  await page.getByTestId("command-bar-create-button").focus();
});

Then("create button receives keyboard focus", async ({ page }) => {
  const createButton = page.getByTestId("command-bar-create-button");
  await expect(createButton).toBeFocused();
});

// ============================================================================
// NFR-A5: Textarea has appropriate placeholder and role
// ============================================================================

Then("textarea has a visible placeholder text", async ({ page }) => {
  const textarea = page.getByTestId("command-bar-textarea");
  const placeholder = await textarea.getAttribute("placeholder");
  expect(placeholder).toBeTruthy();
  expect(placeholder?.length).toBeGreaterThan(0);
});

Then("textarea has role {string}", async ({ page }, expectedRole: string) => {
  const textarea = page.getByRole(expectedRole as "textbox");
  await expect(textarea.first()).toBeVisible();
});

// ============================================================================
// axe-core: Automated accessibility checks
// ============================================================================

Then("CommandBar passes axe-core accessibility checks", async ({ page }) => {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .include('[data-testid="command-bar"]')
    .analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

Given(
  "user is on a page with minimal CommandBar configuration",
  async ({ page }) => {
    await page.goto("/goals");
    await page
      .getByTestId("command-bar")
      .waitFor({ state: "visible", timeout: COMMAND_BAR_TIMEOUT_MS });
  },
);

Given("user has left-handed mode enabled", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("handedness", "left");
  });
});
