// implements FR13 of add-supabase-integration-tests
import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  createGoal,
  createTask,
  deleteTaskFromDetail,
  navigateToGoals,
  openGoalDetail,
  openTaskDetail,
  updateGoalName,
  updateTaskName,
} from "../page-actions.js";
import {
  pullFromServer,
  setupTwoDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ConflictsPullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
    is_completed: boolean;
    updated_at: string;
  }>;
  goals: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
    status: string;
    updated_at: string;
  }>;
  settings: Array<{ key: string; value: string; updated_at: string }>;
}

async function createTaskAndSyncBoth(taskName: string): Promise<string> {
  const pageA = getPageA();
  const pageB = getPageB();

  await pageA.goto("/tasks");
  await pageA.waitForSelector('[data-testid="inbox-page"]');
  await createTask(pageA, taskName);
  await triggerSyncAndWait(pageA);

  // Navigate pageB to /tasks before sync to ensure clean UI state
  // (previous test may have left a detail panel open or a different page)
  await pageB.goto("/tasks");
  await pageB.waitForSelector('[data-testid="inbox-page"]');
  await triggerSyncAndWait(pageB);

  // Wait for the task to actually appear in pageB's UI.
  // triggerSyncAndWait only guarantees last_sync updated, not that IndexedDB
  // write + React re-render completed.
  await pageB
    .locator('[data-testid="task-item-name"]', { hasText: taskName })
    .waitFor({ state: "visible", timeout: 10_000 });

  const pullResponse = await pullFromServer<ConflictsPullResponse>(
    getCredentials(),
  );
  const serverTask = pullResponse.tasks.find(
    (task) => task.name === taskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();
  return serverTask?.id ?? "";
}

async function openTaskDetailAndRename(
  testPage: Page,
  possibleNames: string[],
  newName: string,
): Promise<void> {
  await testPage.goto("/tasks");
  await testPage.waitForSelector('[data-testid="inbox-page"]');

  // Auto-sync from navigation may have pulled a rename from another device,
  // so the task might appear under any of the possible names.
  // Use .or() for atomic matching — avoids the race condition where auto-sync
  // renames the task between a count() check and the click().
  const taskItemLocators = possibleNames.map((candidateName) =>
    testPage.locator('[data-testid="task-item"]').filter({
      has: testPage.locator('[data-testid="task-item-name"]', {
        hasText: candidateName,
      }),
    }),
  );

  let taskItemLocator = taskItemLocators[0] as Locator;
  for (let i = 1; i < taskItemLocators.length; i++) {
    taskItemLocator = taskItemLocator.or(taskItemLocators[i] as Locator);
  }

  await taskItemLocator.locator('[data-testid="task-item-body"]').click();
  await testPage.waitForSelector('[data-testid="task-detail-panel"]');
  await updateTaskName(testPage, newName);
}

// ---------------------------------------------------------------------------
// 5.12.1 — Both modify same task → last-write-wins
// ---------------------------------------------------------------------------
test("Both modify same task name → last writer wins", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const taskName = `Conflict Task ${Date.now()}`;
  const conflictTaskId = await createTaskAndSyncBoth(taskName);

  // App A modifies → pushes FIRST
  await openTaskDetailAndRename(pageA, [taskName], "Title From A");
  await triggerSyncAndWait(pageA);

  // App B modifies → pushes SECOND (newer updated_at).
  // Auto-sync may have pulled A's rename, so accept either name.
  await openTaskDetailAndRename(
    pageB,
    [taskName, "Title From A"],
    "Title From B",
  );
  await triggerSyncAndWait(pageB);

  // Verify: last-write-wins → "Title From B"
  const finalPull = await pullFromServer<ConflictsPullResponse>(
    getCredentials(),
  );
  const finalTask = finalPull.tasks.find((task) => task.id === conflictTaskId);
  expect(finalTask).toBeDefined();
  expect(finalTask?.name).toBe("Title From B");
});

// ---------------------------------------------------------------------------
// 5.12.2 — Newer updated_at wins over older
// ---------------------------------------------------------------------------
test("Newer updated_at wins over older modification", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const taskName = `Timestamp Conflict ${Date.now()}`;
  const taskId = await createTaskAndSyncBoth(taskName);

  // App B modifies → pushes FIRST
  await openTaskDetailAndRename(pageB, [taskName], "Older Update");
  await triggerSyncAndWait(pageB);

  // App A modifies → pushes SECOND (newer updated_at).
  // Auto-sync may have pulled B's rename, so accept either name.
  await openTaskDetailAndRename(
    pageA,
    [taskName, "Older Update"],
    "Newer Update",
  );
  await triggerSyncAndWait(pageA);

  const finalPull = await pullFromServer<ConflictsPullResponse>(
    getCredentials(),
  );
  const finalTask = finalPull.tasks.find((task) => task.id === taskId);
  expect(finalTask).toBeDefined();
  expect(finalTask?.name).toBe("Newer Update");
});

