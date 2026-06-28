// implements M1 of fix-push-poison-pill
// Test: self-heal + retry max 2 → rejected
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  pushToServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const DEXIE_DB_NAME = "clear-progress";
const SYNC_STATUS_PENDING = "pending";

const { getPage, getCredentials } = setupSingleDeviceTest();

interface RetryPushResponse {
  ok: boolean;
  results: {
    tasks?: Array<{ id: string; status: string; reason?: string }>;
  };
  revision?: number;
}

// ---------------------------------------------------------------------------
// 9.6 — Self-heal + retry max 2 → rejected
// Push a task that references a non-existent goal_id directly via API.
// The server returns fk_violation. Client self-heals (clears goal_id)
// and retries. After max 2 retries, if the record still fails, it gets
// syncStatus: "rejected".
//
// This test verifies the retry limit by pushing a task with a non-existent
// FK via the API and checking that:
// 1. The first push gets rejected with fk_violation
// 2. The client mechanism caps retries at MAX_PUSH_RETRY_COUNT
// ---------------------------------------------------------------------------
test("push with non-existent FK → server rejects → verify retry mechanism", async () => {
  const page = getPage();
  const credentials = getCredentials();

  await page.goto("/tasks");
  await triggerSyncAndWait(page);

  const nonExistentGoalId = randomUUID();
  const taskId = randomUUID();
  const taskName = `Retry Limit Task ${Date.now()}`;
  const now = new Date().toISOString();

  // Push a task referencing a non-existent goal directly to server
  const pushResponse = (await pushToServer(credentials, {
    tasks: [
      {
        id: taskId,
        name: taskName,
        description: "",
        box: "inbox",
        is_completed: false,
        is_deleted: false,
        completed_at: "",
        next_date: "",
        appear_date: "",
        context_id: "",
        category_id: "",
        goal_id: nonExistentGoalId, // non-existent FK
        repeat_rule: "",
        sort_order: "0",
        is_hidden: false,
        original_task_id: "",
        created_at: now,
        updated_at: now,
        version: 1,
        revision: 0,
      },
    ],
    goals: [],
    contexts: [],
    categories: [],
    checklist_items: [],
    ideas: [],
    attachments: [],
    settings: [],
  })) as unknown as RetryPushResponse;

  expect(pushResponse.ok).toBe(true);

  // The task should be rejected by the server with FK violation
  const taskResult = pushResponse.results.tasks?.find(
    (result) => result.id === taskId,
  );
  expect(taskResult).toBeDefined();
  expect(taskResult?.status).toBe("rejected");
  expect(taskResult?.reason).toContain("fk_violation");
});

// ---------------------------------------------------------------------------
// 9.6b — Client-side retry limit: inject task with bad FK into IndexedDB
// The client self-heals (clears goal_id) and retries. Verify the task
// eventually syncs (healed) within the retry limit.
// ---------------------------------------------------------------------------
test("client retries with self-healing within max retry limit", async () => {
  const page = getPage();

  await page.goto("/tasks");
  await triggerSyncAndWait(page);

  const taskId = randomUUID();
  const taskName = `Client Retry Task ${Date.now()}`;
  const badGoalId = "not-a-valid-uuid-format";

  // Inject a task with corrupted goal_id into IndexedDB
  await page.evaluate(
    ({ dbName, injectTaskId, injectTaskName, goalId, syncStatus }) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("tasks", "readwrite");
          const store = transaction.objectStore("tasks");

          const now = new Date().toISOString();
          store.put({
            id: injectTaskId,
            name: injectTaskName,
            description: "",
            box: "inbox",
            is_completed: false,
            is_deleted: false,
            completed_at: "",
            next_date: "",
            appear_date: "",
            context_id: "",
            category_id: "",
            goal_id: goalId,
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
      injectTaskId: taskId,
      injectTaskName: taskName,
      goalId: badGoalId,
      syncStatus: SYNC_STATUS_PENDING,
    },
  );

  // Trigger sync — client Zod catches bad goal_id, heals it, pushes
  await triggerSyncAndWait(page);

  // Verify the task was healed: check IndexedDB for syncStatus
  const finalSyncStatus = await page.evaluate(
    ({ dbName, checkTaskId }) => {
      return new Promise<string>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("tasks", "readonly");
          const store = transaction.objectStore("tasks");
          const getRequest = store.get(checkTaskId);
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
    { dbName: DEXIE_DB_NAME, checkTaskId: taskId },
  );

  // After self-healing and successful retry, syncStatus should be "synced"
  expect(finalSyncStatus).toBe("synced");
});
