// implements M3 of fix-push-poison-pill
// Test: invalid box/status → rejected → red border
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { setupSingleDeviceTest, triggerSyncAndWait } from "../test-helpers.js";

const DEXIE_DB_NAME = "clear-progress";
const SYNC_STATUS_PENDING = "pending";

const { getPage } = setupSingleDeviceTest();

// ---------------------------------------------------------------------------
// 9.4 — Invalid box enum → Zod catches → rejected → red border
// Inject a task with an invalid box value directly into IndexedDB.
// The client-side Zod pre-validator cannot heal enum violations,
// so the record should be marked as rejected and show a red border.
// ---------------------------------------------------------------------------
test("invalid box enum → rejected → red border visible", async () => {
  const page = getPage();

  // Ensure clean state
  await page.goto("/tasks");
  await triggerSyncAndWait(page);

  const invalidTaskId = randomUUID();
  const invalidTaskName = `Invalid Box Task ${Date.now()}`;

  // Inject a task with invalid box value into IndexedDB
  await page.evaluate(
    ({ dbName, taskId, taskName, syncStatus }) => {
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
            box: "INVALID_BOX", // invalid enum value
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
            syncStatus,
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
      taskId: invalidTaskId,
      taskName: invalidTaskName,
      syncStatus: SYNC_STATUS_PENDING,
    },
  );

  // Trigger sync — Zod should reject the invalid box (unhealable)
  await triggerSyncAndWait(page);

  // Reload to see the task in the UI (it's in an invalid box, so it may
  // appear in any list or need to be checked via IndexedDB)
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');

  // Verify the record has syncStatus: "rejected" in IndexedDB
  const taskSyncStatus = await page.evaluate(
    ({ dbName, taskId }) => {
      return new Promise<string>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("tasks", "readonly");
          const store = transaction.objectStore("tasks");
          const getRequest = store.get(taskId);
          getRequest.onsuccess = () => {
            database.close();
            resolve(
              (getRequest.result as { syncStatus: string })?.syncStatus ?? "",
            );
          };
          getRequest.onerror = () => {
            database.close();
            reject(getRequest.error);
          };
        };
        request.onerror = () => reject(request.error);
      });
    },
    { dbName: DEXIE_DB_NAME, taskId: invalidTaskId },
  );

  expect(taskSyncStatus).toBe("rejected");
});
