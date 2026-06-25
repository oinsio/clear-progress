// Verifies FR18 of swipeable-item
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { performSwipeRight } from "../../../e2e/helpers/swipe-gesture";

const { Given, When, Then } = createBdd();

const DELETED_PAGE_URL = "/deleted";
const DELETED_TASK_NAME = "E2E deleted task for swipe restore";
const SEED_WAIT_TIMEOUT_MS = 5000;
const DISAPPEAR_TIMEOUT_MS = 5000;
const DB_NAME = "clear-progress";

// ============================================================================
// Helpers
// ============================================================================

async function seedDeletedTask(page: Page): Promise<void> {
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
            is_deleted: true,
            created_at: now,
            updated_at: now,
            revision: 0,
            needsSync: false,
          });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      });
    },
    { dbName: DB_NAME, taskName: DELETED_TASK_NAME },
  );
}

// ============================================================================
// Background
// ============================================================================

// Verifies FR18 of swipeable-item
Given("user has a deleted task in the database", async ({ page }) => {
  // Navigate first to initialize the DB, then seed
  await page.goto(DELETED_PAGE_URL);
  // Dismiss onboarding dialog if shown
  await page.evaluate(() => {
    localStorage.setItem("onboarding_shown", "true");
  });
  await seedDeletedTask(page);
});

// ============================================================================
// FR18: Swipe restore scenario
// ============================================================================

// Verifies FR18, FR21 of swipeable-item
Given("user navigates to the deleted page", async ({ page }) => {
  await page.goto(DELETED_PAGE_URL);
  await page
    .locator('[data-testid="deleted-page"]')
    .waitFor({ state: "visible", timeout: SEED_WAIT_TIMEOUT_MS });
  // Wait for Dexie liveQuery to pick up seeded data and render items
  await page
    .locator('[data-testid="swipeable-container"]')
    .first()
    .waitFor({ state: "visible", timeout: SEED_WAIT_TIMEOUT_MS });
});

// Verifies FR18 of swipeable-item
When("user swipes right on the deleted task item", async ({ page }) => {
  await performSwipeRight(page, "swipeable-container");
});

// Verifies FR18 of swipeable-item
Then("the task disappears from the deleted list", async ({ page }) => {
  await expect(page.getByText(DELETED_TASK_NAME)).not.toBeVisible({
    timeout: DISAPPEAR_TIMEOUT_MS,
  });
});

// ============================================================================
// NFR-A1: Accessible restore button
// ============================================================================

// Verifies NFR-A1 of swipeable-item
Then(
  "each deleted item has a restore button with accessible label",
  async ({ page }) => {
    const restoreButtons = page.locator('button[aria-label*="restore" i]');
    const buttonCount = await restoreButtons.count();
    expect(buttonCount).toBeGreaterThan(0);

    for (let index = 0; index < buttonCount; index++) {
      await expect(restoreButtons.nth(index)).toHaveAttribute(
        "aria-label",
        /.+/,
      );
    }
  },
);
