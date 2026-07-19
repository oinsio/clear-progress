// implements U1, UX1, UX2, FR1, FR3, FR5, FR6 of fix-stale-sync-overwrites
import type { Page } from "@playwright/test";
import {
  createTask,
  findTaskItem,
  openTaskDetail,
} from "../page-task-actions.js";

export interface StaleRecurringPullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    description: string;
    is_deleted: boolean;
    is_completed: boolean;
    is_hidden: boolean;
    repeat_rule: string;
    next_date: string;
    appear_date: string;
    original_task_id: string;
    completed_at: string;
    updated_at: string;
  }>;
  current_revision: number;
}

const COMPLETE_SETTLE_MS = 300;
export const TASK_VISIBLE_TIMEOUT_MS = 15_000;
const SYNC_BUTTON_TEST_ID = "sidebar-sync";
const LAST_SYNC_KEY = "last_sync";
const POST_ADVANCE_SYNC_TIMEOUT_MS = 90_000;
const POST_ADVANCE_SYNC_CLICK_WAIT_MS = 8_000;
const POST_ADVANCE_SYNC_POLL_MS = 500;
const POST_ADVANCE_SYNC_CLICK_TIMEOUT_MS = 5_000;
const POST_ADVANCE_SYNC_IDLE_TIMEOUT_MS = 10_000;
const POST_ADVANCE_SYNC_REVEAL_SETTLE_MS = 750;
// >=2 days guarantees the new occurrence's appear_date (= completed_at's
// local date + delay_days, since advance_days defaults to 0) is strictly
// after "today" even accounting for test execution time near a day boundary.
export const AFTER_COMPLETION_DELAY_DAYS = 2;

const REPEAT_TYPE_FIXED_TEST_ID = "repeat-type-fixed";
const REPEAT_TYPE_AFTER_COMPLETION_TEST_ID = "repeat-type-after-completion";
const REPEAT_APPLY_TEST_ID = "repeat-apply";

/** Opens the Repeat selector from the task detail panel and selects the given
 * repeat-type option. Shared prologue of the fixed / after-completion flows. */
async function openRepeatSelector(
  testPage: Page,
  repeatTypeTestId: string,
): Promise<void> {
  await testPage
    .getByTestId("task-detail-panel")
    .getByRole("button", { name: /Repeat/ })
    .click();
  await testPage.getByTestId(repeatTypeTestId).waitFor({ state: "visible" });
  await testPage.getByTestId(repeatTypeTestId).click();
}

/** Applies the configured repeat rule and waits for the selector to close.
 * Shared epilogue of the fixed / after-completion flows. */
async function applyRepeatRule(testPage: Page): Promise<void> {
  await testPage
    .getByTestId(REPEAT_APPLY_TEST_ID)
    .waitFor({ state: "visible" });
  await testPage.getByTestId(REPEAT_APPLY_TEST_ID).click();
  await testPage.getByTestId(REPEAT_APPLY_TEST_ID).waitFor({ state: "hidden" });
}

/** Sets up a daily `fixed` repeat rule from the task detail panel. Shared by
 * the multi-device recurring and stale-reveal specs. */
async function setFixedDailyRepeat(testPage: Page): Promise<void> {
  await openRepeatSelector(testPage, REPEAT_TYPE_FIXED_TEST_ID);
  await testPage
    .getByTestId("repeat-frequency-daily")
    .waitFor({ state: "visible" });
  await testPage.getByTestId("repeat-frequency-daily").click();
  await testPage.getByTestId("repeat-fixed-next").waitFor({ state: "visible" });
  await testPage.getByTestId("repeat-fixed-next").click();
  await applyRepeatRule(testPage);
}

export async function createRecurringTask(
  testPage: Page,
  taskName: string,
): Promise<void> {
  await createTask(testPage, taskName);
  await openTaskDetail(testPage, taskName);
  await setFixedDailyRepeat(testPage);
}

/**
 * Sets up an `after_completion` repeat rule from the task detail panel, with
 * the given `delayDays` and the default `advance_days` (0, left untouched on
 * the placement step). Used by the multi-device-recurring spec's
 * "after_completion recurring → complete → next_date = completed_at +
 * delay_days" test and the stale-reveal specs. With `advance_days: 0`,
 * `appear_date` equals `next_date` (see `calculateAppearDate`), so the new
 * occurrence's `appear_date` is simply `completed_at`'s local date +
 * `delayDays`.
 */
async function setAfterCompletionRepeat(
  testPage: Page,
  delayDays: number,
): Promise<void> {
  await openRepeatSelector(testPage, REPEAT_TYPE_AFTER_COMPLETION_TEST_ID);
  await testPage
    .getByTestId("repeat-delay-days-input")
    .waitFor({ state: "visible" });
  await testPage.getByTestId("repeat-delay-days-input").fill(String(delayDays));
  await testPage
    .getByTestId("repeat-after-completion-next")
    .waitFor({ state: "visible" });
  await testPage.getByTestId("repeat-after-completion-next").click();
  await applyRepeatRule(testPage);
}

