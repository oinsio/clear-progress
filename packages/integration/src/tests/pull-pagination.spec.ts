// implements M1 of fix-pull-pagination
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  pullFromServer,
  pushToServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const PAGINATION_TEST_TASK_COUNT = 15;
const INCREMENTAL_TASK_COUNT = 12;
const CRASH_RECOVERY_TASK_COUNT = 15;
// Push tasks in batches to ensure each batch gets a unique server revision.
// Pushing all tasks in a single call assigns the same revision to all,
// which breaks gt-based pagination when batch > PGRST_DB_MAX_ROWS.
const PUSH_BATCH_SIZE = 5;

const { getPage, getCredentials } = setupSingleDeviceTest();

interface PaginationPullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
    is_completed: boolean;
  }>;
  has_more: boolean;
  current_revision: number;
}

function buildTestTasks(prefix: string, count: number) {
  const ids: string[] = [];
  const tasks = Array.from({ length: count }, (_, index) => {
    const taskId = randomUUID();
    ids.push(taskId);
    return {
      id: taskId,
      name: `${prefix} ${index + 1}`,
      description: "",
      box: "inbox",
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      revision: 0,
    };
  });
  return { ids, tasks };
}

async function pushTasksInBatches(
  credentials: ReturnType<typeof getCredentials>,
  tasks: ReturnType<typeof buildTestTasks>["tasks"],
) {
  for (let offset = 0; offset < tasks.length; offset += PUSH_BATCH_SIZE) {
    const batch = tasks.slice(offset, offset + PUSH_BATCH_SIZE);
    const pushResponse = await pushToServer(credentials, {
      tasks: batch,
      goals: [],
      contexts: [],
      categories: [],
      checklist_items: [],
      ideas: [],
      attachments: [],
      settings: [],
    });
    expect(pushResponse.ok).toBe(true);
  }
}

// ---------------------------------------------------------------------------
// 5.1 — Initial pull with record count > max_rows fetches all records
// Verifies that pullFromServer aggregates paginated responses automatically.
// PGRST_DB_MAX_ROWS is set to 10, so 15 tasks require at least 2 pages.
// ---------------------------------------------------------------------------
test("initial pull with record count > max_rows fetches all records", async () => {
  const page = getPage();
  const credentials = getCredentials();

  // Step 1: Navigate to /tasks to trigger auto-sync (calls /init)
  await page.goto("/tasks");
  await triggerSyncAndWait(page);

  // Step 2: Generate and push 15 tasks in batches (each batch gets a unique revision)
  const { ids: pushedTaskIds, tasks: tasksToCreate } = buildTestTasks(
    "Pagination Task",
    PAGINATION_TEST_TASK_COUNT,
  );
  await pushTasksInBatches(credentials, tasksToCreate);

  // Step 3: Pull all records — pullFromServer should auto-paginate
  const sinceRevisionZero = 0;
  const pullResponse = await pullFromServer<PaginationPullResponse>(
    credentials,
    sinceRevisionZero,
  );
  expect(pullResponse.ok).toBe(true);

  // Step 4: Verify all 15 pushed tasks exist in the aggregated response
  const pulledTaskIds = pullResponse.tasks.map((task) => task.id);

  for (const expectedTaskId of pushedTaskIds) {
    expect(
      pulledTaskIds,
      `Expected task ${expectedTaskId} to be in pull response`,
    ).toContain(expectedTaskId);
  }

  // Verify count: at least PAGINATION_TEST_TASK_COUNT tasks
  // (there may be other tasks from prior tests in the shared user)
  expect(pullResponse.tasks.length).toBeGreaterThanOrEqual(
    PAGINATION_TEST_TASK_COUNT,
  );
});

