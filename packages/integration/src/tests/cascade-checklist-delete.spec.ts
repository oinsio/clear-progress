// implements FR1 of cascade-checklist-delete
import { expect, type Page, test } from "@playwright/test";
import {
  createTask,
  deleteTaskFromDetail,
  openTaskDetail,
} from "../page-actions.js";
import {
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CascadeDeletePullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
  }>;
  checklist_items: Array<{
    id: string;
    task_id: string;
    name: string;
    is_deleted: boolean;
  }>;
}

async function switchToChecklistTab(testPage: Page): Promise<void> {
  const tabButtons = testPage
    .getByTestId("task-detail-panel")
    .locator(".flex.gap-2 button");
  await tabButtons.nth(1).click();
}

async function addChecklistItem(
  testPage: Page,
  itemName: string,
): Promise<void> {
  const checklistInput = testPage
    .getByTestId("task-detail-panel")
    .locator('input[type="text"]');
  await checklistInput.fill(itemName);
  await checklistInput.press("Enter");
  await testPage
    .getByTestId("task-detail-panel")
    .locator(`text=${itemName}`)
    .waitFor({ state: "visible" });
}

// ---------------------------------------------------------------------------
// Test: delete task → cascades is_deleted to checklist items on server
// ---------------------------------------------------------------------------

test("delete task → cascades is_deleted to checklist items on server", async () => {
  const page = getPage();

  // 1. Create a host task with 2 checklist items
  const taskName = `Cascade Delete Host ${Date.now()}`;
  await createTask(page, taskName);
  await openTaskDetail(page, taskName);
  await switchToChecklistTab(page);

  const firstItemName = `Cascade Item A ${Date.now()}`;
  const secondItemName = `Cascade Item B ${Date.now()}`;
  await addChecklistItem(page, firstItemName);
  await addChecklistItem(page, secondItemName);

  // 2. Sync and verify task + both items exist on server
  await triggerSyncAndWait(page);

  const initialPull = await pullFromServer<CascadeDeletePullResponse>(
    getCredentials(),
  );
  expect(initialPull.ok).toBe(true);

  const serverTask = initialPull.tasks.find(
    (task) => task.name === taskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();
  if (!serverTask) return;

  const taskId = serverTask.id;
  const serverItems = initialPull.checklist_items.filter(
    (item) => item.task_id === taskId && !item.is_deleted,
  );
  expect(serverItems).toHaveLength(2);

  // 3. Close detail panel and delete the task
  const detailPanel = page.getByTestId("task-detail-panel");
  await detailPanel.getByRole("button", { name: "Close" }).click();
  await detailPanel.waitFor({ state: "detached" });
  await openTaskDetail(page, taskName);
  await deleteTaskFromDetail(page);

  // 4. Sync after deletion
  await triggerSyncAndWait(page);

  // 5. Verify on server: task and both checklist items are soft-deleted
  const finalPull = await pullFromServer<CascadeDeletePullResponse>(
    getCredentials(),
  );
  expect(finalPull.ok).toBe(true);

  const deletedTask = finalPull.tasks.find((task) => task.id === taskId);
  expect(deletedTask).toBeDefined();
  expect(deletedTask?.is_deleted).toBe(true);

  const deletedItems = finalPull.checklist_items.filter(
    (item) => item.task_id === taskId,
  );
  expect(deletedItems).toHaveLength(2);
  for (const item of deletedItems) {
    expect(item.is_deleted).toBe(true);
  }
});