export async function createAfterCompletionRecurringTask(
  testPage: Page,
  taskName: string,
  delayDays: number,
): Promise<void> {
  await createTask(testPage, taskName);
  await openTaskDetail(testPage, taskName);
  await setAfterCompletionRepeat(testPage, delayDays);
}

/**
 * Navigates a device to the active tasks page and waits for it to render.
 * Shared across the multi-device stale-reveal / manual-unhide specs so the
 * two-line goto + wait pair is defined once.
 */
export async function gotoTasksPage(testPage: Page): Promise<void> {
  await testPage.goto("/tasks");
  await testPage.waitForSelector('[data-testid="active-tasks-page"]');
}

export async function completeTask(
  testPage: Page,
  taskName: string,
): Promise<void> {
  await findTaskItem(testPage, taskName)
    .getByRole("button", { name: /Complete task/i })
    .click();
  // Recurring tasks create a new occurrence with the same name immediately,
  // so we cannot wait for the task item to become hidden.
  await testPage.waitForTimeout(COMPLETE_SETTLE_MS);
}

/**
 * Simulates a stale device being opened a day later: sets the browser clock
 * past `isoDate` (local noon) so day-boundary comparisons (`appear_date <=
 * today`) treat that date as "today or earlier".
 *
 * Method matters. `setSystemTime` leaves the fake clock paused, freezing every
 * `setTimeout`/`setInterval` so the sync button's spin→idle cycle never
 * completes. `setFixedTime` pins `Date.now()` to a constant, so the
 * `toISOTimestamp()`-based `last_sync` marker never changes and sync-completion
 * detection never fires. `install({ time }) + resume` sets the clock to the
 * target date AND lets it keep ticking in real time: `Date` reads the future
 * (so `HiddenTaskService` reveals the occurrence), timers run (responsive UI),
 * and `last_sync` advances between syncs. The backend issues long-lived JWTs
 * (see `GOTRUE_JWT_EXP` in docker-compose) so the day-long jump never expires
 * the token — avoiding a refresh that would race under the faked clock.
 */
export async function advanceClockPastDate(
  page: Page,
  isoDate: string,
): Promise<void> {
  await page.clock.install({ time: new Date(`${isoDate}T12:00:00Z`) });
  await page.clock.resume();
}

/** Waits (best-effort) for the sidebar sync button to stop spinning, so a
 * subsequent click is not swallowed by the app's in-flight-sync mutex. */
async function waitForSyncButtonIdle(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="sidebar-sync"]');
        if (!button) return false;
        const icon = button.querySelector("svg");
        return icon !== null && !icon.classList.contains("animate-spin");
      },
      undefined,
      { timeout: POST_ADVANCE_SYNC_IDLE_TIMEOUT_MS, polling: 200 },
    )
    .catch(() => {});
}

/**
 * Syncs a page whose clock was advanced via `advanceClockPastDate`, detecting
 * completion by polling the `last_sync` marker for a change rather than by
 * watching the sync button's spin animation.
 *
 * Why not the shared `triggerSyncAndWait`: its success gate relies on catching
 * a spin→idle cycle in a short window (missed after the boot JWT refresh), and
 * its interval-clearing step calls `window.setTimeout` — faked by the installed
 * clock — inside a `page.evaluate` that then hangs. Polling `last_sync`, which
 * the resumed clock keeps advancing on every completed sync, sidesteps both.
 *
 * Each outer iteration: wait for any in-flight sync to settle (so the click is
 * not swallowed by the app's `isSyncingRef` mutex), re-read the baseline, click
 * (best-effort, with a per-click timeout so a briefly non-actionable button
 * cannot block past the deadline), then poll for a change. On success settle
 * briefly so the `sync_complete` reveal handler persists its pending write
 * before the caller triggers the next (push) sync.
 */
export async function syncAfterClockAdvance(page: Page): Promise<void> {
  const deadline = Date.now() + POST_ADVANCE_SYNC_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await waitForSyncButtonIdle(page);
    const previousSync = await page.evaluate(
      (key) => localStorage.getItem(key),
      LAST_SYNC_KEY,
    );
    await page
      .getByTestId(SYNC_BUTTON_TEST_ID)
      .first()
      .click({ timeout: POST_ADVANCE_SYNC_CLICK_TIMEOUT_MS })
      .catch(() => {});
    const clickDeadline = Date.now() + POST_ADVANCE_SYNC_CLICK_WAIT_MS;
    while (Date.now() < clickDeadline) {
      const currentSync = await page.evaluate(
        (key) => localStorage.getItem(key),
        LAST_SYNC_KEY,
      );
      if (currentSync !== null && currentSync !== previousSync) {
        await new Promise((resolve) =>
          setTimeout(resolve, POST_ADVANCE_SYNC_REVEAL_SETTLE_MS),
        );
        return;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, POST_ADVANCE_SYNC_POLL_MS),
      );
    }
  }
  throw new Error("syncAfterClockAdvance: last_sync did not advance in time");
}
