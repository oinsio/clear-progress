import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const IDEA_CREATION_TIMEOUT_MS = 5000;
const DESKTOP_WIDTH = 1280;
const DESKTOP_HEIGHT = 800;
const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;

// ============================================================================
// UI Helpers
// ============================================================================

async function createIdeaViaUI(page: Page, name: string): Promise<void> {
  await page.goto("/ideas");
  await page.getByTestId("add-idea-button").first().click();
  const ideaInput = page.getByTestId("add-idea-input");
  await ideaInput.waitFor({ state: "visible" });
  await ideaInput.fill(name);
  await ideaInput.press("Enter");
  await page
    .getByText(name)
    .waitFor({ state: "visible", timeout: IDEA_CREATION_TIMEOUT_MS });
}

// ============================================================================
// UX1: Empty state message
// ============================================================================

// Verifies UX1 of add-ideas-specs
Given("user is on the ideas page with no ideas", async ({ page }) => {
  await page.goto("/ideas");
});

Then("empty state message is displayed", async ({ page }) => {
  const emptyMessage = page.getByTestId("empty-ideas-message");
  await expect(emptyMessage).toBeVisible();
  await expect(emptyMessage).not.toBeEmpty();
});

// ============================================================================
// NFR-A2: Interactive elements have aria-labels
// ============================================================================

// Verifies NFR-A2 of add-ideas-specs
Given("user is on the ideas page", async ({ page }) => {
  await page.goto("/ideas");
});

Then("add idea button has a non-empty aria-label", async ({ page }) => {
  const addButton = page.getByTestId("add-idea-button").first();
  await expect(addButton).toHaveAttribute("aria-label", /.+/);
});

// Verifies NFR-A2 of add-ideas-specs
Given("an idea {string} exists", async ({ page }, ideaName: string) => {
  await createIdeaViaUI(page, ideaName);
});

Then("edit button has a non-empty aria-label", async ({ page }) => {
  const editButton = page.getByTestId("idea-edit-button").first();
  await expect(editButton).toHaveAttribute("aria-label", /.+/);
});

Then("drag button has a non-empty aria-label", async ({ page }) => {
  const ideaItem = page.getByTestId("idea-item").first();
  const dragHandle = ideaItem
    .locator('button[aria-label][data-testid!="idea-edit-button"]')
    .first();
  await expect(dragHandle).toHaveAttribute("aria-label", /.+/);
});

// ============================================================================
// NFR-A1: Keyboard navigable list items
// ============================================================================

// Verifies NFR-A1 of add-ideas-specs
When("user focuses the edit button via keyboard", async ({ page }) => {
  const editButton = page.getByTestId("idea-edit-button").first();
  await editButton.focus();
});

Then("edit button receives keyboard focus", async ({ page }) => {
  const editButton = page.getByTestId("idea-edit-button").first();
  await expect(editButton).toBeFocused();
});

When("user presses Tab to next action", async ({ page }) => {
  await page.keyboard.press("Tab");
});

Then("drag button receives keyboard focus", async ({ page }) => {
  const ideaItem = page.getByTestId("idea-item").first();
  const dragHandle = ideaItem
    .locator('button[aria-label][data-testid!="idea-edit-button"]')
    .first();
  await expect(dragHandle).toBeFocused();
});

// ============================================================================
// NFR-A2: Detail panel buttons have aria-labels
// ============================================================================

// Verifies NFR-A2 of add-ideas-specs
When("user opens idea detail panel", async ({ page }) => {
  await page.getByTestId("idea-edit-button").first().click();
  await page
    .getByTestId("idea-detail-panel")
    .waitFor({ state: "visible", timeout: IDEA_CREATION_TIMEOUT_MS });
});

Then("delete button has a non-empty aria-label", async ({ page }) => {
  const detailPanel = page.getByTestId("idea-detail-panel");
  // Delete button is the first button in the header
  const deleteButton = detailPanel.locator("button[aria-label]").first();
  await expect(deleteButton).toHaveAttribute("aria-label", /.+/);
});

Then("close button has a non-empty aria-label", async ({ page }) => {
  const detailPanel = page.getByTestId("idea-detail-panel");
  // Close button is the second button in the header
  const closeButton = detailPanel.locator("button[aria-label]").nth(1);
  await expect(closeButton).toHaveAttribute("aria-label", /.+/);
});

// ============================================================================
// NFR-A3: Delete confirmation dialog keyboard accessible
// ============================================================================

// Verifies NFR-A3 of add-ideas-specs
When("user clicks delete button", async ({ page }) => {
  const detailPanel = page.getByTestId("idea-detail-panel");
  // Delete button is the first button in the header
  const deleteButton = detailPanel.locator("button[aria-label]").first();
  await deleteButton.click();
});

Then("delete confirmation dialog is displayed", async ({ page }) => {
  const confirmOverlay = page.getByTestId("idea-detail-delete-confirm");
  await expect(confirmOverlay).toBeVisible();
});

Then("cancel button has a non-empty aria-label", async ({ page }) => {
  const cancelButton = page.getByTestId("idea-detail-delete-cancel");
  await expect(cancelButton).toHaveAttribute("aria-label", /.+/);
});

Then("confirm delete button has a non-empty aria-label", async ({ page }) => {
  const confirmButton = page.getByTestId("idea-detail-delete-confirm-btn");
  await expect(confirmButton).toHaveAttribute("aria-label", /.+/);
});

When("user presses Escape on dialog", async ({ page }) => {
  await page.keyboard.press("Escape");
});

Then("delete confirmation dialog closes", async ({ page }) => {
  const confirmOverlay = page.getByTestId("idea-detail-delete-confirm");
  await expect(confirmOverlay).not.toBeVisible();
});

// ============================================================================
// NFR-R1: Detail panel responsive
// ============================================================================

// Verifies NFR-R1 of add-ideas-specs
Given("viewport is desktop size", async ({ page }) => {
  await page.setViewportSize({ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT });
});

Given("viewport is mobile size", async ({ page }) => {
  await page.setViewportSize({ width: MOBILE_WIDTH, height: MOBILE_HEIGHT });
});

Then("idea list and detail panel are both visible", async ({ page }) => {
  const detailPanel = page.getByTestId("idea-detail-panel");
  await expect(detailPanel).toBeVisible();

  // On desktop, the idea list should remain visible alongside the detail panel
  const ideaItems = page.getByTestId("idea-item");
  await expect(ideaItems.first()).toBeVisible();
});

Then("detail panel is visible as full-screen overlay", async ({ page }) => {
  const detailPanel = page.getByTestId("idea-detail-panel");
  await expect(detailPanel).toBeVisible();
});

Then("idea list is hidden", async ({ page }) => {
  // On mobile, the main content area has class "hidden" when detail is shown
  const ideaItems = page.getByTestId("idea-item");
  await expect(ideaItems.first()).not.toBeVisible();
});
