// implements M2 of fix-push-poison-pill
// Test: corrupted fields → Zod catches → self-heal → push succeeds
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const DEXIE_DB_NAME = "clear-progress";
const SYNC_STATUS_PENDING = "pending";

const { getPage, getCredentials } = setupSingleDeviceTest();

interface FormatPullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    goal_id: string;
    context_id: string;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  }>;
}

// ---------------------------------------------------------------------------
// 9.3 — Corrupted fields → Zod catches → self-heal → push succeeds
// Inject a task with corrupted FK fields (not valid UUID, not empty string)
// directly into IndexedDB. When sync triggers, the client-side Zod validation
// should catch the invalid fields, self-heal them, and push successfully.
// ---------------------------------------------------------------------------
test("corrupted FK fields → Zod catches → self-heal → push succeeds", async () => {
  const page = getPage();
  const credentials = getCredentials();

  // Ensure clean state
  await page.goto("/tasks");
  await triggerSyncAndWait(page);

  const corruptedTaskId = randomUUID();
  const corruptedTaskName = `Corrupted FK Task ${Date.now()}`;

  // Inject a task with corrupted goal_id directly into IndexedDB
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
            box: "inbox",
            is_completed: false,
            is_deleted: false,
            completed_at: "",
            next_date: "",
            appear_date: "",
            context_id: "",
            category_id: "",
            goal_id: "not-a-valid-uuid", // corrupted FK
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
      taskId: corruptedTaskId,
      taskName: corruptedTaskName,
      syncStatus: SYNC_STATUS_PENDING,
    },
  );

  // Trigger sync — Zod should catch the corrupted goal_id, heal it, and push
  await triggerSyncAndWait(page);

  // Verify the task was pushed to the server
  const pullResponse = await pullFromServer<FormatPullResponse>(credentials);
  const serverTask = pullResponse.tasks.find(
    (task) => task.id === corruptedTaskId,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.name).toBe(corruptedTaskName);
  // goal_id should be healed to empty string
  expect(serverTask?.goal_id).toBe("");
});
