// implements FR6, FR8, FR16 of add-supabase-integration-tests
import { expect, type Page, test } from "@playwright/test";
import {
  closeAuthenticatedPage,
  createAuthenticatedPage,
  triggerSyncAndWait,
} from "../test-helpers.js";

test.describe.configure({ mode: "serial" });

let page: Page;
let accessToken: string;
let supabaseUrl: string;
let anonKey: string;

// State carried between sequential tests (5.2.1 → 5.2.2 → 5.2.3)
let createdTaskName: string;
let createdTaskId: string;

test.beforeAll(async ({ browser: b }) => {
  const auth = await createAuthenticatedPage(b);
  page = auth.page;
  accessToken = auth.accessToken;
  supabaseUrl = auth.supabaseUrl;
  anonKey = auth.anonKey;
});

test.afterAll(async () => {
  await closeAuthenticatedPage(page);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calls the pull Edge Function from Node.js to verify server-side state.
 * Uses since_revision=0 to receive the full dataset.
 */
async function pullFromServer(): Promise<{
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
    is_completed: boolean;
    repeat_rule: string;
  }>;
}> {
  const response = await fetch(`${supabaseUrl}/functions/v1/pull`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ since_revision: 0 }),
  });
  if (!response.ok) {
    throw new Error(`pull failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as Promise<{
    ok: boolean;
    tasks: Array<{
      id: string;
      name: string;
      is_deleted: boolean;
      is_completed: boolean;
      repeat_rule: string;
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// 5.2.1 — Create task locally → push → verify task exists on server
// ---------------------------------------------------------------------------
test("create task locally → push → verify task exists on server", async () => {
  createdTaskName = `Sync Test Task ${Date.now()}`;

  // Add a task via the UI (creates in Today box by default)
  await page.getByTestId("add-task-button").click();
  await page.getByTestId("add-task-input").fill(createdTaskName);
  await page.getByTestId("add-task-input").press("Enter");

  // Trigger push + pull immediately instead of waiting for the 15-second debounce
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  expect(pullResponse.ok).toBe(true);

  const serverTask = pullResponse.tasks.find(
    (task) => task.name === createdTaskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();
  if (!serverTask) return;
  expect(serverTask.is_deleted).toBe(false);

  createdTaskId = serverTask.id;
});

// ---------------------------------------------------------------------------
// 5.2.2 — Modify task (title) locally → push → pull → verify changes
// Builds on 5.2.1: createdTaskName and createdTaskId are set.
// ---------------------------------------------------------------------------
test("modify task title locally → push → verify changes on server", async () => {
  const updatedName = `Updated Task ${Date.now()}`;

  // Click the task item body to open the detail panel (desktop: single click)
  await page
    .locator('[data-testid="task-item"]')
    .filter({
      has: page.locator('[data-testid="task-item-name"]', {
        hasText: createdTaskName,
      }),
    })
    .locator('[data-testid="task-item-body"]')
    .click();

  await page.waitForSelector('[data-testid="task-detail-panel"]');

  // Clear and type the new name
  await page.getByTestId("task-detail-name").fill(updatedName);
  // Blur to commit the change (name is saved on blur)
  await page.getByTestId("task-detail-name").blur();

  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  const serverTask = pullResponse.tasks.find(
    (task) => task.id === createdTaskId,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.name).toBe(updatedName);
  expect(serverTask?.is_deleted).toBe(false);

  // Carry the updated name so 5.2.3 can reference it if needed
  createdTaskName = updatedName;
});

// ---------------------------------------------------------------------------
// 5.2.3 — Soft-delete task locally → push → pull → verify is_deleted=true
// Builds on 5.2.2: task detail panel is open with the updated task.
// ---------------------------------------------------------------------------
test("soft-delete task locally → push → verify is_deleted=true on server", async () => {
  // The task detail panel should still be open from 5.2.2.
  // Click the delete (trash) icon in the panel header.
  await page
    .getByTestId("task-detail-panel")
    .getByRole("button", { name: /delete task/i })
    .click();

  // A confirmation dialog always appears — confirm the deletion.
  await page.waitForSelector('[data-testid="task-detail-delete-confirm-btn"]');
  await page.getByTestId("task-detail-delete-confirm-btn").click();

  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  const serverTask = pullResponse.tasks.find(
    (task) => task.id === createdTaskId,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.is_deleted).toBe(true);
});

// ---------------------------------------------------------------------------
// 5.2.4 — Create recurring task → push → verify repeat_rule persisted
// Starts fresh: does not depend on the deleted task from 5.2.3.
// ---------------------------------------------------------------------------
test("create recurring task → push → verify repeat rule persisted", async () => {
  const recurringTaskName = `Recurring Task ${Date.now()}`;

  // Create a new task
  await page.getByTestId("add-task-button").click();
  await page.getByTestId("add-task-input").fill(recurringTaskName);
  await page.getByTestId("add-task-input").press("Enter");

  // Open the task detail panel
  await page
    .locator('[data-testid="task-item"]')
    .filter({
      has: page.locator('[data-testid="task-item-name"]', {
        hasText: recurringTaskName,
      }),
    })
    .locator('[data-testid="task-item-body"]')
    .click();

  await page.waitForSelector('[data-testid="task-detail-panel"]');

  // Open the Repeat selector — the DrillDownRow button contains label "Repeat"
  await page
    .getByTestId("task-detail-panel")
    .getByRole("button", { name: /Repeat/ })
    .click();

  // Select "Fixed" repeat type — wait for it to appear first
  await page.getByTestId("repeat-type-fixed").waitFor({ state: "visible" });
  await page.getByTestId("repeat-type-fixed").click();

  // Choose daily frequency — wait for frequency options to render
  await page
    .getByTestId("repeat-frequency-daily")
    .waitFor({ state: "visible" });
  await page.getByTestId("repeat-frequency-daily").click();

  // Proceed to placement step
  await page.getByTestId("repeat-fixed-next").waitFor({ state: "visible" });
  await page.getByTestId("repeat-fixed-next").click();

  // Apply the repeat rule (saves and closes selector)
  await page.getByTestId("repeat-apply").waitFor({ state: "visible" });
  await page.getByTestId("repeat-apply").click();

  // Wait for the repeat selector to close — indicates save completed
  await page.getByTestId("repeat-apply").waitFor({ state: "hidden" });

  // Trigger sync to push the recurring task to the server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  const serverTask = pullResponse.tasks.find(
    (task) => task.name === recurringTaskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.repeat_rule).not.toBe("");
});
