// implements U1, UX1, FR6, NFR-REL1 of fix-stale-sync-overwrites
import { expect, test } from "@playwright/test";
import { pullFromServer, setupTwoDeviceTest } from "../test-helpers.js";
import {
  runStaleRevealConvergence,
  runStaleRevealSetup,
} from "./stale-recurring-flow.js";
import {
  AFTER_COMPLETION_DELAY_DAYS,
  advanceClockPastDate,
  createAfterCompletionRecurringTask,
  type StaleRecurringPullResponse,
} from "./stale-recurring-helpers.js";

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

/**
 * U1 / FR6 — the reported bug, `after_completion` recurring model.
 *
 * Same shape as the `fixed` model scenario in
 * multi-device-stale-recurring-fixed.spec.ts, with one key difference: for
 * `after_completion`, the new occurrence's `next_date` is derived only from
 * `completed_at`'s local date + `delay_days` (never from `updated_at`), and
 * (with the default `advance_days: 0`) `appear_date` equals `next_date`
 * exactly — see `calculateNextDate`/`calculateAppearDate` in
 * `repeatRule.ts`. This test additionally asserts (FR6, regression guard)
 * that the surviving occurrence's `next_date` matches that formula exactly,
 * proving the stale-device merge/reveal machinery did not corrupt the
 * recurrence math for this model.
 *
 * Scenario:
 * 1. Device A creates an `after_completion` recurring task (delay_days =
 *    `AFTER_COMPLETION_DELAY_DAYS`); both devices sync and converge
 *    (baseline).
 * 2. Device B goes stale from this point on.
 * 3. Device A completes the task (creating a new hidden occurrence whose
 *    `appear_date` = `next_date` = completion date + delay_days, genuinely
 *    in the future) AND edits the description, then pushes.
 * 4. Device B comes back online; its browser clock is fast-forwarded past
 *    the new occurrence's `appear_date`.
 * 5. B pulls A's changes, auto-reveals the incoming hidden occurrence
 *    without bumping `updated_at` (FR1), pushes, and pulls once more.
 * 6. Convergence: both devices and the server agree — the completed
 *    occurrence stays completed, the surviving new occurrence carries A's
 *    newest description (FR3 dedup merge, FR5 LWW pull protection), and its
 *    `next_date` is exactly `completed_at` + `delay_days` — unaffected by
 *    the stale-device dance (FR6).
 */
test("A completes + edits recurring task, stale B auto-reveals on reconnect → both devices converge (after_completion model)", async () => {
  // Genuinely heavy: two devices, clock skew, auto-reveal, dedup merge and
  // several push/pull round-trips. Grant the extended (slow) timeout budget.
  test.slow();
  const pageA = getPageA();
  const pageB = getPageB();
  const credentials = getCredentials();
  const taskName = `Stale Reveal After Completion ${Date.now()}`;
  const freshDescription = `Freshest description from A ${Date.now()}`;

  // Baseline revision so we only inspect records created by this test.
  const baseline =
    await pullFromServer<StaleRecurringPullResponse>(credentials);
  const baselineRevision = baseline.current_revision;

  // --- 1. A creates an after_completion recurring task ---
  await createAfterCompletionRecurringTask(
    pageA,
    taskName,
    AFTER_COMPLETION_DELAY_DAYS,
  );

  // --- 2-4. Both converge, B goes stale, A edits + completes + pushes ---
  const { completedOnServer, newOccurrenceOnServer } =
    await runStaleRevealSetup(
      pageA,
      pageB,
      credentials,
      taskName,
      freshDescription,
      baselineRevision,
    );

  // For after_completion, completing must stamp `completed_at`.
  expect(completedOnServer.completed_at).not.toBe("");

  // FR6 regression guard: next_date = completed_at's local date + delay_days,
  // computed only from completed_at — never from updated_at.
  const completedDate = new Date(completedOnServer.completed_at);
  const expectedNextDate = new Date(completedDate);
  expectedNextDate.setDate(
    expectedNextDate.getDate() + AFTER_COMPLETION_DELAY_DAYS,
  );
  const expectedNextDateString = [
    expectedNextDate.getFullYear(),
    String(expectedNextDate.getMonth() + 1).padStart(2, "0"),
    String(expectedNextDate.getDate()).padStart(2, "0"),
  ].join("-");
  expect(newOccurrenceOnServer.next_date).toBe(expectedNextDateString);
  // advance_days defaults to 0, so appear_date === next_date exactly.
  expect(newOccurrenceOnServer.appear_date).toBe(expectedNextDateString);

  await advanceClockPastDate(pageB, newOccurrenceOnServer.appear_date);

  // --- 5-6. B auto-reveals, all three converge ---
  const finalNewOccurrence = await runStaleRevealConvergence(
    pageA,
    pageB,
    credentials,
    taskName,
    freshDescription,
    baselineRevision,
  );

  // FR6: the stale-device merge/reveal machinery did not corrupt the
  // recurrence math — next_date is still exactly completed_at + delay_days.
  expect(finalNewOccurrence.next_date).toBe(expectedNextDateString);
});
