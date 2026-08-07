// Verifies NFR-A1 of fix-completed-today-stale-on-day-rollover
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

// ============================================================================
// Helpers
// ============================================================================

const TASKS_PAGE_URL = "/tasks";
const COMPLETED_PAGE_URL = "/completed";
const ACTIVE_TASKS_PAGE_TEST_ID = "active-tasks-page";
const COMPLETED_PAGE_TEST_ID = "completed-page";
const YESTERDAY_SECTION_TEST_ID = "task-section-completed_yesterday";
const COMPLETED_TODAY_TASK_NAME = "E2E task completed today";
const DB_NAME = "clear-progress";
const SEED_WAIT_TIMEOUT_MS = 5000;

// Fixed midday instant so the seeded task lands squarely inside "today", and a
// +24h jump crosses exactly one day boundary regardless of the runner timezone.
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BASE_TIME_ISO = "2026-08-07T12:00:00.000Z";
const BASE_TIME_MS = Date.parse(BASE_TIME_ISO);

// Freeze the clock before the app boots so both the seeded completed_at and the
// logical-today snapshot start at BASE_TIME_MS.
async function freezeClockAtBaseTime(page: Page): Promise<void> {
  await page.clock.setFixedTime(BASE_TIME_MS);
}

// Advance the clock past the next midnight and nudge the app the same way a
// back-grounded tab is nudged on return, so logicalTodayStore recomputes in
// place — no navigation, no remount.
async function crossDayBoundaryInPlace(page: Page): Promise<void> {
  await page.clock.setFixedTime(BASE_TIME_MS + ONE_DAY_MS);
  await page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

async function seedCompletedTodayTask(page: Page): Promise<void> {
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
            is_completed: true,
            completed_at: now,
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
    { dbName: DB_NAME, taskName: COMPLETED_TODAY_TASK_NAME },
  );
}

// ============================================================================
// Background
// ============================================================================

// Verifies NFR-A1 of fix-completed-today-stale-on-day-rollover
Given(
  "user is on the active tasks page with a task completed today",
  async ({ page }) => {
    await freezeClockAtBaseTime(page);
    await page.goto(TASKS_PAGE_URL);
    await seedCompletedTodayTask(page);
    await page.reload();
    await page
      .getByTestId(ACTIVE_TASKS_PAGE_TEST_ID)
      .waitFor({ state: "visible", timeout: SEED_WAIT_TIMEOUT_MS });
    await expect(page.getByText(COMPLETED_TODAY_TASK_NAME)).toBeVisible();
  },
);

// Verifies NFR-A1 of fix-completed-today-stale-on-day-rollover
Given(
  "user is on the completed page with a task completed today",
  async ({ page }) => {
    await freezeClockAtBaseTime(page);
    await page.goto(COMPLETED_PAGE_URL);
    await seedCompletedTodayTask(page);
    await page.reload();
    await page
      .getByTestId(COMPLETED_PAGE_TEST_ID)
      .waitFor({ state: "visible", timeout: SEED_WAIT_TIMEOUT_MS });
    await expect(page.getByText(COMPLETED_TODAY_TASK_NAME)).toBeVisible();
  },
);

// ============================================================================
// Rollover trigger + regrouping assertions
// ============================================================================

// Verifies NFR-A1 of fix-completed-today-stale-on-day-rollover
When("the day boundary passes without navigation", async ({ page }) => {
  await crossDayBoundaryInPlace(page);
});

// Verifies NFR-A1 of fix-completed-today-stale-on-day-rollover
Then('the task is no longer shown in "completed today"', async ({ page }) => {
  await expect(page.getByText(COMPLETED_TODAY_TASK_NAME)).toBeHidden();
});

// Verifies NFR-A1 of fix-completed-today-stale-on-day-rollover
Then("the task is regrouped from today into yesterday", async ({ page }) => {
  await expect(page.getByTestId(YESTERDAY_SECTION_TEST_ID)).toBeVisible();
  await expect(page.getByText(COMPLETED_TODAY_TASK_NAME)).toBeVisible();
});

// ============================================================================
// NFR-A1: axe-core checks
// ============================================================================

// Verifies NFR-A1 of fix-completed-today-stale-on-day-rollover
Then(
  "the active tasks page passes axe-core accessibility checks",
  async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include(`[data-testid="${ACTIVE_TASKS_PAGE_TEST_ID}"]`)
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  },
);

// Verifies NFR-A1 of fix-completed-today-stale-on-day-rollover
Then(
  "the completed page passes axe-core accessibility checks",
  async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include(`[data-testid="${COMPLETED_PAGE_TEST_ID}"]`)
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  },
);
