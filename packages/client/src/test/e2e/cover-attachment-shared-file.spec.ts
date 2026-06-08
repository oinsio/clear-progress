/**
 * E2E test: cover image preserved when same-hash attachment is deleted.
 * Verifies FR7, FR18 of add-file-attachments.
 *
 * Scenario:
 * 1. Create a goal
 * 2. Upload a cover image
 * 3. Switch to Attachments tab and attach the same file
 * 4. Delete the attachment
 * 5. Verify cover image is still displayed
 */

import path from "node:path";
import { expect, test } from "@playwright/test";

import { createGoalViaUI, openGoalEditMode } from "./helpers/goal-helpers";

const TEST_IMAGE_PATH = path.resolve(
  __dirname,
  "../fixtures/test-cover-image.png",
);

const GOAL_NAME = "Test goal with shared cover and attachment";
const COVER_UPLOAD_TIMEOUT_MS = 5000;

test.describe("Cover + Attachment shared file", () => {
  test("cover image preserved when same-hash attachment is deleted", async ({
    page,
  }) => {
    // 1. Create goal
    await createGoalViaUI(page, GOAL_NAME);

    // 2. Open goal and enter edit mode
    await openGoalEditMode(page, GOAL_NAME);

    // 3. Upload cover image
    const coverInput = page.getByTestId("cover-file-input");
    await coverInput.setInputFiles(TEST_IMAGE_PATH);

    // Wait for cover preview to appear
    await page.getByTestId("cover-preview-img").waitFor({
      state: "visible",
      timeout: COVER_UPLOAD_TIMEOUT_MS,
    });

    // 4. Switch to Attachments tab and attach the same file
    await page.getByTestId("goal-tab-attachments").click();

    const attachInput = page.getByTestId("attach-file-input");
    await attachInput.setInputFiles(TEST_IMAGE_PATH);

    // Wait for the attachment to appear in the list
    const attachmentList = page.getByTestId("attachment-list");
    await attachmentList.waitFor({ state: "visible" });

    // 5. Delete the attachment
    const deleteButton = page
      .locator('[data-testid^="attachment-delete-"]')
      .first();
    await deleteButton.click();

    // Confirm deletion
    await page.getByTestId("confirm-dialog-confirm").click();

    // Wait for attachment list to become empty
    await expect(attachmentList).not.toBeVisible();

    // 6. Verify cover image is still displayed
    const coverPreview = page.getByTestId("cover-preview-img");
    await expect(coverPreview).toBeVisible();
    const coverSrc = await coverPreview.getAttribute("src");
    expect(coverSrc).toBeTruthy();
    expect(coverSrc).toContain("blob:");
  });
});
