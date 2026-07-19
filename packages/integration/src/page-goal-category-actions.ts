// Shared UI interaction helpers for integration tests: goal and category actions.
// Split from page-actions.ts (process-invariants file-size cap).
import type { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Goal actions
// ---------------------------------------------------------------------------

export async function navigateToGoals(page: Page): Promise<void> {
  await page.goto("/goals");
  await page.waitForSelector('[data-testid="goals-page"]');
}

export async function createGoal(page: Page, goalName: string): Promise<void> {
  const textarea = page.getByTestId("command-bar-textarea");
  await textarea.click();
  await textarea.fill(goalName);
  await textarea.press("Enter");
  await page
    .locator('[data-testid="goal-item"]')
    .filter({ has: page.locator(`text=${goalName}`) })
    .waitFor({ state: "visible" });
}

export async function openGoalDetail(
  page: Page,
  goalName: string,
): Promise<void> {
  await page
    .locator('[data-testid="goal-item"]')
    .filter({ has: page.locator(`text=${goalName}`) })
    .locator('[data-testid="goal-navigate-button"]')
    .click();
  await page.waitForSelector('[data-testid="goal-detail-page"]');
}

export async function updateGoalName(
  page: Page,
  newName: string,
): Promise<void> {
  await page.getByTestId("edit-goal-button").click();
  await page.getByTestId("goal-name-input").fill(newName);
  await page.getByTestId("goal-save-button").click();
  await page.getByTestId("edit-goal-button").waitFor({ state: "visible" });
}

export async function deleteGoalFromDetail(page: Page): Promise<void> {
  await page.getByTestId("edit-goal-button").click();
  await page.getByTestId("goal-delete-button").click();
  await page.waitForSelector('[data-testid="goal-delete-confirm"]');
  await page.getByTestId("goal-delete-confirm-btn").click();
  await page.waitForSelector('[data-testid="goals-page"]');
}

export async function uploadCoverToGoal(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> {
  await page.getByTestId("edit-goal-button").click();
  await page.getByTestId("cover-file-input").setInputFiles(file);
  await page.getByTestId("cover-preview-img").waitFor({ state: "visible" });
  await page.getByTestId("goal-save-button").click();
  await page.getByTestId("edit-goal-button").waitFor({ state: "visible" });
}

export async function removeCoverFromGoal(page: Page): Promise<void> {
  await page.getByTestId("edit-goal-button").click();
  await page.getByTestId("cover-remove-button").click();
  await page.getByTestId("goal-save-button").click();
  await page.getByTestId("edit-goal-button").waitFor({ state: "visible" });
}

// ---------------------------------------------------------------------------
// Category actions
// ---------------------------------------------------------------------------

export async function navigateToCategories(page: Page): Promise<void> {
  await page.goto("/categories");
  await page.waitForSelector('[data-testid="categories-page"]');
}

export async function createCategory(
  page: Page,
  categoryName: string,
): Promise<void> {
  const textarea = page.getByTestId("command-bar-textarea");
  await textarea.click();
  await textarea.fill(categoryName);
  await textarea.press("Enter");
  await page.locator(`text=${categoryName}`).waitFor({ state: "visible" });
}

export async function openCategoryDetail(
  page: Page,
  categoryName: string,
): Promise<void> {
  await page.locator(`text=${categoryName}`).click();
  await page.waitForSelector('[data-testid="category-detail-page"]');
}

export async function updateCategoryName(
  page: Page,
  newName: string,
): Promise<void> {
  await page.getByTestId("category-edit-btn").click();
  await page.getByTestId("category-name-input").fill(newName);
  await page.getByTestId("category-save-btn").click();
}

export async function deleteCategoryFromDetail(page: Page): Promise<void> {
  await page.getByTestId("category-edit-btn").click();
  await page.getByTestId("category-delete-btn").click();
  await page.getByTestId("category-delete-confirm-btn").click();
  await page.waitForSelector('[data-testid="categories-page"]');
}
