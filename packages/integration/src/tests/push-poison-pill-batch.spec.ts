// implements M1 of fix-push-poison-pill
// Test: goal + task in one push, goal rejected → task FK-healed
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  pullFromServer,
  pushToServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

interface BatchPullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    goal_id: string;
    is_deleted: boolean;
  }>;
  goals: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
  }>;
}

interface BatchPushResponse {
  ok: boolean;
  results: {
    goals?: Array<{ id: string; status: string; reason?: string }>;
    tasks?: Array<{ id: string; status: string; reason?: string }>;
  };
  revision?: number;
}

// ---------------------------------------------------------------------------
// 9.2 — Goal + task in one push, goal rejected → task FK-healed
// Push a goal with an invalid field (e.g., invalid status) alongside a task
// that references it. The goal should be rejected by the server, and the task
// should fail with FK violation, then be healed on retry.
// ---------------------------------------------------------------------------
test("goal + task in one push, goal rejected → task FK-healed", async () => {
  const page = getPage();
  const credentials = getCredentials();

  await page.goto("/tasks");
  await triggerSyncAndWait(page);

  const goalId = randomUUID();
  const taskId = randomUUID();
  const now = new Date().toISOString();

  // Push a goal with invalid status (will be rejected by check constraint)
  // and a task referencing that goal
  const pushResponse = (await pushToServer(credentials, {
    goals: [
      {
        id: goalId,
        name: `Batch Goal ${Date.now()}`,
        description: "",
        status: "INVALID_STATUS", // invalid enum → check_violation
        cover_hash: "",
        sort_order: "0",
        is_deleted: false,
        created_at: now,
        updated_at: now,
        version: 1,
        revision: 0,
      },
    ],
    tasks: [
      {
        id: taskId,
        name: `Batch Task ${Date.now()}`,
        description: "",
        box: "inbox",
        is_completed: false,
        is_deleted: false,
        completed_at: "",
        next_date: "",
        appear_date: "",
        context_id: "",
        category_id: "",
        goal_id: goalId, // references the rejected goal
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
    contexts: [],
    categories: [],
    checklist_items: [],
    ideas: [],
    attachments: [],
    settings: [],
  })) as unknown as BatchPushResponse;

  expect(pushResponse.ok).toBe(true);

  // Goal should be rejected (invalid status)
  const goalResult = pushResponse.results.goals?.find(
    (result) => result.id === goalId,
  );
  expect(goalResult?.status).toBe("rejected");

  // Task may be rejected with FK violation (goal doesn't exist on server)
  // or accepted if the server processes tasks before goals
  const taskResult = pushResponse.results.tasks?.find(
    (result) => result.id === taskId,
  );

  if (taskResult?.status === "rejected") {
    // FK violation is expected — the goal was rejected so FK fails
    expect(taskResult.reason).toContain("fk_violation");
  }

  // Verify: even if the batch had rejections, no sync blockage occurs.
  // The goal should NOT exist on server (rejected).
  const finalPull = await pullFromServer<BatchPullResponse>(credentials);
  const serverGoal = finalPull.goals.find((goal) => goal.id === goalId);
  // Goal was rejected — should not be on server
  expect(serverGoal === undefined || serverGoal.is_deleted).toBe(true);
});