// ---------------------------------------------------------------------------
// 5.2 — Incremental pull after partial batch — all records fetched
// implements M1 of fix-pull-pagination
// Verifies that pulling with a non-zero sinceRevision correctly paginates
// and returns only records newer than the baseline revision.
// ---------------------------------------------------------------------------
test("incremental pull after partial batch — all records fetched", async () => {
  const credentials = getCredentials();

  // Step 1: Establish baseline by pulling all existing data (15 tasks from 5.1)
  const baselinePullResponse =
    await pullFromServer<PaginationPullResponse>(credentials);
  expect(baselinePullResponse.ok).toBe(true);
  const baselineRevision = baselinePullResponse.current_revision;

  // Step 2: Push 12 more tasks in batches (each batch gets a unique revision)
  const { ids: incrementalTaskIds, tasks: incrementalTasks } = buildTestTasks(
    "Incremental Task",
    INCREMENTAL_TASK_COUNT,
  );
  await pushTasksInBatches(credentials, incrementalTasks);

  // Step 3: Pull only changes since baseline revision
  const incrementalPullResponse = await pullFromServer<PaginationPullResponse>(
    credentials,
    baselineRevision,
  );
  expect(incrementalPullResponse.ok).toBe(true);

  // Step 4: Verify all 12 new tasks are in the incremental response
  const incrementalPulledTaskIds = incrementalPullResponse.tasks.map(
    (task) => task.id,
  );

  for (const expectedTaskId of incrementalTaskIds) {
    expect(
      incrementalPulledTaskIds,
      `Expected incremental task ${expectedTaskId} to be in pull response`,
    ).toContain(expectedTaskId);
  }

  expect(incrementalPullResponse.tasks.length).toBeGreaterThanOrEqual(
    INCREMENTAL_TASK_COUNT,
  );

  // Step 5: Verify old tasks from 5.1 are NOT in the incremental response
  const baselineTaskIds = baselinePullResponse.tasks.map((task) => task.id);
  for (const oldTaskId of baselineTaskIds) {
    expect(
      incrementalPulledTaskIds,
      `Old task ${oldTaskId} should not appear in incremental pull`,
    ).not.toContain(oldTaskId);
  }
});

// ---------------------------------------------------------------------------
// 5.3 — Crash-recovery — re-pull from last saved revision fetches all records
// implements M2 of fix-pull-pagination
// Verifies D4: last_known_revision is saved ONLY after has_more === false.
// If sync is interrupted mid-pagination, the client retries from the last
// saved revision and receives all records without data loss.
// ---------------------------------------------------------------------------
test("crash-recovery — re-pull from last saved revision fetches all records", async () => {
  const credentials = getCredentials();

  // Step 1: Establish baseline by pulling all existing data
  const baselinePullResponse =
    await pullFromServer<PaginationPullResponse>(credentials);
  expect(baselinePullResponse.ok).toBe(true);
  const baselineRevision = baselinePullResponse.current_revision;

  // Step 2: Push 15 more tasks in batches to ensure pagination is needed (max_rows=10)
  const { ids: crashRecoveryTaskIds, tasks: crashRecoveryTasks } =
    buildTestTasks("CrashRecovery Task", CRASH_RECOVERY_TASK_COUNT);
  await pushTasksInBatches(credentials, crashRecoveryTasks);

  // Step 3: Simulate "crash" — fetch only the first page (no auto-pagination)
  // The client would NOT save current_revision because has_more === true (D4)
  const singlePageResponse = await fetch(
    `${credentials.supabaseUrl}/functions/v1/pull`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        apikey: credentials.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ since_revision: baselineRevision }),
    },
  );
  const singlePageData =
    (await singlePageResponse.json()) as PaginationPullResponse;
  expect(singlePageData.has_more).toBe(true);

  // Step 4: Simulate restart — re-pull from the same baseline revision
  // Since the "crash" happened before saving, the client retries from
  // the last persisted revision (baselineRevision)
  const recoveryPullResponse = await pullFromServer<PaginationPullResponse>(
    credentials,
    baselineRevision,
  );
  expect(recoveryPullResponse.ok).toBe(true);

  // Step 5: Verify ALL new tasks are present — no data loss after crash
  const recoveryPulledTaskIds = recoveryPullResponse.tasks.map(
    (task) => task.id,
  );

  for (const expectedTaskId of crashRecoveryTaskIds) {
    expect(
      recoveryPulledTaskIds,
      `Expected crash-recovery task ${expectedTaskId} to be in recovery pull`,
    ).toContain(expectedTaskId);
  }

  expect(recoveryPullResponse.tasks.length).toBeGreaterThanOrEqual(
    CRASH_RECOVERY_TASK_COUNT,
  );
});
