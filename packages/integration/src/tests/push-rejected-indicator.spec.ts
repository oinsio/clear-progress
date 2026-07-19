// implements M3, UX1, UX2 of fix-push-poison-pill
// Test: rejected → red border → edit → amber → sync → transparent
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { openTaskDetail, updateTaskName } from "../page-task-actions.js";
import { setupSingleDeviceTest, triggerSyncAndWait } from "../test-helpers.js";

const DEXIE_DB_NAME = "clear-progress";
const RED_BORDER_CLASS = "border-l-red-500";
const AMBER_BORDER_CLASS = "border-l-amber-400";

const { getPage } = setupSingleDeviceTest();

// ---------------------------------------------------------------------------
// 9.5 — Rejected → red border → edit → amber → sync → transparent
// Inject a task with syncStatus: "rejected" into IndexedDB.
// Verify:
// 1. Red border appears in UI
// 2. Editing the task resets to amber (pending)
// 3. Syncing successfully clears the border
// ---------------------------------------------------------------------------
test("rejected → red border → edit → amber → sync → transparent", async () => {
  const page = getPage();

  // Ensure clean state
  await page.goto("/tasks");
  await triggerSyncAndWait(page);

  const rejectedTaskId = randomUUID();
  const rejectedTaskName = `Rejected Task ${Date.now()}`;

  // Step 1: Inject a task with syncStatus: "rejected" and valid box "today"
  await page.evaluate(
    ({ dbName, taskId, taskName }) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("tasks", "readwrite");
          const store = transaction.objectStore("tasks");

          const now = new Date().toISOString();
          store.put({
            id: taskId,
            name: taskName,
            description: "",
            box: "today",
            is_completed: false,
            is_deleted: false,
            completed_at: "",
            next_date: "",
            appear_date: "",
            context_id: "",
            category_id: "",
            goal_id: "",
            repeat_rule: "",
            sort_order: "0",
            is_hidden: false,
            original_task_id: "",
            created_at: now,
            updated_at: now,
            version: 1,
            revision: 0,
            syncStatus: "rejected",
          });

          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            database.close();
            reject(transaction.error);
          };
        };
        request.onerror = () => reject(request.error);
      });
    },
    {
      dbName: DEXIE_DB_NAME,
      taskId: rejectedTaskId,
      taskName: rejectedTaskName,
    },
  );

  // Step 2: Navigate to tasks page and select "today" filter to see the task
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');

  const filterToggle = page.getByTestId("command-bar-filter-toggle");
  if (await filterToggle.isVisible()) {
    await filterToggle.click();
    await page.getByTestId("box-filter-today").click();
  }

  // Wait for the task to appear
  const taskItem = page.locator('[data-testid="task-item"]').filter({
    has: page.locator('[data-testid="task-item-name"]', {
      hasText: rejectedTaskName,
    }),
  });
  await taskItem.waitFor({ state: "visible", timeout: 10_000 });

  // Step 3: Verify red border is present (UX1)
  await expect(taskItem).toHaveClass(new RegExp(RED_BORDER_CLASS));

  // Step 4: Edit the task — should reset to amber (UX2)
  const editedTaskName = `${rejectedTaskName} Edited`;
  await openTaskDetail(page, rejectedTaskName);
  await updateTaskName(page, editedTaskName);

  // Wait for re-render after edit
  await page.waitForTimeout(500);

  // Locate the updated task item
  const editedTaskItem = page.locator('[data-testid="task-item"]').filter({
    has: page.locator('[data-testid="task-item-name"]', {
      hasText: editedTaskName,
    }),
  });
  await editedTaskItem.waitFor({ state: "visible", timeout: 5_000 });

  // Should now show amber border (pending)
  await expect(editedTaskItem).toHaveClass(new RegExp(AMBER_BORDER_CLASS));

  // Step 5: Sync successfully — border should be transparent
  await triggerSyncAndWait(page);

  // Reload to get fresh UI state
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');

  // Select today filter again
  const filterToggleAfterSync = page.getByTestId("command-bar-filter-toggle");
  if (await filterToggleAfterSync.isVisible()) {
    await filterToggleAfterSync.click();
    await page.getByTestId("box-filter-today").click();
  }

  const syncedTaskItem = page.locator('[data-testid="task-item"]').filter({
    has: page.locator('[data-testid="task-item-name"]', {
      hasText: editedTaskName,
    }),
  });
  await syncedTaskItem.waitFor({ state: "visible", timeout: 10_000 });

  // Should NOT have red or amber border after successful sync
  await expect(syncedTaskItem).not.toHaveClass(new RegExp(RED_BORDER_CLASS));
  await expect(syncedTaskItem).not.toHaveClass(new RegExp(AMBER_BORDER_CLASS));
});
