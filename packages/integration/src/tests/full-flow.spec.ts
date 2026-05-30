// implements FR6, FR8 of add-supabase-integration-tests
import { expect, test } from "@playwright/test";
import {
  createCategory,
  createGoal,
  createTask,
  deleteCategoryFromDetail,
  deleteGoalFromDetail,
  deleteTaskFromDetail,
  findTaskItem,
  navigateToCategories,
  navigateToGoals,
  openCategoryDetail,
  openGoalDetail,
  openTaskDetail,
  updateCategoryName,
  updateGoalName,
  updateTaskName,
} from "../page-actions.js";
import {
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

// State carried between sequential tests (5.10.1 → 5.10.2 → 5.10.3)
let taskName: string;
let taskId: string;
let goalName: string;
let goalId: string;
let categoryName: string;
let categoryId: string;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FullFlowPullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
    is_completed: boolean;
  }>;
  goals: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
    status: string;
  }>;
  categories: Array<{ id: string; name: string; is_deleted: boolean }>;
}

// ---------------------------------------------------------------------------
// 5.10.1 — Create task + goal + category → push all → pull all → verify
// ---------------------------------------------------------------------------
test("create multiple entities → push → verify all exist on server", async () => {
  const page = getPage();
  // --- Create a task on /tasks ---
  taskName = `Full Flow Task ${Date.now()}`;
  await createTask(page, taskName);

  // Wait for task to appear in the list (ensures DB write completed)
  await findTaskItem(page, taskName).waitFor({ state: "visible" });

  // --- Navigate to /goals, create a goal ---
  goalName = `Full Flow Goal ${Date.now()}`;
  await navigateToGoals(page);
  await createGoal(page, goalName);

  // --- Navigate to /categories, create a category ---
  categoryName = `Full Flow Category ${Date.now()}`;
  await navigateToCategories(page);
  await createCategory(page, categoryName);

  // --- Trigger sync and verify ---
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<FullFlowPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverTask = pullResponse.tasks.find(
    (task) => task.name === taskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();
  if (!serverTask) return;
  expect(serverTask.is_deleted).toBe(false);
  taskId = serverTask.id;

  const serverGoal = pullResponse.goals.find(
    (goal) => goal.name === goalName && !goal.is_deleted,
  );
  expect(serverGoal).toBeDefined();
  if (!serverGoal) return;
  expect(serverGoal.is_deleted).toBe(false);
  goalId = serverGoal.id;

  const serverCategory = pullResponse.categories.find(
    (category) => category.name === categoryName && !category.is_deleted,
  );
  expect(serverCategory).toBeDefined();
  if (!serverCategory) return;
  expect(serverCategory.is_deleted).toBe(false);
  categoryId = serverCategory.id;
});

// ---------------------------------------------------------------------------
// 5.10.2 — Modify multiple entities → push → pull → verify updated names
// ---------------------------------------------------------------------------
test("modify multiple entities → push → verify changes on server", async () => {
  const page = getPage();
  // --- Modify task ---
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');
  await openTaskDetail(page, taskName);
  const updatedTaskName = `Updated FF Task ${Date.now()}`;
  await updateTaskName(page, updatedTaskName);
  taskName = updatedTaskName;

  // --- Modify goal ---
  await navigateToGoals(page);
  await openGoalDetail(page, goalName);
  const updatedGoalName = `Updated FF Goal ${Date.now()}`;
  await updateGoalName(page, updatedGoalName);
  goalName = updatedGoalName;

  // --- Modify category ---
  await navigateToCategories(page);
  await openCategoryDetail(page, categoryName);
  const updatedCategoryName = `Updated FF Category ${Date.now()}`;
  await updateCategoryName(page, updatedCategoryName);
  categoryName = updatedCategoryName;

  // --- Trigger sync and verify ---
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<FullFlowPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverTask = pullResponse.tasks.find((task) => task.id === taskId);
  expect(serverTask).toBeDefined();
  expect(serverTask?.name).toBe(taskName);
  expect(serverTask?.is_deleted).toBe(false);

  const serverGoal = pullResponse.goals.find((goal) => goal.id === goalId);
  expect(serverGoal).toBeDefined();
  expect(serverGoal?.name).toBe(goalName);
  expect(serverGoal?.is_deleted).toBe(false);

  const serverCategory = pullResponse.categories.find(
    (category) => category.id === categoryId,
  );
  expect(serverCategory).toBeDefined();
  expect(serverCategory?.name).toBe(categoryName);
  expect(serverCategory?.is_deleted).toBe(false);
});

// ---------------------------------------------------------------------------
// 5.10.3 — Soft-delete across entity types → push → pull → verify deletions
// ---------------------------------------------------------------------------
test("soft-delete multiple entities → push → verify is_deleted=true on server", async () => {
  const page = getPage();
  // --- Delete task ---
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');
  await openTaskDetail(page, taskName);
  await deleteTaskFromDetail(page);

  // --- Delete goal ---
  await navigateToGoals(page);
  await openGoalDetail(page, goalName);
  await deleteGoalFromDetail(page);

  // --- Delete category ---
  await navigateToCategories(page);
  await openCategoryDetail(page, categoryName);
  await deleteCategoryFromDetail(page);

  // --- Trigger sync and verify ---
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<FullFlowPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverTask = pullResponse.tasks.find((task) => task.id === taskId);
  expect(serverTask).toBeDefined();
  expect(serverTask?.is_deleted).toBe(true);

  const serverGoal = pullResponse.goals.find((goal) => goal.id === goalId);
  expect(serverGoal).toBeDefined();
  expect(serverGoal?.is_deleted).toBe(true);

  const serverCategory = pullResponse.categories.find(
    (category) => category.id === categoryId,
  );
  expect(serverCategory).toBeDefined();
  expect(serverCategory?.is_deleted).toBe(true);
});