// ---------------------------------------------------------------------------
// 5.12.3 — Delete vs modify conflict → newer wins
// ---------------------------------------------------------------------------
test("Delete with newer updated_at wins over earlier modify", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const taskName = `Delete Conflict ${Date.now()}`;
  const taskId = await createTaskAndSyncBoth(taskName);

  // App B modifies → pushes FIRST
  await openTaskDetailAndRename(pageB, [taskName], "Modified Before Delete");
  await triggerSyncAndWait(pageB);

  // App A deletes → pushes SECOND (newer updated_at → delete wins).
  // A's auto-sync (from navigation) may have pulled B's rename,
  // so the task might appear under either name.
  await pageA.goto("/tasks");
  await pageA.waitForSelector('[data-testid="inbox-page"]');

  // Wait briefly for auto-sync to settle before checking the visible name
  await pageA.waitForTimeout(500);

  const hasOriginalName =
    (await pageA
      .locator('[data-testid="task-item-name"]', { hasText: taskName })
      .count()) > 0;
  const deleteTargetName = hasOriginalName
    ? taskName
    : "Modified Before Delete";

  await openTaskDetail(pageA, deleteTargetName);
  await deleteTaskFromDetail(pageA);

  await triggerSyncAndWait(pageA);

  const finalPull = await pullFromServer<ConflictsPullResponse>(
    getCredentials(),
  );
  const finalTask = finalPull.tasks.find((task) => task.id === taskId);
  expect(finalTask).toBeDefined();
  expect(finalTask?.is_deleted).toBe(true);
});

// ---------------------------------------------------------------------------
// 5.12.4 — Both modify same goal → last-write-wins
// ---------------------------------------------------------------------------
test("Both modify same goal name → last writer wins", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const goalName = `Conflict Goal ${Date.now()}`;

  // App A creates goal
  await navigateToGoals(pageA);
  await createGoal(pageA, goalName);
  await triggerSyncAndWait(pageA);
  await triggerSyncAndWait(pageB);

  const initialPull = await pullFromServer<ConflictsPullResponse>(
    getCredentials(),
  );
  const serverGoal = initialPull.goals.find(
    (goal) => goal.name === goalName && !goal.is_deleted,
  );
  expect(serverGoal).toBeDefined();
  const goalId = serverGoal?.id ?? "";

  // App A renames goal → pushes FIRST
  await navigateToGoals(pageA);
  await openGoalDetail(pageA, goalName);
  await updateGoalName(pageA, "Goal From A");
  await triggerSyncAndWait(pageA);

  // App B renames goal → pushes SECOND.
  // B's auto-sync (from navigation) may have pulled A's rename,
  // so the goal might appear under either name.
  await navigateToGoals(pageB);
  await pageB.waitForTimeout(500);

  const hasOriginalGoalName =
    (await pageB
      .locator('[data-testid="goal-item"]')
      .filter({ has: pageB.locator(`text=${goalName}`) })
      .count()) > 0;
  const goalTargetName = hasOriginalGoalName ? goalName : "Goal From A";

  await openGoalDetail(pageB, goalTargetName);
  await updateGoalName(pageB, "Goal From B");
  await triggerSyncAndWait(pageB);

  const finalPull = await pullFromServer<ConflictsPullResponse>(
    getCredentials(),
  );
  const finalGoal = finalPull.goals.find((goal) => goal.id === goalId);
  expect(finalGoal).toBeDefined();
  expect(finalGoal?.name).toBe("Goal From B");
});

// ---------------------------------------------------------------------------
// 5.12.5 — Both modify same setting → updated_at wins
// ---------------------------------------------------------------------------
test("Both modify same setting → last writer wins", async () => {
  const pageA = getPageA();
  const pageB = getPageB();

  // App A changes accent color to indigo → pushes FIRST
  await pageA.goto("/settings");
  await pageA.waitForSelector('[data-testid="settings-page"]');
  await pageA.getByTestId("settings-color-option-indigo").click();
  await triggerSyncAndWait(pageA);

  // App B changes accent color to purple → pushes SECOND (newer updated_at)
  await pageB.goto("/settings");
  await pageB.waitForSelector('[data-testid="settings-page"]');
  await pageB.getByTestId("settings-color-option-purple").click();
  await triggerSyncAndWait(pageB);

  const finalPull = await pullFromServer<ConflictsPullResponse>(
    getCredentials(),
  );
  const accentSetting = finalPull.settings.find(
    (setting) => setting.key === "accent_color",
  );
  expect(accentSetting).toBeDefined();
  expect(accentSetting?.value).toBe("purple");
});

// ---------------------------------------------------------------------------
// 5.12.6 — Clean sequence (no conflict)
// ---------------------------------------------------------------------------
test("Sequential edits without conflict preserve latest version", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const taskName = `No Conflict Task ${Date.now()}`;

  // App A creates task → pushes
  await pageA.goto("/tasks");
  await pageA.waitForSelector('[data-testid="inbox-page"]');
  await createTask(pageA, taskName);
  await triggerSyncAndWait(pageA);

  // App B pulls → gets A's task
  await triggerSyncAndWait(pageB);

  // App B modifies task → pushes
  const updatedName = `${taskName} Updated By B`;
  await openTaskDetailAndRename(pageB, [taskName], updatedName);
  await triggerSyncAndWait(pageB);

  // Verify: no conflict, B's version is current
  const finalPull = await pullFromServer<ConflictsPullResponse>(
    getCredentials(),
  );
  const finalTask = finalPull.tasks.find((task) => task.name === updatedName);
  expect(finalTask).toBeDefined();
  expect(finalTask?.is_deleted).toBe(false);
});
