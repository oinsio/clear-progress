// implements FR6, FR8, FR16 of add-supabase-integration-tests
import { expect, test } from "@playwright/test";
import {
  createTask,
  deleteTaskFromDetail,
  openTaskDetail,
  updateTaskName,
} from "../page-actions.js";
import {
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

// State carried between sequential tests (5.2.1 → 5.2.2 → 5.2.3)
let createdTaskName: string;
let createdTaskId: string;

interface TasksPullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
    is_completed: boolean;
    repeat_rule: string;
  }>;
}

// ---------------------------------------------------------------------------
// 5.2.1 — Create task locally → push → verify task exists on server
// ---------------------------------------------------------------------------
test("create task locally → push → verify task exists on server", async () => {
  const page = getPage();
  createdTaskName = `Sync Test Task ${Date.now()}`;

  // Add a task via the UI (creates in Today box by default)
  await createTask(page, createdTaskName);

  // Trigger push + pull immediately instead of waiting for the 15-second debounce
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<TasksPullResponse>(
    getCredentials(),
  );
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
  const page = getPage();
  const updatedName = `Updated Task ${Date.now()}`;

  // Open detail panel and change name
  await openTaskDetail(page, createdTaskName);
  await updateTaskName(page, updatedName);

  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<TasksPullResponse>(
    getCredentials(),
  );
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
  const page = getPage();
  // The task detail panel should still be open from 5.2.2.
  await deleteTaskFromDetail(page);

  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<TasksPullResponse>(
    getCredentials(),
  );
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
  const page = getPage();
  const recurringTaskName = `Recurring Task ${Date.now()}`;

  // Create a new task and open detail panel
  await createTask(page, recurringTaskName);
  await openTaskDetail(page, recurringTaskName);

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

  const pullResponse = await pullFromServer<TasksPullResponse>(
    getCredentials(),
  );
  const serverTask = pullResponse.tasks.find(
    (task) => task.name === recurringTaskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.repeat_rule).not.toBe("");
});
