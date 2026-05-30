// implements FR4 of fix-sync-indicator-race
import { expect, test } from "@playwright/test";
import {
  addChecklistItem,
  createTask,
  openTaskDetail,
  switchToChecklistTab,
} from "../page-actions.js";
import { setupSingleDeviceTest, triggerSyncAndWait } from "../test-helpers.js";

const { getPage } = setupSingleDeviceTest();

// ---------------------------------------------------------------------------
// Amber indicator uses needsSync — items created after sync retain indicator
// ---------------------------------------------------------------------------
test("unsynced checklist item shows amber indicator until pushed", async () => {
  const page = getPage();

  // Create a task, open detail, switch to checklist
  const taskName = `Race Condition Test ${Date.now()}`;
  await createTask(page, taskName);
  await openTaskDetail(page, taskName);
  await switchToChecklistTab(page);

  // Add an item — it should show amber indicator (unsynced)
  const firstItemName = `First Item ${Date.now()}`;
  await addChecklistItem(page, firstItemName);

  const firstItemRow = page.locator(`text=${firstItemName}`).locator("..");
  const firstItemAmber = firstItemRow.locator(".w-0\\.5.bg-amber-400");
  await expect(firstItemAmber).toBeVisible();

  // Sync — pushes the item to server
  await triggerSyncAndWait(page);

  // After sync (which may reload the page), ensure we're on a clean /tasks page
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');

  // Re-open detail panel and switch to checklist
  await openTaskDetail(page, taskName);
  await switchToChecklistTab(page);

  // After sync, the first item should no longer show amber
  const syncedItemRow = page.locator(`text=${firstItemName}`).locator("..");
  const syncedItemAmber = syncedItemRow.locator(".w-0\\.5.bg-amber-400");
  await expect(syncedItemAmber).not.toBeVisible();

  // Add a second item WITHOUT syncing — it should show amber
  const secondItemName = `Second Item ${Date.now()}`;
  await addChecklistItem(page, secondItemName);

  const secondItemRow = page.locator(`text=${secondItemName}`).locator("..");
  const secondItemAmber = secondItemRow.locator(".w-0\\.5.bg-amber-400");
  await expect(secondItemAmber).toBeVisible();

  // First item should still have no amber (it was already synced)
  await expect(syncedItemAmber).not.toBeVisible();
});
