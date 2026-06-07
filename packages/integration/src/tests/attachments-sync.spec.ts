// implements FR6 of add-file-attachments
// Integration tests for attachment sync between devices.
// Tasks 13.3-13.7 from add-file-attachments change.
import { expect, test } from "@playwright/test";
import { createTask, openTaskDetail } from "../page-actions.js";
import {
  createMinimalPng,
  pullFromServer,
  setupTwoDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

// State carried between sequential tests
let taskName: string;

interface AttachmentPullResponse {
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
    mime_type: string;
    is_deleted: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// 13.3 — Attachment create -> sync -> appears on second device
// ---------------------------------------------------------------------------
test("attachment create -> sync -> appears on second device", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  taskName = `Attachment Task ${Date.now()}`;

  // Device A: Create a task
  await createTask(pageA, taskName);
  await triggerSyncAndWait(pageA);

  // Device A: Open task detail, switch to attachments tab, and attach a file
  await openTaskDetail(pageA, taskName);
  await pageA.getByTestId("tab-attachments").click();
  const pngBuffer = createMinimalPng();
  await pageA.getByTestId("attach-file-input").setInputFiles({
    name: "test-attachment.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });

  // Wait for attachment to appear in the list
  await pageA
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .waitFor({ state: "visible" });

  // Sync Device A
  await triggerSyncAndWait(pageA);

  // Verify attachment exists on server via pull
  const pullResponse = await pullFromServer<AttachmentPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverTask = pullResponse.tasks.find(
    (task) => task.name === taskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();

  const serverAttachment = pullResponse.attachments.find(
    (attachment) =>
      attachment.entity_id === serverTask?.id && !attachment.is_deleted,
  );
  expect(serverAttachment).toBeDefined();
  expect(serverAttachment?.filename).toBe("test-attachment.png");
  expect(serverAttachment?.mime_type).toContain("image");

  // Device B: Sync and verify attachment is visible
  await triggerSyncAndWait(pageB);
  await openTaskDetail(pageB, taskName);
  await pageB.getByTestId("tab-attachments").click();

  await pageB
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .waitFor({ state: "visible" });

  const attachmentText = await pageB
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .textContent();
  expect(attachmentText).toContain("test-attachment");
});

// ---------------------------------------------------------------------------
// 13.4 — Attachment soft-delete -> sync -> deleted on second device
// ---------------------------------------------------------------------------
test("attachment soft-delete -> sync -> deleted on second device", async () => {
  const pageA = getPageA();
  const pageB = getPageB();

  // Device A: Should still have task detail open from 13.3
  // Delete the attachment
  await pageA.locator('[data-testid^="attachment-delete-"]').first().click();

  // Confirm deletion if there is a confirmation dialog
  const confirmButton = pageA.getByTestId("confirm-dialog-confirm");
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }

  // Wait for attachment to disappear
  await pageA
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .waitFor({ state: "detached" })
    .catch(() => {
      // Attachment list may be empty, which is fine
    });

  // Sync Device A
  await triggerSyncAndWait(pageA);

  // Verify server shows attachment as deleted
  const pullResponse = await pullFromServer<AttachmentPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const deletedAttachments = pullResponse.attachments.filter(
    (attachment) =>
      attachment.is_deleted && attachment.filename === "test-attachment.png",
  );
  expect(deletedAttachments.length).toBeGreaterThanOrEqual(1);

  // Device B: Navigate back to task list, sync and verify attachment is gone
  await pageB.goBack();
  await triggerSyncAndWait(pageB);
  await openTaskDetail(pageB, taskName);
  await pageB.getByTestId("tab-attachments").click();

  const attachmentCount = await pageB
    .locator('[data-testid^="attachment-item-"]')
    .count();
  expect(attachmentCount).toBe(0);
});
