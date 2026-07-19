// Integration test for cross-device file download bug.
// Scenario: attach file on Device A, sync, sync Device B,
// verify Device B can preview and download the attachment.
// Uses a real 441 KB JPEG to reproduce the get-file 500 error
// caused by String.fromCharCode(...bytes) stack overflow on large files.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { createTask, openTaskDetail } from "../page-task-actions.js";
import {
  getFileFromServer,
  pullFromServer,
  setupTwoDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const FILE_CACHE_TIMEOUT_MS = 10_000;

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

interface FileSyncPullResponse {
  ok: boolean;
  attachments: Array<{
    id: string;
    entity_id: string;
    data_hash: string;
    filename: string;
    is_deleted: boolean;
  }>;
  tasks: Array<{ id: string; name: string; is_deleted: boolean }>;
}

test("file attached on Device A is previewable and downloadable on Device B", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const taskName = `File Download Bug ${Date.now()}`;

  // --- Device A: create task, attach file, sync ---
  await createTask(pageA, taskName);
  await triggerSyncAndWait(pageA);

  await openTaskDetail(pageA, taskName);
  await pageA.getByTestId("tab-attachments").click();

  // Use a real 441 KB JPEG to trigger the get-file base64 stack overflow bug
  const realImagePath = resolve(
    import.meta.dirname,
    "../fixtures/primula.jpeg",
  );
  const jpegBuffer = readFileSync(realImagePath);
  await pageA.getByTestId("attach-file-input").setInputFiles({
    name: "primula.jpeg",
    mimeType: "image/jpeg",
    buffer: jpegBuffer,
  });

  await pageA
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .waitFor({ state: "visible" });

  await triggerSyncAndWait(pageA);

  // --- Verify server state: attachment metadata + file blob accessible ---
  const pullResponse = await pullFromServer<FileSyncPullResponse>(
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
      attachment.filename === "primula.jpeg",
  );
  expect(serverAttachment).toBeDefined();
  expect(serverAttachment?.data_hash).toBeTruthy();

  // Verify file blob is actually downloadable from server
  const fileResponse = await getFileFromServer(getCredentials(), [
    serverAttachment?.data_hash ?? "",
  ]);
  expect(fileResponse.ok).toBe(true);
  expect(fileResponse.files).toHaveLength(1);
  expect(fileResponse.files[0]?.data).toBeDefined();
  expect(fileResponse.files[0]?.error).toBeUndefined();

  // --- Device B: capture get-file API calls for diagnostics ---
  const getFileResponses: Array<{ status: number; body: string }> = [];
  pageB.on("response", (response) => {
    if (response.url().includes("get-file")) {
      void response.text().then((body) => {
        getFileResponses.push({ status: response.status(), body });
      });
    }
  });

  const consoleLogs: string[] = [];
  pageB.on("console", (message) => {
    if (
      message.text().includes("FileSyncService") ||
      message.text().includes("get-file") ||
      message.type() === "error"
    ) {
      consoleLogs.push(`[${message.type()}] ${message.text()}`);
    }
  });

  // --- Device B: sync, open task, go to attachments ---
  await triggerSyncAndWait(pageB);
  await openTaskDetail(pageB, taskName);
  await pageB.getByTestId("tab-attachments").click();

  const attachmentItem = pageB
    .locator('[data-testid^="attachment-item-"]')
    .first();
  await attachmentItem.waitFor({ state: "visible" });

  // --- Verify download button becomes enabled (file blob is cached) ---
  const downloadButton = pageB
    .locator('[data-testid^="attachment-download-"]')
    .first();

  await expect(downloadButton).toBeVisible();

  // The download button has disabled={!url} — poll until file is cached
  try {
    await expect(downloadButton).toBeEnabled({
      timeout: FILE_CACHE_TIMEOUT_MS,
    });
  } catch (error) {
    // Dump diagnostics on failure
    console.error("=== DIAGNOSTICS: Download button remained disabled ===");
    console.error("get-file API responses:", JSON.stringify(getFileResponses));
    console.error("Console logs from Device B:", consoleLogs);
    throw error;
  }

  // --- Verify preview works: click preview, lightbox opens with image ---
  const previewButton = pageB
    .locator('[data-testid^="attachment-preview-"]')
    .first();
  await previewButton.click();

  const lightbox = pageB.getByTestId("file-lightbox");
  await lightbox.waitFor({ state: "visible" });

  // Lightbox should contain an <img> with a blob: URL (file was fetched)
  const lightboxImage = lightbox.locator("img");
  await lightboxImage.waitFor({
    state: "visible",
    timeout: FILE_CACHE_TIMEOUT_MS,
  });

  const imageSrc = await lightboxImage.getAttribute("src");
  expect(imageSrc).toBeTruthy();
  // blob: URL means the file was successfully fetched and cached locally
  expect(imageSrc).toMatch(/^blob:/);

  // Close lightbox
  await pageB.getByTestId("file-lightbox-close").click();
  await lightbox.waitFor({ state: "detached" });
});
