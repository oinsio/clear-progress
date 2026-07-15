// implements U2, U3, FR7, M4 of add-composite-tenant-pk
// Test 2 below also behaviorally verifies FR4 / task 2.2: the four composite
// FK constraint names (tasks_goal_id_fkey, tasks_context_id_fkey,
// tasks_category_id_fkey, checklist_items_task_id_fkey) are confirmed via the
// fk_violation:<field> reason strings the push RPC derives from constraint names.
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  buildCategoryPayload,
  buildChecklistPayload,
  buildContextPayload,
  buildGoalPayload,
  buildTaskPayload,
} from "../cross-tenant-payloads.js";
import {
  createIsolatedUser,
  pullFromServer,
  pushToServer,
  type ServerCallCredentials,
} from "../test-helpers.js";

interface PushResult {
  id: string;
  status: string;
  reason?: string;
}

interface CrossTenantPushResponse {
  ok: boolean;
  results: {
    goals?: PushResult[];
    tasks?: PushResult[];
    contexts?: PushResult[];
    categories?: PushResult[];
    checklist_items?: PushResult[];
  };
}

interface CrossTenantPullResponse {
  ok: boolean;
  contexts: Array<{ id: string; name: string; is_deleted: boolean }>;
  tasks: Array<{ id: string; goal_id: string; is_deleted: boolean }>;
}

test.describe.configure({ mode: "serial" });

let userA: ServerCallCredentials;
let userB: ServerCallCredentials;

test.beforeAll(async () => {
  userA = await createIsolatedUser("cross-tenant-a");
  userB = await createIsolatedUser("cross-tenant-b");
});

test("two users push records with the same UUID → both created, both rows exist", async () => {
  const sharedId = randomUUID();
  const nameA = `Context A ${Date.now()}`;
  const nameB = `Context B ${Date.now()}`;

  // User A pushes a context with the shared UUID.
  const pushA = (await pushToServer(
    userA,
    buildContextPayload(sharedId, nameA),
  )) as unknown as CrossTenantPushResponse;
  expect(pushA.ok).toBe(true);
  expect(pushA.results.contexts?.[0]?.status).toBe("created");

  // User B pushes a context reusing the SAME UUID → must also succeed,
  // proving the composite (user_id, id) PK removed the global uniqueness.
  const pushB = (await pushToServer(
    userB,
    buildContextPayload(sharedId, nameB),
  )) as unknown as CrossTenantPushResponse;
  expect(pushB.ok).toBe(true);
  expect(pushB.results.contexts?.[0]?.status).toBe("created");

  // Each user pulls only their own row for the shared UUID.
  const pullA = await pullFromServer<CrossTenantPullResponse>(userA);
  const contextA = pullA.contexts.find((context) => context.id === sharedId);
  expect(contextA).toBeDefined();
  expect(contextA?.name).toBe(nameA);

  const pullB = await pullFromServer<CrossTenantPullResponse>(userB);
  const contextB = pullB.contexts.find((context) => context.id === sharedId);
  expect(contextB).toBeDefined();
  expect(contextB?.name).toBe(nameB);
});

test("user B task referencing user A's goal → fk_violation:goal_id → self-heal → created", async () => {
  // 1. User A creates a goal.
  const userAGoalId = randomUUID();
  const goalPush = (await pushToServer(
    userA,
    buildGoalPayload(userAGoalId, `Goal A ${Date.now()}`),
  )) as unknown as CrossTenantPushResponse;
  expect(goalPush.results.goals?.[0]?.status).toBe("created");

  // 2. User B pushes a task referencing user A's goal (cross-tenant ref).
  const taskId = randomUUID();
  const rejectedPush = (await pushToServer(
    userB,
    buildTaskPayload({
      id: taskId,
      name: `Task B ${Date.now()}`,
      goalId: userAGoalId,
    }),
  )) as unknown as CrossTenantPushResponse;
  const rejectedResult = rejectedPush.results.tasks?.find(
    (result) => result.id === taskId,
  );
  expect(rejectedResult?.status).toBe("rejected");
  expect(rejectedResult?.reason).toBe("fk_violation:goal_id");

  // 3. Self-heal: user B re-pushes the SAME task with the reference cleared.
  const healedPush = (await pushToServer(
    userB,
    buildTaskPayload({ id: taskId, name: `Task B ${Date.now()}`, goalId: "" }),
  )) as unknown as CrossTenantPushResponse;
  const healedResult = healedPush.results.tasks?.find(
    (result) => result.id === taskId,
  );
  expect(healedResult?.status).toBe("created");

  // 4. Pull user B's data — the task exists with the reference cleared.
  const pullB = await pullFromServer<CrossTenantPullResponse>(userB);
  const healedTask = pullB.tasks.find((task) => task.id === taskId);
  expect(healedTask).toBeDefined();
  expect(healedTask?.goal_id).toBe("");
  expect(healedTask?.is_deleted).toBe(false);
});

