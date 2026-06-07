// Shared UI interaction helpers for integration tests.
// Eliminates duplication of common create / open / update / delete sequences.
import type { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Task actions (assumes page is on /tasks)
// ---------------------------------------------------------------------------

export async function createTask(page: Page, taskName: string): Promise<void> {
  // If box filter is present (Active Tasks page), select "today" to ensure
  // the task is created in a visible box (defaultBox may be "inbox").
  const filterToggle = page.getByTestId("command-bar-filter-toggle");
  if (await filterToggle.isVisible()) {
    await filterToggle.click();
    await page.getByTestId("box-filter-today").click();
  }

  const textarea = page.getByTestId("command-bar-textarea");
  await textarea.click();
  await textarea.fill(taskName);
  await textarea.press("Enter");
}

export function findTaskItem(page: Page, taskName: string) {
  return page.locator('[data-testid="task-item"]').filter({
    has: page.locator('[data-testid="task-item-name"]', {
      hasText: taskName,
    }),
  });
}

export async function openTaskDetail(
  page: Page,
  taskName: string,
): Promise<void> {
  await findTaskItem(page, taskName)
    .locator('[data-testid="task-item-body"]')
    .click();
  await page.waitForSelector('[data-testid="task-detail-panel"]');
}

export async function updateTaskName(
  page: Page,
  newName: string,
): Promise<void> {
  await page.getByTestId("task-detail-name").fill(newName);
  await page.getByTestId("task-detail-name").blur();
}

export async function deleteTaskFromDetail(page: Page): Promise<void> {
  await page
    .getByTestId("task-detail-panel")
    .getByRole("button", { name: /delete task/i })
    .click();
  await page.waitForSelector('[data-testid="task-detail-delete-confirm-btn"]');
  await page.getByTestId("task-detail-delete-confirm-btn").click();
  await page.waitForSelector('[data-testid="task-detail-panel"]', {
    state: "detached",
  });
}

// ---------------------------------------------------------------------------
// Checklist actions
// ---------------------------------------------------------------------------

export async function switchToChecklistTab(page: Page): Promise<void> {
  await page.getByTestId("tab-checklist").click();
}

export async function addChecklistItem(
  page: Page,
  itemName: string,
): Promise<void> {
  const checklistInput = page
    .getByTestId("task-detail-panel")
    .locator('input[type="text"]');
  await checklistInput.fill(itemName);
  await checklistInput.press("Enter");
  await page
    .getByTestId("task-detail-panel")
    .locator(`text=${itemName}`)
    .waitFor({ state: "visible" });
}

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

// ---------------------------------------------------------------------------
// Attachment actions
// ---------------------------------------------------------------------------

export async function deleteFirstAttachment(page: Page): Promise<void> {
  await page.locator('[data-testid^="attachment-delete-"]').first().click();
  const confirmButton = page.getByTestId("confirm-dialog-confirm");
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }
}

export async function attachFileToEntity(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> {
  await page.getByTestId("tab-attachments").click();
  await page.getByTestId("attach-file-input").setInputFiles(file);
  await page
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .waitFor({ state: "visible" });
}
