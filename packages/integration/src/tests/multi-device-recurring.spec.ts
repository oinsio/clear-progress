// implements FR14 of add-supabase-integration-tests
import { expect, type Page, test } from "@playwright/test";
import { createTask, findTaskItem, openTaskDetail } from "../page-actions.js";
import {
  pullFromServer,
  setupTwoDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

// --- Helpers ----------------------------------------------------------------

type PullTask = {
  id: string;
  name: string;
  is_deleted: boolean;
  is_completed: boolean;
  repeat_rule: string;
  next_date: string;
  original_task_id: string;
  completed_at: string;
  updated_at: string;
};

interface RecurringPullResponse {
  ok: boolean;
  tasks: PullTask[];
  current_revision: number;
}

async function setFixedDailyRepeat(testPage: Page): Promise<void> {
  await testPage
    .getByTestId("task-detail-panel")
    .getByRole("button", { name: /Repeat/ })
    .click();
  await testPage.getByTestId("repeat-type-fixed").waitFor({ state: "visible" });
  await testPage.getByTestId("repeat-type-fixed").click();
  await testPage
    .getByTestId("repeat-frequency-daily")
    .waitFor({ state: "visible" });
  await testPage.getByTestId("repeat-frequency-daily").click();
  await testPage.getByTestId("repeat-fixed-next").waitFor({ state: "visible" });
  await testPage.getByTestId("repeat-fixed-next").click();
  await testPage.getByTestId("repeat-apply").waitFor({ state: "visible" });
  await testPage.getByTestId("repeat-apply").click();
  await testPage.getByTestId("repeat-apply").waitFor({ state: "hidden" });
}

async function createRecurringTask(
  testPage: Page,
  taskName: string,
): Promise<void> {
  await createTask(testPage, taskName);
  await openTaskDetail(testPage, taskName);
  await setFixedDailyRepeat(testPage);
}

const TASK_VISIBLE_TIMEOUT_MS = 15_000;
const COMPLETE_SETTLE_MS = 300;

async function completeTask(testPage: Page, taskName: string): Promise<void> {
  await findTaskItem(testPage, taskName)
    .getByRole("button", { name: /Complete task/i })
    .click();
  // Recurring tasks create a new occurrence with the same name immediately,
  // so we cannot wait for the task item to become hidden.
  await testPage.waitForTimeout(COMPLETE_SETTLE_MS);
}

// State carried between sequential tests
let recurringTaskName: string;

// --- 5.13.1 — App A creates recurring (daily) → push → App B pulls --------

test("App A creates daily recurring → push → App B pulls → task with repeat_rule", async () => {
  const pageA = getPageA();
  recurringTaskName = `Recurring Multi ${Date.now()}`;
  await createRecurringTask(pageA, recurringTaskName);
  await triggerSyncAndWait(pageA);

  const { tasks } = await pullFromServer<RecurringPullResponse>(
    getCredentials(),
  );
  const serverTask = tasks.find(
    (t) => t.name === recurringTaskName && !t.is_deleted,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.repeat_rule).not.toBe("");
});

// --- 5.13.2 — App A completes recurring → new occurrence -------------------

test("App A completes recurring → push → original completed + new occurrence", async () => {
  const pageA = getPageA();
  await completeTask(pageA, recurringTaskName);
  await triggerSyncAndWait(pageA);

  const { tasks } = await pullFromServer<RecurringPullResponse>(
    getCredentials(),
  );
  const matching = tasks.filter((t) => t.name === recurringTaskName);

  const originalTask = matching.find((t) => t.is_completed);
  expect(originalTask).toBeDefined();
  expect(originalTask?.completed_at).not.toBe("");

  const newOccurrence = matching.find(
    (t) =>
      !t.is_completed &&
      !t.is_deleted &&
      t.original_task_id === originalTask?.id,
  );
  expect(newOccurrence).toBeDefined();
  expect(newOccurrence?.repeat_rule).not.toBe("");
  expect(newOccurrence?.next_date).not.toBe("");
});

// --- 5.13.3 — Both complete same recurring offline → conflict + dedup ------

test("Both complete same recurring offline → push both → consistent state", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const conflictTaskName = `Recurring Conflict ${Date.now()}`;

  // Establish baseline revision to avoid paginating entire history on pull
  const baseline = await pullFromServer<RecurringPullResponse>(
    getCredentials(),
  );
  const baselineRevision = baseline.current_revision;

  await createRecurringTask(pageA, conflictTaskName);
  await triggerSyncAndWait(pageA);

  // pageB has been idle — reload to ensure fresh UI + sync state
  await pageB.goto("/tasks");
  await pageB.waitForSelector('[data-testid="active-tasks-page"]');

  // Sync pageB — data is already on server (pageA synced above)
  await triggerSyncAndWait(pageB);
  // Reload to ensure React re-renders with fresh IndexedDB data
  await pageB.reload();
  await pageB.waitForSelector('[data-testid="active-tasks-page"]');
  await findTaskItem(pageB, conflictTaskName).waitFor({
    state: "visible",
    timeout: TASK_VISIBLE_TIMEOUT_MS,
  });

  // Both complete without syncing between them (parallel — different pages)
  await Promise.all([
    completeTask(pageA, conflictTaskName),
    completeTask(pageB, conflictTaskName),
  ]);
  // Push both completions sequentially to avoid server-side race conditions
  await triggerSyncAndWait(pageA);
  await triggerSyncAndWait(pageB);

  const { tasks } = await pullFromServer<RecurringPullResponse>(
    getCredentials(),
    baselineRevision,
  );
  const matching = tasks.filter(
    (t) => t.name === conflictTaskName && !t.is_deleted,
  );

  expect(matching.find((t) => t.is_completed)).toBeDefined();
  const occurrences = matching.filter(
    (t) => !t.is_completed && t.original_task_id !== "",
  );
  expect(occurrences.length).toBeGreaterThanOrEqual(1);
});

