// Verifies FR21 of swipeable-item

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

const DELETED_PAGE_URL = "/deleted";
const DELETED_IDEA_NAME = "E2E deleted idea for section test";
const IDEA_WAIT_TIMEOUT_MS = 5000;
const DB_NAME = "clear-progress";

// ============================================================================
// Helpers
// ============================================================================

async function seedDeletedIdea(page: Page): Promise<void> {
  await page.evaluate(
    ({ dbName, ideaName }) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("ideas", "readwrite");
          const store = transaction.objectStore("ideas");
          const now = new Date().toISOString();
          store.put({
            id: crypto.randomUUID(),
            name: ideaName,
            description: "",
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
    { dbName: DB_NAME, ideaName: DELETED_IDEA_NAME },
  );
}

// ============================================================================
// Background
// ============================================================================

// Verifies FR21 of swipeable-item
Given("user has a deleted idea in the database", async ({ page }) => {
  // Navigate first to initialize the DB, then seed
  await page.goto(DELETED_PAGE_URL);
  // Dismiss onboarding dialog if shown
  await page.evaluate(() => {
    localStorage.setItem("onboarding_shown", "true");
  });
  await seedDeletedIdea(page);
});

// ============================================================================
// FR21: Ideas section visibility
// ============================================================================

// Verifies FR21 of swipeable-item
Then("the Ideas section is visible with the deleted idea", async ({ page }) => {
  const ideaText = page.getByText(DELETED_IDEA_NAME);
  await ideaText.waitFor({ state: "visible", timeout: IDEA_WAIT_TIMEOUT_MS });
  await expect(ideaText).toBeVisible();
});
