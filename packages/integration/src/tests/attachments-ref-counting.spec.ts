// implements FR7 of add-file-attachments
// Integration tests for file ref-counting across attachments and covers.
// Tasks 13.5-13.6 from add-file-attachments change.
import { expect, type Page, test } from "@playwright/test";
import {
  createGoal,
  createTask,
  navigateToGoals,
  openGoalDetail,
  openTaskDetail,
} from "../page-actions.js";
import {
  createMinimalPng,
  getFileFromServer,
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

async function deleteFirstAttachment(page: Page): Promise<void> {
  await page.locator('[data-testid^="attachment-delete-"]').first().click();
  const confirmButton = page.getByTestId("confirm-dialog-confirm");
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }
}

interface RefCountPullResponse {
  ok: boolean;
  tasks: Array<{ id: string; name: string; is_deleted: boolean }>;
  goals: Array<{
    id: string;
    name: string;
    cover_hash: string;
    is_deleted: boolean;
  }>;
  attachments: Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    data_hash: string;
    filename: string;
    is_deleted: boolean;
  }>;
}

// State shared between sequential tests
let taskNameA: string;
let taskNameB: string;
let sharedFileHash: string;

// ---------------------------------------------------------------------------
// 13.5 — Two attachments same hash -> delete one -> file stays -> delete second -> file removed
// ---------------------------------------------------------------------------
test("two attachments with same file -> delete first -> file stays", async () => {
  const page = getPage();
  const pngBuffer = createMinimalPng();
  taskNameA = `RefCount Task A ${Date.now()}`;
  taskNameB = `RefCount Task B ${Date.now()}`;

  // Create two tasks
  await createTask(page, taskNameA);
  await triggerSyncAndWait(page);
  await createTask(page, taskNameB);
  await triggerSyncAndWait(page);

  // Attach same file to task A
  await openTaskDetail(page, taskNameA);
  await page.getByTestId("tab-attachments").click();
  await page.getByTestId("attach-file-input").setInputFiles({
    name: "shared-file.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await page
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .waitFor({ state: "visible" });
  // Navigate back to task list
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');

  // Attach same file to task B
  await openTaskDetail(page, taskNameB);
  await page.getByTestId("tab-attachments").click();
  await page.getByTestId("attach-file-input").setInputFiles({
    name: "shared-file.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await page
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .waitFor({ state: "visible" });

  // Sync both attachments
  await triggerSyncAndWait(page);

  // Verify both attachments share the same data_hash on server
  const pullResponse = await pullFromServer<RefCountPullResponse>(
    getCredentials(),
  );
  const activeAttachments = pullResponse.attachments.filter(
    (attachment) =>
      !attachment.is_deleted && attachment.filename === "shared-file.png",
  );
  expect(activeAttachments.length).toBe(2);
  expect(activeAttachments[0]?.data_hash).toBe(activeAttachments[1]?.data_hash);
  sharedFileHash = activeAttachments[0]?.data_hash ?? "";

  // Delete attachment from task B (detail panel should still be open)
  await deleteFirstAttachment(page);
  await triggerSyncAndWait(page);

  // File should still be accessible (task A still references it)
  const fileResponse = await getFileFromServer(getCredentials(), [
    sharedFileHash,
  ]);
  expect(fileResponse.ok).toBe(true);
  expect(fileResponse.files).toHaveLength(1);
  expect(fileResponse.files[0]?.data).toBeDefined();
  expect(fileResponse.files[0]?.error).toBeUndefined();
});

test("delete second attachment with same hash -> file removed from server", async () => {
  const page = getPage();

  // Close current panel and open task A
  await page.getByRole("button", { name: /close/i }).click();
  await openTaskDetail(page, taskNameA);
  await page.getByTestId("tab-attachments").click();

  // Delete the remaining attachment
  await deleteFirstAttachment(page);
  await triggerSyncAndWait(page);

  // File should now return an error (no more references)
  const fileResponse = await getFileFromServer(getCredentials(), [
    sharedFileHash,
  ]);
  expect(fileResponse.ok).toBe(true);
  expect(fileResponse.files).toHaveLength(1);
  expect(fileResponse.files[0]?.error).toBeDefined();
});

// ---------------------------------------------------------------------------
// 13.6 — Cover + attachment same hash -> ref-counting correct
// ---------------------------------------------------------------------------
test("cover + attachment same hash -> delete cover -> file stays -> delete attachment -> file removed", async () => {
  const page = getPage();
  const pngBuffer = createMinimalPng();
  const goalName = `RefCount Goal ${Date.now()}`;
  const attachTaskName = `RefCount Attach Task ${Date.now()}`;

  // Create a goal with a cover
  await navigateToGoals(page);
  await createGoal(page, goalName);
  await openGoalDetail(page, goalName);
  await page.getByTestId("edit-goal-button").click();
  await page.getByTestId("cover-file-input").setInputFiles({
    name: "shared-image.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await page.getByTestId("cover-preview-img").waitFor({ state: "visible" });
  await page.getByTestId("goal-save-button").click();
  await page.getByTestId("edit-goal-button").waitFor({ state: "visible" });
  await triggerSyncAndWait(page);

  // Get the cover hash from server
  const pullAfterCover = await pullFromServer<RefCountPullResponse>(
    getCredentials(),
  );
  const serverGoal = pullAfterCover.goals.find(
    (goal) => goal.name === goalName && !goal.is_deleted,
  );
  expect(serverGoal).toBeDefined();
  const coverHash = serverGoal?.cover_hash ?? "";
  expect(coverHash).not.toBe("");

  // Create a task and attach the same image
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');
  await createTask(page, attachTaskName);
  await triggerSyncAndWait(page);
  await openTaskDetail(page, attachTaskName);
  await page.getByTestId("tab-attachments").click();
  await page.getByTestId("attach-file-input").setInputFiles({
    name: "shared-image.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await page
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .waitFor({ state: "visible" });
  await triggerSyncAndWait(page);

  // Delete cover from goal
  await navigateToGoals(page);
  await openGoalDetail(page, goalName);
  await page.getByTestId("edit-goal-button").click();
  await page.getByTestId("cover-remove-button").click();
  await page.getByTestId("goal-save-button").click();
  await page.getByTestId("edit-goal-button").waitFor({ state: "visible" });
  await triggerSyncAndWait(page);

  // File should still be accessible (attachment still references it)
  const fileAfterCoverDelete = await getFileFromServer(getCredentials(), [
    coverHash,
  ]);
  expect(fileAfterCoverDelete.ok).toBe(true);
  expect(fileAfterCoverDelete.files[0]?.data).toBeDefined();
  expect(fileAfterCoverDelete.files[0]?.error).toBeUndefined();

  // Delete the attachment from the task
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');
  await openTaskDetail(page, attachTaskName);
  await page.getByTestId("tab-attachments").click();
  await deleteFirstAttachment(page);
  await triggerSyncAndWait(page);

  // File should now be removed (no more references)
  const fileAfterAllDelete = await getFileFromServer(getCredentials(), [
    coverHash,
  ]);
  expect(fileAfterAllDelete.ok).toBe(true);
  expect(fileAfterAllDelete.files[0]?.error).toBeDefined();
});
