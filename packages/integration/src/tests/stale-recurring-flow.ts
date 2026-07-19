// implements U1, UX1, UX2, FR1, FR3, FR5, FR6, NFR-REL1 of fix-stale-sync-overwrites
import { expect, type Page } from "@playwright/test";
import {
  findTaskItem,
  openTaskDetail,
  updateTaskDescription,
} from "../page-task-actions.js";
import {
  assertConverged,
  pullFromServer,
  type ServerCallCredentials,
  triggerSyncAndWait,
} from "../test-helpers.js";
import {
  completeTask,
  gotoTasksPage,
  type StaleRecurringPullResponse,
  syncAfterClockAdvance,
  TASK_VISIBLE_TIMEOUT_MS,
} from "./stale-recurring-helpers.js";

type StaleRecurringTask = StaleRecurringPullResponse["tasks"][number];

/**
 * Shared setup phase of the stale-reveal specs (fixed / after_completion),
 * covering steps 1-4 of both scenarios. The caller creates the recurring task
 * (choosing the repeat model) BEFORE calling this; everything downstream is
 * model-agnostic.
 *
 * 1. Device A syncs the freshly-created task; device B converges (baseline).
 * 2. Device B goes stale — no more syncing until the convergence phase.
 * 3. Device A edits the description, then completes the task, then pushes. The
 *    edit must precede completion: the new occurrence is cloned from the
 *    original's fields at completion time (see
 *    `TaskService.createRecurringCopy`), so both the completed occurrence and
 *    the new occurrence carry A's latest description. Waiting for the amber
 *    `pending` border guarantees the async blur-write landed in IndexedDB
 *    before completion reads the record.
 * 4. Pull A's push from the server and locate the completed occurrence and the
 *    new hidden occurrence, asserting the invariants common to both models.
 *
 * Returns both server records so the caller can add model-specific assertions
 * (e.g. `completed_at`, FR6 `next_date`) and advance B's clock past the new
 * occurrence's `appear_date`.
 *
 * Implements U1, UX1, FR1, FR3, FR5 of fix-stale-sync-overwrites.
 */
export async function runStaleRevealSetup(
  pageA: Page,
  pageB: Page,
  credentials: ServerCallCredentials,
  taskName: string,
  freshDescription: string,
  baselineRevision: number,
): Promise<{
  completedOnServer: StaleRecurringTask;
  newOccurrenceOnServer: StaleRecurringTask;
}> {
  await triggerSyncAndWait(pageA);

  await gotoTasksPage(pageB);
  await triggerSyncAndWait(pageB);
  await pageB.reload();
  await pageB.waitForSelector('[data-testid="active-tasks-page"]');
  await findTaskItem(pageB, taskName).waitFor({
    state: "visible",
    timeout: TASK_VISIBLE_TIMEOUT_MS,
  });

  // --- 3. A edits the description, then completes the task, then pushes. ---
  await gotoTasksPage(pageA);
  await findTaskItem(pageA, taskName).waitFor({
    state: "visible",
    timeout: TASK_VISIBLE_TIMEOUT_MS,
  });
  await openTaskDetail(pageA, taskName);
  await updateTaskDescription(pageA, freshDescription);
  await expect(findTaskItem(pageA, taskName)).toHaveClass(/border-l-amber-400/);
  await completeTask(pageA, taskName);
  await triggerSyncAndWait(pageA);

  // --- 4. B comes back online after (simulated) time has passed ---
  const { tasks: tasksAfterCompletion } =
    await pullFromServer<StaleRecurringPullResponse>(
      credentials,
      baselineRevision,
    );
  const matchingAfterCompletion = tasksAfterCompletion.filter(
    (task) => task.name === taskName && !task.is_deleted,
  );
  const completedOnServer = matchingAfterCompletion.find(
    (task) => task.is_completed,
  );
  expect(completedOnServer).toBeDefined();
  expect(completedOnServer?.description).toBe(freshDescription);
  const newOccurrenceOnServer = matchingAfterCompletion.find(
    (task) =>
      !task.is_completed && task.original_task_id === completedOnServer?.id,
  );
  expect(newOccurrenceOnServer).toBeDefined();
  expect(newOccurrenceOnServer?.is_hidden).toBe(true);

  return {
    completedOnServer: completedOnServer as StaleRecurringTask,
    newOccurrenceOnServer: newOccurrenceOnServer as StaleRecurringTask,
  };
}

/**
 * Shared convergence phase of the stale-reveal specs (fixed / after_completion),
 * covering steps 5-6 of both scenarios. The caller must have advanced B's clock
 * past the new occurrence's `appear_date` (via `advanceClockPastDate`) BEFORE
 * calling this.
 *
 * 5. Device B pulls A's changes, auto-reveals the incoming hidden occurrence
 *    without bumping `updated_at` (FR1), pushes its reveal-only state, and
 *    pulls once more. Uses the clock-aware sync helper (see
 *    `syncAfterClockAdvance`). Device A then pulls B's reveal-push so all
 *    three agree.
 * 6. Convergence: A, B, and the server agree (scoped to this test's task, since
 *    a clock-advanced device also reveals other specs' hidden occurrences on
 *    the shared user — harness noise). The completed occurrence stays completed
 *    (UX1) and exactly one surviving new occurrence carries A's newest
 *    description (UX2, FR3, FR5).
 *
 * Returns the single surviving new occurrence so the caller can add
 * model-specific assertions (e.g. FR6 `next_date`).
 *
 * Implements UX1, UX2, FR1, FR3, FR5, NFR-REL1 of fix-stale-sync-overwrites.
 */
export async function runStaleRevealConvergence(
  pageA: Page,
  pageB: Page,
  credentials: ServerCallCredentials,
  taskName: string,
  freshDescription: string,
  baselineRevision: number,
): Promise<StaleRecurringTask> {
  await syncAfterClockAdvance(pageB);
  await syncAfterClockAdvance(pageB);

  await triggerSyncAndWait(pageA);

  await assertConverged(
    pageA,
    pageB,
    credentials,
    "tasks",
    (record) => record.name === taskName,
  );

  const { tasks: finalTasks } =
    await pullFromServer<StaleRecurringPullResponse>(
      credentials,
      baselineRevision,
    );
  const finalMatching = finalTasks.filter(
    (task) => task.name === taskName && !task.is_deleted,
  );

  // The completed occurrence stays completed — no resurrection (UX1).
  const finalCompleted = finalMatching.filter((task) => task.is_completed);
  expect(finalCompleted).toHaveLength(1);
  expect(finalCompleted[0]?.completed_at).not.toBe("");
  expect(finalCompleted[0]?.description).toBe(freshDescription);

  // Exactly one surviving new occurrence, carrying the newest description —
  // no reverted description, no duplicate/deleted fresh copy (UX2).
  const finalNewOccurrences = finalMatching.filter(
    (task) => !task.is_completed && task.original_task_id !== "",
  );
  expect(finalNewOccurrences).toHaveLength(1);
  expect(finalNewOccurrences[0]?.description).toBe(freshDescription);

  return finalNewOccurrences[0] as StaleRecurringTask;
}
