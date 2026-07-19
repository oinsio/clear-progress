// Shared UI interaction helpers for integration tests: task actions.
// Eliminates duplication of common create / open / update / delete sequences.
// Split from page-actions.ts (process-invariants file-size cap).
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

/**
 * Updates a task's description from the task detail panel.
 * `EditableDescription` is click-to-edit: at rest it renders a div, and only
 * becomes a textarea after being clicked. Saving happens on blur.
 */
export async function updateTaskDescription(
  page: Page,
  newDescription: string,
): Promise<void> {
  const descriptionField = page.getByTestId("task-detail-description");
  await descriptionField.click();
  await descriptionField.fill(newDescription);
  await descriptionField.blur();
}

/**
 * Hides a non-recurring task until the given ISO date via the task detail
 * panel's "Hide until" drill-down row. Assumes the task detail panel is
 * already open (see `openTaskDetail`).
 * Implements FR2 of fix-stale-sync-overwrites.
 */
export async function hideTaskUntil(
  page: Page,
  appearDateIso: string,
): Promise<void> {
  await page
    .getByTestId("task-detail-panel")
    .getByRole("button", { name: /hide until/i })
    .click();
  const hidePanel = page.getByTestId("hide-task-panel");
  await hidePanel.waitFor({ state: "visible" });
  await hidePanel.getByLabel(/select date/i).fill(appearDateIso);
  await hidePanel.getByRole("button", { name: /^hide$/i }).click();
  await hidePanel.waitFor({ state: "hidden" });
}

/**
 * Manually unhides a task before its appear_date via the task detail panel's
 * "Hide until" drill-down row, which shows the unhide control while the task
 * is hidden. Assumes the task detail panel is already open.
 * Implements FR2 of fix-stale-sync-overwrites.
 */
export async function unhideTask(page: Page): Promise<void> {
  await page
    .getByTestId("task-detail-panel")
    .getByRole("button", { name: /hide until/i })
    .click();
  const hidePanel = page.getByTestId("hide-task-panel");
  await hidePanel.waitFor({ state: "visible" });
  await hidePanel.getByRole("button", { name: /unhide/i }).click();
  await hidePanel.waitFor({ state: "hidden" });
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

const DRAG_STEPS = 12;
const DRAG_SETTLE_MS = 300;

/**
 * Drags a task item (by its drag handle) vertically onto another task
 * item's position, using low-level mouse events so dnd-kit's PointerSensor
 * (activation distance 8px) reliably picks up the gesture.
 */
export async function dragTaskOnto(
  page: Page,
  sourceTaskName: string,
  targetTaskName: string,
): Promise<void> {
  // Match the drag handle by its exact accessible label — a substring/regex
  // like /drag/i would also match a task whose name contains "drag"
  // (e.g. "Rebalance Dragged"), whose body button carries the name as its
  // accessible name, triggering a strict-mode violation.
  const sourceHandle = findTaskItem(page, sourceTaskName).getByRole("button", {
    name: "Drag task",
    exact: true,
  });
  const targetItem = findTaskItem(page, targetTaskName);
  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await targetItem.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error("dragTaskOnto: could not resolve bounding boxes");
  }
  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let step = 1; step <= DRAG_STEPS; step++) {
    const progress = step / DRAG_STEPS;
    await page.mouse.move(
      startX + (endX - startX) * progress,
      startY + (endY - startY) * progress,
    );
  }
  await page.mouse.up();
  await page.waitForTimeout(DRAG_SETTLE_MS);
}
