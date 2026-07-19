// implements FR7, FR17 of add-file-attachments
// Integration tests for purge-based file cleanup and dynamic ref-counting.
// Tasks 14.12-14.13 from add-file-attachments change.
import { expect, test } from "@playwright/test";
import {
  attachFileToEntity,
  deleteFirstAttachment,
} from "../page-attachment-actions.js";
import {
  createGoal,
  navigateToGoals,
  openGoalDetail,
  removeCoverFromGoal,
  uploadCoverToGoal,
} from "../page-goal-category-actions.js";
import { createTask, openTaskDetail } from "../page-task-actions.js";
import {
  createMinimalPng,
  getFileFromServer,
  pullFromServer,
  purgeOnServer,
  type RefCountPullResponse,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

// ---------------------------------------------------------------------------
// 14.12 — Two goals same cover, remove one -> file stays, remove both -> gone
// ---------------------------------------------------------------------------
test("14.12: two goals same cover -> remove one -> file stays -> remove both -> file gone immediately", async () => {
  const page = getPage();
  const pngBuffer = createMinimalPng();
  const goalNameX = `Cover Goal X ${Date.now()}`;
  const goalNameY = `Cover Goal Y ${Date.now()}`;

  // Create two goals with the same cover image
  const sharedCoverFile = {
    name: "cover-shared.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  };

  await navigateToGoals(page);
  await createGoal(page, goalNameX);
  await openGoalDetail(page, goalNameX);
  await uploadCoverToGoal(page, sharedCoverFile);
  await triggerSyncAndWait(page);

  await navigateToGoals(page);
  await createGoal(page, goalNameY);
  await openGoalDetail(page, goalNameY);
  await uploadCoverToGoal(page, sharedCoverFile);
  await triggerSyncAndWait(page);

  // Get the cover hash
  const pullData = await pullFromServer<RefCountPullResponse>(getCredentials());
  const goalX = pullData.goals.find(
    (goal) => goal.name === goalNameX && !goal.is_deleted,
  );
  expect(goalX).toBeDefined();
  const hash = goalX?.cover_hash ?? "";
  expect(hash).not.toBe("");

  // Remove cover from goal X
  await navigateToGoals(page);
  await openGoalDetail(page, goalNameX);
  await removeCoverFromGoal(page);
  await triggerSyncAndWait(page);

  // File stays — goal Y still references it
  const fileAfterFirst = await getFileFromServer(getCredentials(), [hash]);
  expect(fileAfterFirst.ok).toBe(true);
  expect(fileAfterFirst.files[0]?.data).toBeDefined();

  // Remove cover from goal Y
  await navigateToGoals(page);
  await openGoalDetail(page, goalNameY);
  await removeCoverFromGoal(page);
  await triggerSyncAndWait(page);

  // File gone immediately — covers don't go through soft-delete, 0 refs
  const fileAfterBoth = await getFileFromServer(getCredentials(), [hash]);
  expect(fileAfterBoth.ok).toBe(true);
  expect(fileAfterBoth.files[0]?.error).toBeDefined();
});

// ---------------------------------------------------------------------------
// 14.13 — Soft-delete attachment, file stays, purge removes it
// ---------------------------------------------------------------------------
test("14.13: soft-delete attachment -> file stays -> purge hard-deletes -> file removed", async () => {
  const page = getPage();
  const pngBuffer = createMinimalPng();
  const taskName = `Purge Task ${Date.now()}`;

  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');
  await createTask(page, taskName);
  await triggerSyncAndWait(page);

  // Attach a file
  await openTaskDetail(page, taskName);
  await attachFileToEntity(page, {
    name: "purge-test.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await triggerSyncAndWait(page);

  // Get the hash
  const pullData = await pullFromServer<RefCountPullResponse>(getCredentials());
  const attachment = pullData.attachments.find(
    (a) => a.filename === "purge-test.png" && !a.is_deleted,
  );
  expect(attachment).toBeDefined();
  const hash = attachment?.data_hash ?? "";

  // Delete the attachment (soft-delete)
  await deleteFirstAttachment(page);
  await triggerSyncAndWait(page);

  // File still accessible — soft-deleted record counts as reference
  const fileBefore = await getFileFromServer(getCredentials(), [hash]);
  expect(fileBefore.ok).toBe(true);
  expect(fileBefore.files[0]?.data).toBeDefined();

  // Purge removes the soft-deleted record and orphaned file
  await purgeOnServer(getCredentials());

  const fileAfter = await getFileFromServer(getCredentials(), [hash]);
  expect(fileAfter.ok).toBe(true);
  expect(fileAfter.files[0]?.error).toBeDefined();
});
