// implements FR6, FR8 of add-supabase-integration-tests
import { expect, test } from "@playwright/test";
import {
  createGoal,
  deleteGoalFromDetail,
  navigateToGoals,
  openGoalDetail,
} from "../page-actions.js";
import {
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

// State carried between sequential tests (5.3.1 → 5.3.2 → 5.3.3)
let createdGoalName: string;
let createdGoalId: string;

interface GoalsPullResponse {
  ok: boolean;
  goals: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    cover_file_id: string;
    sort_order: number;
    is_deleted: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// 5.3.1 — Create goal locally → push → verify goal exists on server
// ---------------------------------------------------------------------------
test("create goal locally → push → verify goal exists on server", async () => {
  const page = getPage();
  createdGoalName = `Sync Test Goal ${Date.now()}`;

  // Navigate to Goals page and add a goal
  await navigateToGoals(page);
  await createGoal(page, createdGoalName);

  // Trigger push + pull immediately instead of waiting for the debounce process
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<GoalsPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverGoal = pullResponse.goals.find(
    (goal) => goal.name === createdGoalName && !goal.is_deleted,
  );
  expect(serverGoal).toBeDefined();
  if (!serverGoal) return;
  expect(serverGoal.is_deleted).toBe(false);
  expect(serverGoal.status).toBe("planning");

  createdGoalId = serverGoal.id;
});

// ---------------------------------------------------------------------------
// 5.3.2 — Modify goal (title, status) → push → pull → verify changes
// ---------------------------------------------------------------------------
test("modify goal (title, status) → push → pull → verify changes", async () => {
  const page = getPage();
  // Navigate to the goal detail page
  await openGoalDetail(page, createdGoalName);

  // Enter edit mode and change name + status
  await page.getByTestId("edit-goal-button").click();
  const updatedGoalName = `Updated Goal ${Date.now()}`;
  await page.getByTestId("goal-name-input").fill(updatedGoalName);

  // Change status to "in_progress" (4th button, index 3):
  // Order: cancelled(0), paused(1), planning(2), in_progress(3), completed(4)
  const statusButtons = page
    .getByTestId("goal-card")
    .locator(".flex.rounded-full.border-accent button");
  await statusButtons.nth(3).click();

  // Save changes
  await page.getByTestId("goal-save-button").click();

  // Update shared state for subsequent tests
  createdGoalName = updatedGoalName;

  // Push changes to server
  await triggerSyncAndWait(page);

  // Verify server-side state
  const pullResponse = await pullFromServer<GoalsPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverGoal = pullResponse.goals.find(
    (goal) => goal.id === createdGoalId,
  );
  expect(serverGoal).toBeDefined();
  if (!serverGoal) return;
  expect(serverGoal.name).toBe(updatedGoalName);
  expect(serverGoal.status).toBe("in_progress");
  expect(serverGoal.is_deleted).toBe(false);

  // Navigate back to /goals for subsequent tests
  await navigateToGoals(page);
});

// ---------------------------------------------------------------------------
// 5.3.3 — Soft-delete goal → push → pull → verify is_deleted
// ---------------------------------------------------------------------------
test("soft-delete goal → push → pull → verify is_deleted", async () => {
  const page = getPage();
  // Navigate to the goal detail page and delete
  await openGoalDetail(page, createdGoalName);
  await deleteGoalFromDetail(page);

  // Push changes to server
  await triggerSyncAndWait(page);

  // Verify server-side state — goal should be soft-deleted
  const pullResponse = await pullFromServer<GoalsPullResponse>(
    getCredentials(),
  );
  const serverGoal = pullResponse.goals.find(
    (goal) => goal.id === createdGoalId,
  );
  expect(serverGoal).toBeDefined();
  expect(serverGoal?.is_deleted).toBe(true);
});