test("cross-tenant references are rejected with the correct fk_violation field for every FK", async () => {
  // User A creates a goal, a context, a category, and a task.
  const userAGoalId2 = randomUUID();
  const userAContextId = randomUUID();
  const userACategoryId = randomUUID();
  const userATaskId = randomUUID();

  for (const [payload, entity, ownerId] of [
    [buildGoalPayload(userAGoalId2, "Goal A2"), "goals", userAGoalId2],
    [buildContextPayload(userAContextId, "Ctx A"), "contexts", userAContextId],
    [
      buildCategoryPayload(userACategoryId, "Cat A"),
      "categories",
      userACategoryId,
    ],
    [
      buildTaskPayload({ id: userATaskId, name: "Task A" }),
      "tasks",
      userATaskId,
    ],
  ] as const) {
    const response = (await pushToServer(
      userA,
      payload,
    )) as unknown as CrossTenantPushResponse;
    expect(
      response.results[entity]?.find((result) => result.id === ownerId)?.status,
    ).toBe("created");
  }

  // Each case: user B references a record owned by user A → the reason string
  // encodes the FK field, which proves the corresponding constraint NAME
  // (tasks_context_id_fkey, tasks_category_id_fkey, tasks_goal_id_fkey,
  // checklist_items_task_id_fkey). Verifies FR4 / task 2.2 behaviorally.
  //
  // NOTE on the checklist case: the push RPC derives the field via the regexp
  // `^.*?_(.+?)_fkey$`. The table name `checklist_items` itself contains an
  // underscore, so that regexp yields `items_task_id` (not `task_id`) from
  // `checklist_items_task_id_fkey`. This is pre-existing behavior — the old
  // inline FK auto-generated the identical constraint name — and is therefore
  // unchanged by this change (FR6). The `items_task_id` reason still uniquely
  // confirms the constraint name is `checklist_items_task_id_fkey`.
  const [ctxId, catId, goalId, itemId] = [
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
  ];
  const fkCases: Array<{
    entity: keyof CrossTenantPushResponse["results"];
    id: string;
    reason: string;
    payload: Record<string, unknown[]>;
  }> = [
    {
      entity: "tasks",
      id: ctxId,
      reason: "fk_violation:context_id",
      payload: buildTaskPayload({
        id: ctxId,
        name: "Viol",
        contextId: userAContextId,
      }),
    },
    {
      entity: "tasks",
      id: catId,
      reason: "fk_violation:category_id",
      payload: buildTaskPayload({
        id: catId,
        name: "Viol",
        categoryId: userACategoryId,
      }),
    },
    {
      entity: "tasks",
      id: goalId,
      reason: "fk_violation:goal_id",
      payload: buildTaskPayload({
        id: goalId,
        name: "Viol",
        goalId: userAGoalId2,
      }),
    },
    {
      entity: "checklist_items",
      id: itemId,
      reason: "fk_violation:items_task_id",
      payload: buildChecklistPayload(itemId, userATaskId, "Item"),
    },
  ];

  for (const fkCase of fkCases) {
    const response = (await pushToServer(
      userB,
      fkCase.payload,
    )) as unknown as CrossTenantPushResponse;
    const result = response.results[fkCase.entity]?.find(
      (record) => record.id === fkCase.id,
    );
    expect(result?.status, fkCase.reason).toBe("rejected");
    expect(result?.reason, fkCase.reason).toBe(fkCase.reason);
  }
});
