// implements U3, FR4 of fix-stale-sync-overwrites
import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  findTaskItem,
  openTaskDetail,
  updateTaskDescription,
} from "../page-actions.js";
import {
  assertConverged,
  pullFromServer,
  pushToServer,
  setupTwoDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

// Mirrors SORT_ORDER_REBALANCE_THRESHOLD in packages/client/src/constants/index.ts
// (integration tests never import client internals — see module boundary rule).
const SORT_ORDER_REBALANCE_THRESHOLD = 10;

const TASK_VISIBLE_TIMEOUT_MS = 15_000;
const DRAG_STEPS = 12;
const DRAG_SETTLE_MS = 300;

interface RebalancePullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    description: string;
    box: string;
    sort_order: string;
    is_deleted: boolean;
    updated_at: string;
  }>;
  current_revision: number;
}

/**
 * Builds a full push payload carrying a single "inbox" task with an explicit
 * `sort_order`, so tests can pre-seed keys near/at the rebalance threshold
 * without going through the app's own key-generation logic.
 */
function buildInboxTaskPayload(options: {
  id: string;
  name: string;
  sortOrder: string;
  updatedAt: string;
}): Record<string, unknown[]> {
  return {
    tasks: [
      {
        id: options.id,
        name: options.name,
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
        is_hidden: false,
        original_task_id: "",
        sort_order: options.sortOrder,
        created_at: options.updatedAt,
        updated_at: options.updatedAt,
        version: 1,
        revision: 0,
      },
    ],
    goals: [],
    ideas: [],
    contexts: [],
    categories: [],
    checklist_items: [],
    attachments: [],
    settings: [],
  };
}

/**
 * Drags a task item (located by its drag handle) vertically onto another
 * task item's position, using low-level mouse events so dnd-kit's
 * PointerSensor (activation distance 8px) reliably picks up the gesture.
 */
async function dragTaskOnto(
  page: Page,
  sourceTaskName: string,
  targetTaskName: string,
): Promise<void> {
  const sourceHandle = findTaskItem(page, sourceTaskName).getByRole("button", {
    name: /drag/i,
  });
  const targetItem = findTaskItem(page, targetTaskName);

  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await targetItem.boundingBox();
  if (!sourceBox || !targetBox) {
    throw new Error("dragTaskOnto: could not resolve bounding boxes");
  }

  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let step = 1; step <= DRAG_STEPS; step++) {
    const progress = step / DRAG_STEPS;
    await page.mouse.move(
      startX + (endX - startX) * progress,
      startY + (endY - startY) * progress,
    );
  }
  await page.mouse.up();
  await page.waitForTimeout(DRAG_SETTLE_MS);
}

/**
 * U3 / FR4 / NFR-REL1 — a rebalance triggered on a stale device does not
 * clobber content that a different device edited more recently.
 *
 * Mechanism: `TaskService.rebalanceBox()` (packages/client/src/services/TaskService.ts)
 * fires whenever a drag's freshly-generated `sort_order` key exceeds
 * SORT_ORDER_REBALANCE_THRESHOLD (10) characters — regardless of how many
 * tasks are in the box. `fractional-indexing`'s `generateKeyBetween` grows a
 * key by roughly one character whenever it inserts strictly between two
 * keys that already differ only in their last character, so seeding two
 * adjacent 10-char keys and dragging a third task to land exactly between
 * them reliably produces an 11-char key in a single real drag — a genuine
 * `rebalanceBox` invocation via the actual UI code path, not a mocked one.
 *
 * Scenario:
 * 1. Seed the inbox box directly on the server (bypassing the UI, since
 *    crafting exact colliding sort keys via real drags would need many
 *    sequential drags): a "dragged" task at the top (highest key), task X
 *    in the middle (the one A will edit), and two adjacent anchor tasks
 *    with 10-char keys one character apart at the bottom.
 * 2. Both devices sync to a converged baseline including all four tasks.
 * 3. Device B goes stale — no more syncing until step 6.
 * 4. Device A edits task X's description and pushes — X gets a strictly
 *    newer `updated_at` on the server.
 * 5. Device B (still unaware of A's edit) drags "dragged" down onto
 *    "anchorHigh"'s position — anchorHigh shifts down to sit between
 *    "dragged" and "anchorLow", so "dragged"'s new key is generated
 *    strictly between anchorLow and anchorHigh. The resulting >10-char key
 *    triggers `rebalanceBox` for the whole box: X and both anchors are marked
 *    `pending` locally on B WITHOUT their `updated_at` being bumped (FR4);
 *    only "dragged" (the task the user actually moved) gets a fresh
 *    `updated_at`.
 * 6. Device B syncs (pull then push). FR5's LWW pull protection must let
 *    A's genuinely newer server copy of X win over B's stale-but-`pending`
 *    local copy — B's rebalance-caused `pending` flag must not block it.
 *    The anchors and "dragged", which nobody else edited, keep their
 *    rebalanced `sort_order` (rebalance's own effect survives).
 * 7. Convergence: device A, device B, and the server agree (NFR-REL1).
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
  // DESC order (highest key first): dragged ("z") > taskX ("m") > anchorHigh > anchorLow.
  const draggedKey = "z";
  const taskXKey = "m";

  const baseline = await pullFromServer<RebalancePullResponse>(credentials);
  const baselineRevision = baseline.current_revision;

  // --- 1. Seed the box directly on the server ---
  await pushToServer(
    credentials,
    buildInboxTaskPayload({
      id: draggedId,
      name: draggedName,
      sortOrder: draggedKey,
      updatedAt: staleTimestamp,
    }),
  );
  await pushToServer(
    credentials,
    buildInboxTaskPayload({
      id: taskXId,
      name: taskXName,
      sortOrder: taskXKey,
      updatedAt: staleTimestamp,
    }),
  );
  await pushToServer(
    credentials,
    buildInboxTaskPayload({
      id: anchorHighId,
      name: anchorHighName,
      sortOrder: anchorHighKey,
      updatedAt: staleTimestamp,
    }),
  );
  await pushToServer(
    credentials,
    buildInboxTaskPayload({
      id: anchorLowId,
      name: anchorLowName,
      sortOrder: anchorLowKey,
      updatedAt: staleTimestamp,
    }),
  );

  // --- 2. Both devices sync to a converged baseline ---
  await pageA.goto("/tasks");
  await pageA.waitForSelector('[data-testid="active-tasks-page"]');
  await triggerSyncAndWait(pageA);
  for (const name of [draggedName, taskXName, anchorHighName, anchorLowName]) {
    await findTaskItem(pageA, name).waitFor({
      state: "visible",
      timeout: TASK_VISIBLE_TIMEOUT_MS,
    });
  }

  await pageB.goto("/tasks");
  await pageB.waitForSelector('[data-testid="active-tasks-page"]');
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
