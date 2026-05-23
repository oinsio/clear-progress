// implements FR6, FR8 of add-supabase-integration-tests
import { expect, type Page, test } from "@playwright/test";
import { createTask, openTaskDetail } from "../page-actions.js";
import {
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

// State carried between sequential tests (5.7.1 → 5.7.2 → 5.7.3)
let hostTaskName: string;
let hostTaskId: string;
let createdChecklistItemName: string;
let createdChecklistItemId: string;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ChecklistsPullResponse {
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
    is_completed: boolean;
    sort_order: number;
    is_deleted: boolean;
  }>;
}

/**
 * Opens the checklist tab inside the task detail panel.
 * Assumes the detail panel is already visible.
 */
async function switchToChecklistTab(testPage: Page): Promise<void> {
  const tabButtons = testPage
    .getByTestId("task-detail-panel")
    .locator(".flex.gap-2 button");
  await tabButtons.nth(1).click();
}

// ---------------------------------------------------------------------------
// 5.7.1 — Create checklist item → push → verify on server
// ---------------------------------------------------------------------------
test("create checklist item → push → verify on server", async () => {
  const page = getPage();
  // Create a host task for the checklist
  hostTaskName = `Checklist Host Task ${Date.now()}`;
  await createTask(page, hostTaskName);
  await openTaskDetail(page, hostTaskName);

  // Switch to the Checklist tab
  await switchToChecklistTab(page);

  // Add a checklist item via the input in the checklist tab
  const checklistInput = page
    .getByTestId("task-detail-panel")
    .locator('input[type="text"]');
  createdChecklistItemName = `Checklist Item ${Date.now()}`;
  await checklistInput.fill(createdChecklistItemName);
  await checklistInput.press("Enter");

  // Wait for the item to appear in the UI
  await page
    .getByTestId("task-detail-panel")
    .locator(`text=${createdChecklistItemName}`)
    .waitFor({ state: "visible" });

  // Sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<ChecklistsPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  // Find the host task to get its server-side ID
  const serverTask = pullResponse.tasks.find(
    (task) => task.name === hostTaskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();
  if (!serverTask) return;
  hostTaskId = serverTask.id;

  // Find the checklist item
  const serverItem = pullResponse.checklist_items.find(
    (item) =>
      item.name === createdChecklistItemName &&
      item.task_id === hostTaskId &&
      !item.is_deleted,
  );
  expect(serverItem).toBeDefined();
  if (!serverItem) return;

  expect(serverItem.is_deleted).toBe(false);
  expect(serverItem.is_completed).toBe(false);
  expect(serverItem.task_id).toBe(hostTaskId);

  createdChecklistItemId = serverItem.id;
});

// ---------------------------------------------------------------------------
// 5.7.2 — Modify checklist item (edit name) → push → verify on server
// Builds on 5.7.1: detail panel is open on Checklist tab.
// ---------------------------------------------------------------------------
test("modify checklist item name → push → verify on server", async () => {
  const page = getPage();
  // Click on item name to enter edit mode
  await page
    .getByTestId(`checklist-item-name-${createdChecklistItemId}`)
    .click();

  // Wait for edit input to appear and fill updated name
  const editInput = page.getByTestId(
    `checklist-item-edit-input-${createdChecklistItemId}`,
  );
  await editInput.waitFor({ state: "visible" });

  const updatedChecklistItemName = `Updated Checklist ${Date.now()}`;
  await editInput.fill(updatedChecklistItemName);
  await editInput.press("Enter");

  // Sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<ChecklistsPullResponse>(
    getCredentials(),
  );
  const serverItem = pullResponse.checklist_items.find(
    (item) => item.id === createdChecklistItemId,
  );
  expect(serverItem).toBeDefined();
  expect(serverItem?.name).toBe(updatedChecklistItemName);
  expect(serverItem?.is_deleted).toBe(false);

  createdChecklistItemName = updatedChecklistItemName;
});

// ---------------------------------------------------------------------------
// 5.7.3 — Soft-delete checklist item → push → verify is_deleted=true
// Builds on 5.7.2: detail panel is open, item is in active section.
// ---------------------------------------------------------------------------
test("soft-delete checklist item → push → verify is_deleted=true on server", async () => {
  const page = getPage();
  // Click on item name to enter edit mode (exposes delete button)
  await page
    .getByTestId(`checklist-item-name-${createdChecklistItemId}`)
    .click();

  // Click the delete button
  await page
    .getByTestId(`checklist-item-delete-btn-${createdChecklistItemId}`)
    .click();

  // Sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<ChecklistsPullResponse>(
    getCredentials(),
  );
  const serverItem = pullResponse.checklist_items.find(
    (item) => item.id === createdChecklistItemId,
  );
  expect(serverItem).toBeDefined();
  expect(serverItem?.is_deleted).toBe(true);
});
