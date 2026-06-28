// Verifies FR17 of swipeable-item
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

import { performSwipeRight } from "../../../e2e/helpers/swipe-gesture";

const { Given, When, Then } = createBdd();

const INBOX_PAGE_URL = "/inbox";
const ACTIVE_TASK_NAME = "E2E task for swipe complete";
const SEED_WAIT_TIMEOUT_MS = 5000;
const COMPLETION_TIMEOUT_MS = 5000;
const DB_NAME = "clear-progress";

// ============================================================================
// Helpers
// ============================================================================

async function seedActiveTask(page: Page): Promise<void> {
  await page.evaluate(
    ({ dbName, taskName }) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("tasks", "readwrite");
          const store = transaction.objectStore("tasks");
          const now = new Date().toISOString();
          store.put({
            id: crypto.randomUUID(),
            name: taskName,
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
            sort_order: "a0",
            is_deleted: false,
            created_at: now,
            updated_at: now,
            revision: 0,
            syncStatus: "synced" as const,
          });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      });
    },
    { dbName: DB_NAME, taskName: ACTIVE_TASK_NAME },
  );
}

// ============================================================================
// Background
// ============================================================================

// Verifies FR17 of swipeable-item
Given("user has an active task in the inbox", async ({ page }) => {
  await page.goto(INBOX_PAGE_URL);
  await seedActiveTask(page);
});

// ============================================================================
// FR17: Swipe complete scenario
// ============================================================================

// Verifies FR17, FR16 of swipeable-item
Given("user navigates to the inbox page", async ({ page }) => {
  await page.goto(INBOX_PAGE_URL);
  await page
    .locator('[data-testid="task-list"]')
    .waitFor({ state: "visible", timeout: SEED_WAIT_TIMEOUT_MS });
});

// Verifies FR17 of swipeable-item
When("user swipes right on the task item", async ({ page }) => {
  await performSwipeRight(page, "swipeable-container");
});

// Verifies FR17 of swipeable-item
Then("the task is marked as completed", async ({ page }) => {
  // After swipe-to-complete, the task should disappear from active inbox
  await expect(page.getByText(ACTIVE_TASK_NAME)).not.toBeVisible({
    timeout: COMPLETION_TIMEOUT_MS,
  });
});
