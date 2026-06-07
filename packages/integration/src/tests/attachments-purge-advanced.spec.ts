// implements FR7, FR17 of add-file-attachments
// Integration tests for advanced purge and ref-counting scenarios.
// Tasks 14.14-14.16 from add-file-attachments change.
import { expect, test } from "@playwright/test";
import {
  attachFileToEntity,
  createGoal,
  createTask,
  deleteFirstAttachment,
  navigateToGoals,
  openGoalDetail,
  openTaskDetail,
  removeCoverFromGoal,
  uploadCoverToGoal,
} from "../page-actions.js";
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

async function createGoalWithCoverAndSync(
  page: Awaited<ReturnType<typeof getPage>>,
  goalName: string,
  coverFileName: string,
  pngBuffer: Buffer,
): Promise<void> {
  await navigateToGoals(page);
  await createGoal(page, goalName);
  await openGoalDetail(page, goalName);
  await uploadCoverToGoal(page, {
    name: coverFileName,
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await triggerSyncAndWait(page);
}

async function pullGoalCoverHash(
  credentials: ReturnType<typeof getCredentials>,
  goalName: string,
): Promise<string> {
  const pullData = await pullFromServer<RefCountPullResponse>(credentials);
  const goal = pullData.goals.find((g) => g.name === goalName && !g.is_deleted);
  expect(goal).toBeDefined();
  const coverHash = goal?.cover_hash ?? "";
  expect(coverHash).not.toBe("");
  return coverHash;
}

// ---------------------------------------------------------------------------
// 14.14 — Cover removed (cover_hash=""), no other refs -> file removed immediately
// ---------------------------------------------------------------------------
test("14.14: cover removed -> no other refs -> file removed immediately", async () => {
  const page = getPage();
  const pngBuffer = createMinimalPng();
  const goalName = `Cover Only Goal ${Date.now()}`;

  await createGoalWithCoverAndSync(page, goalName, "cover-only.png", pngBuffer);

  // Get the cover hash
  const hash = await pullGoalCoverHash(getCredentials(), goalName);

  // Remove the cover
  await removeCoverFromGoal(page);
  await triggerSyncAndWait(page);

  // File gone immediately — cover_hash="" means 0 refs
  const fileResponse = await getFileFromServer(getCredentials(), [hash]);
  expect(fileResponse.ok).toBe(true);
  expect(fileResponse.files[0]?.error).toBeDefined();
});

// ---------------------------------------------------------------------------
// 14.15 — Two attachments same hash, soft-delete both, purge removes file
// ---------------------------------------------------------------------------
test("14.15: two attachments same hash -> soft-delete both -> purge removes", async () => {
  const page = getPage();
  const pngBuffer = createMinimalPng();
  const taskC = `Purge Task C ${Date.now()}`;
  const taskD = `Purge Task D ${Date.now()}`;

  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');
  await createTask(page, taskC);
  await triggerSyncAndWait(page);
  await createTask(page, taskD);
  await triggerSyncAndWait(page);

  // Attach same file to both tasks
  await openTaskDetail(page, taskC);
  await attachFileToEntity(page, {
    name: "dual-purge.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');

  await openTaskDetail(page, taskD);
  await attachFileToEntity(page, {
    name: "dual-purge.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await triggerSyncAndWait(page);

  // Get the hash
  const pullData = await pullFromServer<RefCountPullResponse>(getCredentials());
  const attachments = pullData.attachments.filter(
    (a) => a.filename === "dual-purge.png" && !a.is_deleted,
  );
  expect(attachments.length).toBe(2);
  const hash = attachments[0]?.data_hash ?? "";

  // Delete attachment from task D (currently open)
  await deleteFirstAttachment(page);
  await triggerSyncAndWait(page);

  // File stays (active C + soft-deleted D)
  const fileAfterFirst = await getFileFromServer(getCredentials(), [hash]);
  expect(fileAfterFirst.ok).toBe(true);
  expect(fileAfterFirst.files[0]?.data).toBeDefined();

  // Delete attachment from task C
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');
  await openTaskDetail(page, taskC);
  await page.getByTestId("tab-attachments").click();
  await deleteFirstAttachment(page);
  await triggerSyncAndWait(page);

  // File STILL stays — both soft-deleted records count as references
  const fileAfterSecond = await getFileFromServer(getCredentials(), [hash]);
  expect(fileAfterSecond.ok).toBe(true);
  expect(fileAfterSecond.files[0]?.data).toBeDefined();

  // Purge removes both records and cleans up orphaned file
  await purgeOnServer(getCredentials());

  const fileAfterPurge = await getFileFromServer(getCredentials(), [hash]);
  expect(fileAfterPurge.ok).toBe(true);
  expect(fileAfterPurge.files[0]?.error).toBeDefined();
});

// ---------------------------------------------------------------------------
// 14.16 — Cover + attachment same hash, remove cover -> file stays
// ---------------------------------------------------------------------------
test("14.16: cover + attachment same hash -> remove cover -> file stays", async () => {
  const page = getPage();
  const pngBuffer = createMinimalPng();
  const goalName = `CoverRef Goal ${Date.now()}`;
  const taskName = `CoverRef Task ${Date.now()}`;

  // Create goal with cover
  await createGoalWithCoverAndSync(page, goalName, "cover-ref.png", pngBuffer);

  // Get cover hash
  const hash = await pullGoalCoverHash(getCredentials(), goalName);

  // Create task with attachment using same file
  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');
  await createTask(page, taskName);
  await triggerSyncAndWait(page);
  await openTaskDetail(page, taskName);
  await attachFileToEntity(page, {
    name: "cover-ref.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await triggerSyncAndWait(page);

  // Remove cover from goal
  await navigateToGoals(page);
  await openGoalDetail(page, goalName);
  await removeCoverFromGoal(page);
  await triggerSyncAndWait(page);

  // File still accessible — attachment still references it
  const fileResponse = await getFileFromServer(getCredentials(), [hash]);
  expect(fileResponse.ok).toBe(true);
  expect(fileResponse.files[0]?.data).toBeDefined();
  expect(fileResponse.files[0]?.error).toBeUndefined();
});
