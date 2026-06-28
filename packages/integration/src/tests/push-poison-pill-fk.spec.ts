// implements M1 of fix-push-poison-pill
// Test: purge goal on device A → push task with stale goal_id on B → self-heal → retry succeeds
import { expect, test } from "@playwright/test";
import {
  createGoal,
  createTask,
  navigateToGoals,
  openGoalDetail,
  openTaskDetail,
} from "../page-actions.js";
import {
  pullFromServer,
  purgeOnServer,
  setupTwoDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

interface FkPullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    goal_id: string;
    is_deleted: boolean;
  }>;
  goals: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// 9.1 — Purge goal on device A → push task with stale goal_id on B
// Device A creates goal + task, syncs, then deletes goal, syncs, purges.
// Device B (offline) assigns the same goal to a new task, then syncs.
// The FK violation should be self-healed: goal_id cleared, task synced.
// ---------------------------------------------------------------------------
test("purge goal on device A → push task with stale goal_id on B → self-heal → retry succeeds", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const credentials = getCredentials();

  const goalName = `FK Test Goal ${Date.now()}`;

  // Step 1: Device A creates goal and syncs
  await navigateToGoals(pageA);
  await createGoal(pageA, goalName);
  await triggerSyncAndWait(pageA);

  // Step 2: Device B syncs to receive the goal
  await navigateToGoals(pageB);
  await triggerSyncAndWait(pageB);

  // Step 3: Get goal ID from server
  const initialPull = await pullFromServer<FkPullResponse>(credentials);
  const serverGoal = initialPull.goals.find(
    (goal) => goal.name === goalName && !goal.is_deleted,
  );
  expect(serverGoal).toBeDefined();

  // Step 4: Device A deletes the goal + syncs + purge
  await navigateToGoals(pageA);
  await openGoalDetail(pageA, goalName);
  await pageA.getByTestId("edit-goal-button").click();
  await pageA.getByTestId("goal-delete-button").click();
  await pageA.waitForSelector('[data-testid="goal-delete-confirm"]');
  await pageA.getByTestId("goal-delete-confirm-btn").click();
  await pageA.waitForSelector('[data-testid="goals-page"]');
  await triggerSyncAndWait(pageA);

  // Purge to physically remove the goal from DB (triggers FK issue)
  await purgeOnServer(credentials);

  // Step 5: Device B creates a task and assigns the now-purged goal
  // The goal still exists in B's IndexedDB from step 2
  await pageB.goto("/tasks");
  await pageB.waitForSelector('[data-testid="active-tasks-page"]');
  const taskNameB = `FK Task B ${Date.now()}`;
  await createTask(pageB, taskNameB);

  // Assign the (purged) goal to the task via the detail panel
  await openTaskDetail(pageB, taskNameB);
  await pageB.getByTestId("task-detail-goal-select").click();
  // The goal may still be visible in B's local data
  const goalOption = pageB.locator(`text=${goalName}`);
  if (await goalOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await goalOption.click();
  }

  // Step 6: Device B syncs — FK violation → self-heal → retry
  await triggerSyncAndWait(pageB);

  // Step 7: Verify the task was pushed successfully (goal_id cleared)
  const finalPull = await pullFromServer<FkPullResponse>(credentials);
  const finalTask = finalPull.tasks.find(
    (task) => task.name === taskNameB && !task.is_deleted,
  );
  expect(finalTask).toBeDefined();
  // goal_id should be cleared (empty string) after self-healing
  expect(finalTask?.goal_id).toBe("");
});
