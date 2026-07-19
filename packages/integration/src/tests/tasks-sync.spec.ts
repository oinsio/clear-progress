// implements FR6, FR8, FR16 of add-supabase-integration-tests
import { expect, test } from "@playwright/test";
import {
  createTask,
  deleteTaskFromDetail,
  openTaskDetail,
  updateTaskName,
} from "../page-task-actions.js";
import {
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";
import { createRecurringTask } from "./stale-recurring-helpers.js";

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

  // Create a task and set up a daily `fixed` repeat rule
  await createRecurringTask(page, recurringTaskName);

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