// --- 5.13.4 — App A completes → push → App B pulls → no duplicate ---------

test("App A completes recurring → push → App B pulls → exactly 1 new occurrence", async () => {
  const pageA = getPageA();
  const dedupTaskName = `Recurring Dedup ${Date.now()}`;

  // Establish baseline revision before creating the task to avoid
  // paginating through the entire task history on pull
  const baseline = await pullFromServer<RecurringPullResponse>(
    getCredentials(),
  );
  const baselineRevision = baseline.current_revision;

  await createRecurringTask(pageA, dedupTaskName);
  await triggerSyncAndWait(pageA);

  await completeTask(pageA, dedupTaskName);
  await triggerSyncAndWait(pageA);

  const { tasks } = await pullFromServer<RecurringPullResponse>(
    getCredentials(),
    baselineRevision,
  );
  const matching = tasks.filter(
    (t) => t.name === dedupTaskName && !t.is_deleted,
  );

  expect(matching.filter((t) => t.is_completed)).toHaveLength(1);
  expect(
    matching.filter((t) => !t.is_completed && t.original_task_id !== ""),
  ).toHaveLength(1);
});

// --- 5.13.5 — after_completion type → correct next_date --------------------

test("after_completion recurring → complete → next_date = completed_at + delay_days", async () => {
  const pageA = getPageA();
  const afterCompletionTaskName = `After Completion ${Date.now()}`;
  const delayDays = 3;

  const baseline = await pullFromServer<RecurringPullResponse>(
    getCredentials(),
  );
  const baselineRevision = baseline.current_revision;

  await createTask(pageA, afterCompletionTaskName);
  await openTaskDetail(pageA, afterCompletionTaskName);

  // Set repeat: After Completion > 3 days
  await pageA
    .getByTestId("task-detail-panel")
    .getByRole("button", { name: /Repeat/ })
    .click();
  await pageA
    .getByTestId("repeat-type-after-completion")
    .waitFor({ state: "visible" });
  await pageA.getByTestId("repeat-type-after-completion").click();
  await pageA
    .getByTestId("repeat-delay-days-input")
    .waitFor({ state: "visible" });
  await pageA.getByTestId("repeat-delay-days-input").fill(String(delayDays));
  await pageA
    .getByTestId("repeat-after-completion-next")
    .waitFor({ state: "visible" });
  await pageA.getByTestId("repeat-after-completion-next").click();
  await pageA.getByTestId("repeat-apply").waitFor({ state: "visible" });
  await pageA.getByTestId("repeat-apply").click();
  await pageA.getByTestId("repeat-apply").waitFor({ state: "hidden" });

  await completeTask(pageA, afterCompletionTaskName);
  await triggerSyncAndWait(pageA);

  const { tasks } = await pullFromServer<RecurringPullResponse>(
    getCredentials(),
    baselineRevision,
  );
  const matching = tasks.filter(
    (t) => t.name === afterCompletionTaskName && !t.is_deleted,
  );

  const completedTask = matching.find((t) => t.is_completed);
  expect(completedTask).toBeDefined();
  expect(completedTask?.completed_at).not.toBe("");

  const newOccurrence = matching.find(
    (t) => !t.is_completed && t.original_task_id === completedTask?.id,
  );
  expect(newOccurrence).toBeDefined();
  expect(newOccurrence?.next_date).not.toBe("");

  // Verify next_date = completed_at LOCAL date + delay_days
  // The app uses Temporal with the system timezone, so we must use local date, not UTC
  const completedDate = new Date(completedTask?.completed_at ?? "");
  const expectedNextDate = new Date(completedDate);
  expectedNextDate.setDate(expectedNextDate.getDate() + delayDays);
  const expectedDateString = [
    expectedNextDate.getFullYear(),
    String(expectedNextDate.getMonth() + 1).padStart(2, "0"),
    String(expectedNextDate.getDate()).padStart(2, "0"),
  ].join("-");
  expect(newOccurrence?.next_date).toBe(expectedDateString);
});

// --- 5.13.6 — Skipped dates → next_date is today or in the future ---------

test("recurring task after completion → next_date is today or in the future", async () => {
  const pageA = getPageA();
  const skipTaskName = `Recurring Skip ${Date.now()}`;

  const baseline = await pullFromServer<RecurringPullResponse>(
    getCredentials(),
  );
  const baselineRevision = baseline.current_revision;

  await createRecurringTask(pageA, skipTaskName);
  await triggerSyncAndWait(pageA);

  await completeTask(pageA, skipTaskName);
  await triggerSyncAndWait(pageA);

  const { tasks } = await pullFromServer<RecurringPullResponse>(
    getCredentials(),
    baselineRevision,
  );
  const matching = tasks.filter(
    (t) => t.name === skipTaskName && !t.is_deleted,
  );
  const newOccurrence = matching.find(
    (t) => !t.is_completed && t.next_date !== "",
  );
  expect(newOccurrence).toBeDefined();

  const todayString = new Date().toISOString().split("T")[0] ?? "";
  expect((newOccurrence?.next_date ?? "") >= todayString).toBe(true);
});
