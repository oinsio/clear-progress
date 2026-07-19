// implements U2, UX3, FR2, NFR-REL1 of fix-stale-sync-overwrites
import { expect, test } from "@playwright/test";
import {
  createTask,
  findTaskItem,
  hideTaskUntil,
  openTaskDetail,
  unhideTask,
} from "../page-task-actions.js";
import {
  assertConverged,
  pullFromServer,
  setupTwoDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";
import {
  gotoTasksPage,
  TASK_VISIBLE_TIMEOUT_MS,
} from "./stale-recurring-helpers.js";

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

// Far enough in the future that the manual unhide is unambiguously "early" —
// no need for clock tricks since manual unhide works regardless of whether
// appear_date has passed (that's the whole point of FR2 vs FR1 auto-reveal).
const FUTURE_APPEAR_DATE_DAYS_AHEAD = 30;

interface ManualUnhidePullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
    is_hidden: boolean;
    appear_date: string;
    updated_at: string;
  }>;
  current_revision: number;
}

function futureIsoDate(daysAhead: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

/**
 * U2 / FR2 / NFR-REL1 — manual unhide before appear_date propagates to
 * another device.
 *
 * Scenario:
 * 1. Device A creates a non-recurring task; both devices sync and converge
 *    on a baseline (B sees the task).
 * 2. Device A hides the task with a future appear_date, then pushes. The
 *    server shows `is_hidden: true` with that appear_date.
 * 3. Device B pulls — the task is now hidden on B too (no longer in B's
 *    active task list).
 * 4. Device A manually unhides the task EARLY (well before appear_date),
 *    then pushes. The server shows `is_hidden: false`, `appear_date` cleared
 *    to `""`, and `updated_at` refreshed past its pre-unhide value — manual
 *    unhide is a real user edit (FR2), unlike auto-reveal (FR1).
 * 5. Device B pulls — the task is visible again on B (UX3).
 * 6. Convergence: device A, device B, and the server agree (NFR-REL1).
 */
test("A manually unhides a task before appear_date → B sees it visible again after sync", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const credentials = getCredentials();
  const taskName = `Manual Unhide Task ${Date.now()}`;
  const futureAppearDate = futureIsoDate(FUTURE_APPEAR_DATE_DAYS_AHEAD);

  const baseline = await pullFromServer<ManualUnhidePullResponse>(credentials);
  const baselineRevision = baseline.current_revision;

  // --- 1. A creates a task; both devices converge on a baseline ---
  await gotoTasksPage(pageA);
  await createTask(pageA, taskName);
  await triggerSyncAndWait(pageA);

  await gotoTasksPage(pageB);
  await triggerSyncAndWait(pageB);
  await findTaskItem(pageB, taskName).waitFor({
    state: "visible",
    timeout: TASK_VISIBLE_TIMEOUT_MS,
  });

  // --- 2. A hides the task with a future appear_date, then pushes ---
  await openTaskDetail(pageA, taskName);
  await hideTaskUntil(pageA, futureAppearDate);
  await triggerSyncAndWait(pageA);

  const { tasks: tasksAfterHide } =
    await pullFromServer<ManualUnhidePullResponse>(
      credentials,
      baselineRevision,
    );
  const hiddenOnServer = tasksAfterHide.find(
    (task) => task.name === taskName && !task.is_deleted,
  );
  expect(hiddenOnServer).toBeDefined();
  expect(hiddenOnServer?.is_hidden).toBe(true);
  expect(hiddenOnServer?.appear_date).toBe(futureAppearDate);
  const updatedAtAfterHide = hiddenOnServer?.updated_at ?? "";

  // --- 3. B pulls — task is now hidden on B too ---
  await triggerSyncAndWait(pageB);
  await gotoTasksPage(pageB);
  await expect(findTaskItem(pageB, taskName)).toHaveCount(0);

  // --- 4. A manually unhides the task EARLY (before appear_date), pushes ---
  await gotoTasksPage(pageA);
  // The task is hidden (future appear_date), so it is filtered out of the
  // active list. Reveal hidden tasks via the command-bar eye toggle before
  // opening its detail panel.
  await pageA.getByTestId("command-bar-eye-toggle").click();
  await findTaskItem(pageA, taskName).waitFor({
    state: "visible",
    timeout: TASK_VISIBLE_TIMEOUT_MS,
  });
  await openTaskDetail(pageA, taskName);
  await unhideTask(pageA);
  await triggerSyncAndWait(pageA);

  const { tasks: tasksAfterUnhide } =
    await pullFromServer<ManualUnhidePullResponse>(
      credentials,
      baselineRevision,
    );
  const unhiddenOnServer = tasksAfterUnhide.find(
    (task) => task.name === taskName && !task.is_deleted,
  );
  expect(unhiddenOnServer).toBeDefined();
  expect(unhiddenOnServer?.is_hidden).toBe(false);
  expect(unhiddenOnServer?.appear_date).toBe("");
  expect(unhiddenOnServer?.updated_at).not.toBe(updatedAtAfterHide);
  expect(Date.parse(unhiddenOnServer?.updated_at ?? "")).toBeGreaterThan(
    Date.parse(updatedAtAfterHide),
  );

  // --- 5. B pulls — task is visible again (UX3) ---
  await triggerSyncAndWait(pageB);
  await gotoTasksPage(pageB);
  await findTaskItem(pageB, taskName).waitFor({
    state: "visible",
    timeout: TASK_VISIBLE_TIMEOUT_MS,
  });

  // --- 6. Convergence: A, B, and the server agree (NFR-REL1) ---
  await assertConverged(pageA, pageB, credentials, "tasks");
});
