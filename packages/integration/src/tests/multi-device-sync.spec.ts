// implements FR12 of add-supabase-integration-tests
import { expect, type Page, test } from "@playwright/test";
import {
  createCategory,
  createGoal,
  createTask,
  deleteTaskFromDetail,
  navigateToCategories,
  navigateToGoals,
  openGoalDetail,
  openTaskDetail,
  updateTaskName,
} from "../page-actions.js";
import {
  closeAuthenticatedPage,
  createAuthenticatedPage,
  createMinimalPng,
  getCoverFromServer,
  pullFromServer,
  type ServerCallCredentials,
  triggerSyncAndWait,
} from "../test-helpers.js";

test.describe.configure({ mode: "serial" });

let pageA: Page;
let credentials: ServerCallCredentials;

// State carried between sequential tests (5.11.1 → 5.11.2 → ... → 5.11.5)
let createdTaskName: string;
let createdTaskId: string;
let createdGoalName: string;
let createdGoalId: string;
let createdCategoryName: string;

test.beforeAll(async ({ browser: b }) => {
  const authA = await createAuthenticatedPage(b);
  pageA = authA.page;
  credentials = {
    accessToken: authA.accessToken,
    supabaseUrl: authA.supabaseUrl,
    anonKey: authA.anonKey,
  };
});

test.afterAll(async () => {
  await closeAuthenticatedPage(pageA);
});

interface MultiDeviceSyncPullResponse {
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
    cover_hash: string;
  }>;
  categories: Array<{ id: string; name: string; is_deleted: boolean }>;
}

// ---------------------------------------------------------------------------
// 5.11.1 — App A creates task → pushes → App B pulls → task appears
// ---------------------------------------------------------------------------
test("App A creates task → push → App B pulls → task visible on server", async () => {
  createdTaskName = `Multi-Device Task ${Date.now()}`;

  // App A creates task
  await createTask(pageA, createdTaskName);
  await triggerSyncAndWait(pageA);

  // Verify server has the task (via HTTP pull — no need to sync pageB)
  const pullResponse =
    await pullFromServer<MultiDeviceSyncPullResponse>(credentials);
  const serverTask = pullResponse.tasks.find(
    (task) => task.name === createdTaskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();
  if (!serverTask) return;

  createdTaskId = serverTask.id;
});

// ---------------------------------------------------------------------------
// 5.11.2 — App A modifies task title → pushes → App B pulls → sees update
// ---------------------------------------------------------------------------
test("App A modifies task title → push → App B pulls → updated title on server", async () => {
  const updatedTaskName = `Updated Multi-Device Task ${Date.now()}`;

  // App A opens task detail and changes name
  await openTaskDetail(pageA, createdTaskName);
  await updateTaskName(pageA, updatedTaskName);

  await triggerSyncAndWait(pageA);

  // Verify server has the updated name (via HTTP pull)
  const pullResponse =
    await pullFromServer<MultiDeviceSyncPullResponse>(credentials);
  const serverTask = pullResponse.tasks.find(
    (task) => task.id === createdTaskId,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.name).toBe(updatedTaskName);
  expect(serverTask?.is_deleted).toBe(false);

  createdTaskName = updatedTaskName;
});

// ---------------------------------------------------------------------------
// 5.11.3 — App A soft-deletes task → pushes → App B pulls → is_deleted=true
// ---------------------------------------------------------------------------
test("App A soft-deletes task → push → App B pulls → is_deleted on server", async () => {
  // Task detail panel should still be open from 5.11.2
  await deleteTaskFromDetail(pageA);

  await triggerSyncAndWait(pageA);

  // Verify server shows is_deleted (via HTTP pull)
  const pullResponse =
    await pullFromServer<MultiDeviceSyncPullResponse>(credentials);
  const serverTask = pullResponse.tasks.find(
    (task) => task.id === createdTaskId,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.is_deleted).toBe(true);
});

// ---------------------------------------------------------------------------
// 5.11.4 — App A creates goal + category → pushes → App B pulls → both appear
// ---------------------------------------------------------------------------
test("App A creates goal and category → push → App B pulls → both on server", async () => {
  createdGoalName = `Multi-Device Goal ${Date.now()}`;
  createdCategoryName = `Multi-Device Category ${Date.now()}`;

  // App A creates a goal
  await navigateToGoals(pageA);
  await createGoal(pageA, createdGoalName);

  // Push goal first to avoid auto-sync racing with category creation
  await triggerSyncAndWait(pageA);

  // App A creates a category
  await navigateToCategories(pageA);
  await createCategory(pageA, createdCategoryName);

  await triggerSyncAndWait(pageA);

  // Verify both exist on server (via HTTP pull)
  const pullResponse =
    await pullFromServer<MultiDeviceSyncPullResponse>(credentials);

  const serverGoal = pullResponse.goals.find(
    (goal) => goal.name === createdGoalName && !goal.is_deleted,
  );
  expect(serverGoal).toBeDefined();
  if (!serverGoal) return;
  createdGoalId = serverGoal.id;

  const serverCategory = pullResponse.categories.find(
    (category) => category.name === createdCategoryName && !category.is_deleted,
  );
  expect(serverCategory).toBeDefined();
});

// ---------------------------------------------------------------------------
// 5.11.5 — App A uploads cover → App B pulls → cover accessible
// ---------------------------------------------------------------------------
test("App A uploads cover on goal → push → App B pulls → cover accessible", async () => {
  // Navigate App A to the goal detail page created in 5.11.4
  await navigateToGoals(pageA);
  await openGoalDetail(pageA, createdGoalName);

  // Enter edit mode and upload cover
  await pageA.getByTestId("edit-goal-button").click();

  const pngBuffer = createMinimalPng();
  await pageA.getByTestId("cover-file-input").setInputFiles({
    name: "test-cover.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });

  await pageA.getByTestId("cover-preview-img").waitFor({ state: "visible" });

  // Save and sync
  await pageA.getByTestId("goal-save-button").click();
  await pageA.getByTestId("edit-goal-button").waitFor({ state: "visible" });
  await triggerSyncAndWait(pageA);

  // Verify cover_hash is set on server (via HTTP pull)
  const pullResponse =
    await pullFromServer<MultiDeviceSyncPullResponse>(credentials);
  const serverGoal = pullResponse.goals.find(
    (goal) => goal.id === createdGoalId,
  );
  expect(serverGoal).toBeDefined();
  expect(serverGoal?.cover_hash).not.toBe("");

  // Verify cover is accessible via get-cover edge function
  const coverResponse = await getCoverFromServer(credentials, [
    serverGoal?.cover_hash ?? "",
  ]);
  expect(coverResponse.ok).toBe(true);
  expect(coverResponse.covers).toHaveLength(1);

  const coverResult = coverResponse.covers[0];
  expect(coverResult).toBeDefined();
  if (!coverResult) return;

  expect(coverResult.hash).toBe(serverGoal?.cover_hash);
  expect(coverResult.mime_type).toContain("image");
  expect(coverResult.data).toBeDefined();

  const decodedBytes = Buffer.from(coverResult.data ?? "", "base64");
  expect(decodedBytes.length).toBeGreaterThan(0);
});
