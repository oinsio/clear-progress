// implements M1 of fix-file-mime-detection
// Integration tests verifying that files with mismatched extensions are stored
// with the correct content-detected MIME type on the server.

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { attachFileToEntity } from "../page-attachment-actions.js";
import {
  createGoal,
  navigateToGoals,
  openGoalDetail,
  uploadCoverToGoal,
} from "../page-goal-category-actions.js";
import { createTask, openTaskDetail } from "../page-task-actions.js";
import {
  findServerAttachmentForTask,
  getFileFromServer,
  pullFromServer,
  type RefCountPullResponse,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

const FIXTURE_FILENAME = "jugru.png";
const EXPECTED_DETECTED_MIME = "image/webp";
const DECLARED_MIME_FROM_EXTENSION = "image/png";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(currentDir, "../fixtures", FIXTURE_FILENAME);
const fixtureBuffer = fs.readFileSync(fixturePath);
const fixtureFile = {
  name: FIXTURE_FILENAME,
  mimeType: DECLARED_MIME_FROM_EXTENSION,
  buffer: fixtureBuffer,
};

// ---------------------------------------------------------------------------
// Test: Upload WebP-as-PNG as goal cover — server stores image/webp
// ---------------------------------------------------------------------------
test("upload WebP-disguised-as-PNG as goal cover → server stores correct MIME", async () => {
  const page = getPage();
  const goalName = `MIME Detection Cover ${Date.now()}`;

  await navigateToGoals(page);
  await createGoal(page, goalName);
  await openGoalDetail(page, goalName);
  await uploadCoverToGoal(page, fixtureFile);
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<RefCountPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverGoal = pullResponse.goals.find(
    (goal) => goal.name === goalName && !goal.is_deleted,
  );
  expect(serverGoal).toBeDefined();
  expect(serverGoal?.cover_hash).not.toBe("");

  // Retrieve file from server — verify MIME is detected as WebP, not PNG
  const coverHash = serverGoal?.cover_hash ?? "";
  const fileResponse = await getFileFromServer(getCredentials(), [coverHash]);
  expect(fileResponse.ok).toBe(true);
  expect(fileResponse.files).toHaveLength(1);

  const coverFile = fileResponse.files[0];
  expect(coverFile?.mime_type).toBe(EXPECTED_DETECTED_MIME);
});

// ---------------------------------------------------------------------------
// Test: Attach WebP-as-PNG as file attachment — server stores image/webp
// ---------------------------------------------------------------------------
test("attach WebP-disguised-as-PNG to task → server stores correct MIME", async () => {
  const page = getPage();
  const taskName = `MIME Detection Attach ${Date.now()}`;

  await page.goto("/tasks");
  await page.waitForSelector('[data-testid="active-tasks-page"]');
  await createTask(page, taskName);
  await openTaskDetail(page, taskName);
  await attachFileToEntity(page, fixtureFile);
  await triggerSyncAndWait(page);

  const { serverAttachment } = await findServerAttachmentForTask(
    getCredentials(),
    taskName,
  );
  expect(serverAttachment.mime_type).toBe(EXPECTED_DETECTED_MIME);
});
