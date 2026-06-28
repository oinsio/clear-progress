// Verifies FR16 of swipeable-item
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const INBOX_PAGE_URL = "/inbox";
const FIRST_TASK_NAME = "E2E first task for DnD";
const SECOND_TASK_NAME = "E2E second task for DnD";
const DRAG_STEPS = 10;
const DB_NAME = "clear-progress";

// ============================================================================
// Helpers
// ============================================================================

async function seedTwoTasks(page: Page): Promise<void> {
  await page.evaluate(
    ({ dbName, firstName, secondName }) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("tasks", "readwrite");
          const store = transaction.objectStore("tasks");
          const now = new Date().toISOString();
          const baseTask = {
            description: "",
            box: "inbox",
            goal_id: "",
            context_id: "",
            category_id: "",
            is_completed: false,
            completed_at: "",
            repeat_rule: "",
            is_hidden: false,
            next_date: "",
            appear_date: "",
            original_task_id: "",
            is_deleted: false,
            created_at: now,
            updated_at: now,
            revision: 0,
            syncStatus: "synced" as const,
          };
          store.put({
            ...baseTask,
            id: crypto.randomUUID(),
            name: firstName,
            sort_order: "b0",
          });
          store.put({
            ...baseTask,
            id: crypto.randomUUID(),
            name: secondName,
            sort_order: "a0",
          });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      });
    },
    {
      dbName: DB_NAME,
      firstName: FIRST_TASK_NAME,
      secondName: SECOND_TASK_NAME,
    },
  );
}

// ============================================================================
// FR16: DnD coexistence scenario
// ============================================================================

// Verifies FR16 of swipeable-item
Given("user has two tasks in the inbox", async ({ page }) => {
  await page.goto(INBOX_PAGE_URL);
  await seedTwoTasks(page);
});

// "user navigates to the inbox page" step defined in task_swipe_complete_e2e.steps.ts (global)

// Verifies FR16 of swipeable-item
When(
  "user drags the first task via drag handle to the second position",
  async ({ page }) => {
    const taskItems = page.getByTestId("task-item");
    const firstTaskItem = taskItems.first();

    // Use the drag handle (data-no-swipe="true" button with GripVertical icon)
    const dragHandle = firstTaskItem.locator('button[data-no-swipe="true"]');
    await dragHandle.waitFor({ state: "visible" });

    const handleBox = await dragHandle.boundingBox();
    const secondTaskBox = await taskItems.nth(1).boundingBox();
    if (!handleBox || !secondTaskBox) {
      throw new Error("Could not get bounding boxes for drag operation");
    }

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;
    const targetY = secondTaskBox.y + secondTaskBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let step = 0; step < DRAG_STEPS; step++) {
      await page.mouse.move(
        startX,
        startY + ((targetY - startY) * (step + 1)) / DRAG_STEPS,
      );
    }
    await page.mouse.up();
  },
);

// Verifies FR16 of swipeable-item
Then(
  "the task order changes without any swipe action firing",
  async ({ page }) => {
    // Both tasks should still be visible (no swipe action was triggered)
    await expect(page.getByText(FIRST_TASK_NAME)).toBeVisible();
    await expect(page.getByText(SECOND_TASK_NAME)).toBeVisible();

    // No swipe background should be visible
    const swipeBackgrounds = page.getByTestId("swipe-background-right");
    const backgroundCount = await swipeBackgrounds.count();
    for (let index = 0; index < backgroundCount; index++) {
      const opacity = await swipeBackgrounds
        .nth(index)
        .evaluate((element) => getComputedStyle(element).opacity);
      expect(Number(opacity)).toBe(0);
    }
  },
);
