// implements U3, FR4, NFR-REL1 of fix-stale-sync-overwrites
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  dragTaskOnto,
  findTaskItem,
  openTaskDetail,
  updateTaskDescription,
} from "../page-task-actions.js";
import {
  assertConverged,
  pullFromServer,
  pushToServer,
  setupTwoDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";
import {
  buildInboxTaskPayload,
  type RebalancePullResponse,
} from "./stale-rebalance-helpers.js";

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

// Mirrors SORT_ORDER_REBALANCE_THRESHOLD in packages/client/src/constants/index.ts
// (integration tests never import client internals — see module boundary rule).
const SORT_ORDER_REBALANCE_THRESHOLD = 10;

const TASK_VISIBLE_TIMEOUT_MS = 15_000;

/**
 * U3 / FR4 / NFR-REL1 — a rebalance triggered on a stale device does not
 * clobber content that a different device edited more recently.
 *
 * Mechanism: `TaskService.rebalanceBox()` (packages/client/src/services/TaskService.ts)
 * fires whenever a drag's freshly-generated `sort_order` key exceeds
 * SORT_ORDER_REBALANCE_THRESHOLD (10) chars, regardless of box size.
 * `fractional-indexing`'s `generateKeyBetween` grows a key by ~1 char when
 * inserting strictly between two keys differing only in their last
 * character, so seeding two adjacent 10-char keys and dragging a third task
 * between them reliably produces an 11-char key in one real drag — a
 * genuine `rebalanceBox` invocation via the actual UI code path.
 *
 * Scenario: (1) seed the inbox directly on the server (real drags can't
 * craft exact colliding keys) with a "dragged" task at the top, task X in
 * the middle (the one A will edit), and two adjacent 10-char anchor keys at
 * the bottom. (2) Both devices sync to a converged baseline. (3) Device B
 * goes stale — no more syncing until step 6. (4) Device A edits task X's
 * description and pushes, giving X a strictly newer `updated_at` on the
 * server. (5) Device B (still unaware of A's edit) drags "dragged" onto
 * anchorHigh's position, so anchorHigh shifts between "dragged" and
 * anchorLow and "dragged"'s new key lands strictly between the two anchor
 * keys. The resulting >10-char key triggers `rebalanceBox` for the whole
 * box: X and both anchors are marked `pending` locally on B WITHOUT their
 * `updated_at` being bumped (FR4); only "dragged" gets a fresh
 * `updated_at`. (6) Device B syncs (pull then push) — FR5's LWW pull
 * protection must let A's genuinely newer server copy of X win over B's
 * stale-but-`pending` local copy; the anchors and "dragged", untouched by
 * anyone but B's rebalance, keep their rebalanced `sort_order`. (7)
 * Convergence: device A, device B, and the server agree (NFR-REL1).
 */
test("Rebalance on a stale device does not clobber a task edited more recently elsewhere", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const credentials = getCredentials();

  const suffix = Date.now();
  const draggedName = `Rebalance Dragged ${suffix}`;
  const taskXName = `Rebalance TaskX ${suffix}`;
  const anchorHighName = `Rebalance AnchorHigh ${suffix}`;
  const anchorLowName = `Rebalance AnchorLow ${suffix}`;
  const freshDescription = `Freshest description from A ${suffix}`;

  const draggedId = randomUUID();
  const taskXId = randomUUID();
  const anchorHighId = randomUUID();
  const anchorLowId = randomUUID();

  const staleTimestamp = "2020-01-01T00:00:00.000Z";
  // 10-char anchor keys, one character apart at the last position: inserting
  // strictly between them via generateKeyBetween yields an 11-char key.
  const anchorLowKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD);
  const anchorHighKey = `${"a".repeat(SORT_ORDER_REBALANCE_THRESHOLD - 1)}b`;
  // DESC order (highest key first): dragged ("ac") > taskX ("ab") > anchorHigh > anchorLow.
  // These MUST be structurally valid fractional-indexing keys: taskX keeps its
  // key after convergence (A's edit wins LWW over B's rebalance), and it lands
  // on the shared inbox. Bare single letters like "z"/"m" pass the app's lax
  // `isValidFractionalKey` letter check but make `generateKeyBetween` throw
  // "invalid order key", which later breaks any inbox task creation on the
  // shared user (e.g. recurring-copy placement in other specs).
  const draggedKey = "ac";
  const taskXKey = "ab";

  const baseline = await pullFromServer<RebalancePullResponse>(credentials);
  const baselineRevision = baseline.current_revision;

  // --- 1. Seed the box directly on the server ---
  const seedTasks = [
    { id: draggedId, name: draggedName, sortOrder: draggedKey },
    { id: taskXId, name: taskXName, sortOrder: taskXKey },
    { id: anchorHighId, name: anchorHighName, sortOrder: anchorHighKey },
    { id: anchorLowId, name: anchorLowName, sortOrder: anchorLowKey },
  ];
  for (const seedTask of seedTasks) {
    await pushToServer(
      credentials,
      buildInboxTaskPayload({ ...seedTask, updatedAt: staleTimestamp }),
    );
  }

  // --- 2. Both devices sync to a converged baseline ---
  // The tasks are seeded in the inbox box, so drive the flow on the inbox
  // page (ActiveTasksPage shows only today/week/later boxes).
  await pageA.goto("/inbox");
  await pageA.waitForSelector('[data-testid="inbox-page"]');
  await triggerSyncAndWait(pageA);
  for (const name of [draggedName, taskXName, anchorHighName, anchorLowName]) {
    await findTaskItem(pageA, name).waitFor({
      state: "visible",
      timeout: TASK_VISIBLE_TIMEOUT_MS,
    });
  }

  await pageB.goto("/inbox");
  await pageB.waitForSelector('[data-testid="inbox-page"]');
  await triggerSyncAndWait(pageB);
  for (const name of [draggedName, taskXName, anchorHighName, anchorLowName]) {
    await findTaskItem(pageB, name).waitFor({
      state: "visible",
      timeout: TASK_VISIBLE_TIMEOUT_MS,
    });
  }

  // --- 3. Device B goes stale from here — no more syncing until step 6 ---

  // --- 4. Device A edits task X's description and pushes ---
  await openTaskDetail(pageA, taskXName);
  await updateTaskDescription(pageA, freshDescription);
  await triggerSyncAndWait(pageA);

  const { tasks: tasksAfterEdit } = await pullFromServer<RebalancePullResponse>(
    credentials,
    baselineRevision,
  );
  const taskXAfterEdit = tasksAfterEdit.find(
    (task) => task.id === taskXId && !task.is_deleted,
  );
  expect(taskXAfterEdit).toBeDefined();
  expect(taskXAfterEdit?.description).toBe(freshDescription);
  expect(taskXAfterEdit?.updated_at).not.toBe(staleTimestamp);

  // --- 5. Device B (still stale) drags "dragged" onto anchorHigh's
  //        position, landing it strictly between the two anchor keys and
  //        triggering rebalanceBox for the whole box ---
  await dragTaskOnto(pageB, draggedName, anchorHighName);

  // --- 6. Device B syncs — FR5 LWW pull protection must let A's newer
  //        task X win over B's stale-but-pending rebalanced copy ---
  await triggerSyncAndWait(pageB);

  // Device A pulls B's rebalance push so all three agree. A's copies of the
  // untouched tasks are `synced`, so the normal revision-based pull applies
  // B's rebalanced sort keys; A's own edited task X (newer `updated_at`) is
  // unaffected. Without this, A converges only if a background auto-sync
  // happens to fire before the assertion — flaky under load.
  await triggerSyncAndWait(pageA);

  // --- 7. Convergence: A, B, and the server agree (NFR-REL1) ---
  await assertConverged(pageA, pageB, credentials, "tasks");

  const { tasks: finalTasks } = await pullFromServer<RebalancePullResponse>(
    credentials,
    baselineRevision,
  );
  const finalTaskX = finalTasks.find(
    (task) => task.id === taskXId && !task.is_deleted,
  );
  const finalAnchorHigh = finalTasks.find(
    (task) => task.id === anchorHighId && !task.is_deleted,
  );
  const finalAnchorLow = finalTasks.find(
    (task) => task.id === anchorLowId && !task.is_deleted,
  );
  const finalDragged = finalTasks.find(
    (task) => task.id === draggedId && !task.is_deleted,
  );

  // A's newer content survives — B's rebalance-caused pending flag on task X
  // did not block the pull from applying A's genuinely newer server copy.
  expect(finalTaskX?.description).toBe(freshDescription);
  expect(finalTaskX?.updated_at).not.toBe(staleTimestamp);

  // The other rebalanced tasks (untouched by anyone but B's rebalance) keep
  // freshly-generated, non-colliding sort keys — rebalance's own effect is
  // not lost. All four keys must be distinct after rebalancing.
  const allFinalKeys = [
    finalDragged?.sort_order,
    finalTaskX?.sort_order,
    finalAnchorHigh?.sort_order,
    finalAnchorLow?.sort_order,
  ];
  expect(
    allFinalKeys.every((key) => typeof key === "string" && key.length > 0),
  ).toBe(true);
  expect(new Set(allFinalKeys).size).toBe(allFinalKeys.length);
});
