// implements FR6 of add-file-attachments
// Integration test for offline attachment creation -> pending file -> sync on reconnect.
// Task 13.7 from add-file-attachments change.
import { expect, test } from "@playwright/test";
import { createTask, openTaskDetail } from "../page-task-actions.js";
import {
  createMinimalPng,
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

interface OfflinePullResponse {
  ok: boolean;
  tasks: Array<{ id: string; name: string; is_deleted: boolean }>;
  attachments: Array<{
    id: string;
    entity_id: string;
    data_hash: string;
    filename: string;
    is_deleted: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// 13.7 — Offline attachment creation -> pending file -> sync on reconnect
// ---------------------------------------------------------------------------
test("offline attachment creation -> pending file -> sync on reconnect -> file on server", async () => {
  const page = getPage();
  const taskName = `Offline Attachment Task ${Date.now()}`;

  // Create a task and sync while online
  await createTask(page, taskName);
  await triggerSyncAndWait(page);

  // Go offline by blocking network requests to the Supabase API
  await page.context().setOffline(true);

  // Open task detail, switch to attachments tab, and attach a file while offline
  await openTaskDetail(page, taskName);
  await page.getByTestId("tab-attachments").click();
  const pngBuffer = createMinimalPng();
  await page.getByTestId("attach-file-input").setInputFiles({
    name: "offline-attachment.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });

  // Attachment should appear locally (pending state)
  await page
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .waitFor({ state: "visible" });

  // Go back online
  await page.context().setOffline(false);

  // Trigger sync — pending file should be uploaded
  await triggerSyncAndWait(page);

  // Verify attachment exists on server
  const pullResponse = await pullFromServer<OfflinePullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverTask = pullResponse.tasks.find(
    (task) => task.name === taskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();

  const serverAttachment = pullResponse.attachments.find(
    (attachment) =>
      attachment.entity_id === serverTask?.id &&
      !attachment.is_deleted &&
      attachment.filename === "offline-attachment.png",
  );
  expect(serverAttachment).toBeDefined();
  expect(serverAttachment?.data_hash).not.toBe("");
});
