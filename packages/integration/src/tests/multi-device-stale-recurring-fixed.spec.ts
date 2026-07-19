// implements U1, UX1, UX2, FR1, FR3, FR5, NFR-REL1, M1 of fix-stale-sync-overwrites
import { test } from "@playwright/test";
import { pullFromServer, setupTwoDeviceTest } from "../test-helpers.js";
import {
  runStaleRevealConvergence,
  runStaleRevealSetup,
} from "./stale-recurring-flow.js";
import {
  advanceClockPastDate,
  createRecurringTask,
  type StaleRecurringPullResponse,
} from "./stale-recurring-helpers.js";

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

/**
 * U1 / M1 — the reported bug, `fixed` recurring model.
 *
 * Scenario:
 * 1. Device A creates a daily `fixed` recurring task; both devices sync and
 *    fully converge (baseline).
 * 2. Device B goes stale from this point on — it does not sync again until
 *    step 5.
 * 3. Device A completes the task (creating a new hidden occurrence — a
 *    fresh daily-fixed occurrence's `appear_date` is always tomorrow, so
 *    `is_hidden: true` locally on A too, which is expected/normal) AND edits
 *    the description on the completed task, then pushes. The completed
 *    occurrence and the new occurrence both carry A's latest description
 *    (the new occurrence is created from the original's current fields at
 *    completion time).
 * 4. Device B — still on its stale pre-completion local copy — comes back
 *    online. Its browser clock is fast-forwarded past the new occurrence's
 *    `appear_date` (see `advanceClockPastDate`).
 * 5. B pulls A's changes. The incoming hidden occurrence is now revealable
 *    on B (`appear_date <= B's today`), so `HiddenTaskService` auto-reveals
 *    it locally: `is_hidden: false`, `syncStatus: "pending"`, `updated_at`
 *    UNCHANGED (FR1) — this is the exact system-mutation-masquerading-as-
 *    edit that used to corrupt sync. B then pushes and pulls once more.
 * 6. Convergence: both devices and the server agree — the completed
 *    occurrence stays completed, and both it and the surviving new
 *    occurrence carry A's newest description (FR3 dedup merge, FR5 LWW pull
 *    protection). No resurrection, no reverted description, no data loss.
 */
test("A completes + edits recurring task, stale B auto-reveals on reconnect → both devices converge (fixed model)", async () => {
  // Genuinely heavy: two devices, clock skew, auto-reveal, dedup merge and
  // several push/pull round-trips. Grant the extended (slow) timeout budget.
  test.slow();
  const pageA = getPageA();
  const pageB = getPageB();
  const credentials = getCredentials();
  const taskName = `Stale Reveal Fixed ${Date.now()}`;
  const freshDescription = `Freshest description from A ${Date.now()}`;

  // Baseline revision so we only inspect records created by this test.
  const baseline =
    await pullFromServer<StaleRecurringPullResponse>(credentials);
  const baselineRevision = baseline.current_revision;

  // --- 1. A creates a daily fixed recurring task ---
  await createRecurringTask(pageA, taskName);

  // --- 2-4. Both converge, B goes stale, A edits + completes + pushes ---
  const { newOccurrenceOnServer } = await runStaleRevealSetup(
    pageA,
    pageB,
    credentials,
    taskName,
    freshDescription,
    baselineRevision,
  );

  await advanceClockPastDate(pageB, newOccurrenceOnServer.appear_date);

  // --- 5-6. B auto-reveals, all three converge ---
  await runStaleRevealConvergence(
    pageA,
    pageB,
    credentials,
    taskName,
    freshDescription,
    baselineRevision,
  );
});
