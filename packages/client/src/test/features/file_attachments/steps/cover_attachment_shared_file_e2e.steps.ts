/** Verifies FR7, FR18 of add-file-attachments */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE_PATH = path.resolve(
  currentDir,
  "../../../fixtures/test-cover-image.png",
);

const GOAL_CREATION_TIMEOUT_MS = 5000;
const COVER_UPLOAD_TIMEOUT_MS = 5000;

// Verifies FR7, FR18 of add-file-attachments
Given(
  "user creates a goal {string}",
  async ({ page }, goalName: string) => {
    await page.goto("/goals");
    await page.getByTestId("add-goal-button").first().click();
    const goalInput = page.getByTestId("add-goal-input");
    await goalInput.waitFor({ state: "visible" });
    await goalInput.fill(goalName);
    await goalInput.press("Enter");
    await page
      .getByText(goalName)
      .waitFor({ state: "visible", timeout: GOAL_CREATION_TIMEOUT_MS });
  },
);

// Verifies FR7, FR18 of add-file-attachments
Given(
  "user opens goal {string} in edit mode",
  async ({ page }, goalName: string) => {
    await page.getByText(goalName).click();
    await page
      .getByTestId("goal-detail-page")
      .waitFor({ state: "visible" });
    await page.getByTestId("edit-goal-button").click();
  },
);

// Verifies FR7, FR18 of add-file-attachments
When("user uploads test image as cover", async ({ page }) => {
  const coverInput = page.getByTestId("cover-file-input");
  await coverInput.setInputFiles(TEST_IMAGE_PATH);
  await page.getByTestId("cover-preview-img").waitFor({
    state: "visible",
    timeout: COVER_UPLOAD_TIMEOUT_MS,
  });
});

// Verifies FR7, FR18 of add-file-attachments
Then("cover preview is visible", async ({ page }) => {
  const coverPreview = page.getByTestId("cover-preview-img");
  await expect(coverPreview).toBeVisible();
});

// Verifies FR7, FR18 of add-file-attachments
When("user switches to Attachments tab", async ({ page }) => {
  await page.getByTestId("goal-tab-attachments").click();
});

// Verifies FR7, FR18 of add-file-attachments
When("user uploads test image as attachment", async ({ page }) => {
  const attachInput = page.getByTestId("attach-file-input");
  await attachInput.setInputFiles(TEST_IMAGE_PATH);
});

// Verifies FR7, FR18 of add-file-attachments
Then("attachment appears in the list", async ({ page }) => {
  const attachmentList = page.getByTestId("attachment-list");
  await attachmentList.waitFor({ state: "visible" });
});

// Verifies FR7, FR18 of add-file-attachments
When("user deletes the attachment", async ({ page }) => {
  const deleteButton = page
    .locator('[data-testid^="attachment-delete-"]')
    .first();
  await deleteButton.click();
});

// Verifies FR7, FR18 of add-file-attachments
When("user confirms deletion in dialog", async ({ page }) => {
  await page.getByTestId("confirm-dialog-confirm").click();
});

// Verifies FR7, FR18 of add-file-attachments
Then("attachment list is empty", async ({ page }) => {
  const attachmentList = page.getByTestId("attachment-list");
  await expect(attachmentList).not.toBeVisible();
});

// Verifies FR7, FR18 of add-file-attachments
Then("cover preview is still visible", async ({ page }) => {
  const coverPreview = page.getByTestId("cover-preview-img");
  await expect(coverPreview).toBeVisible();
  const coverSrc = await coverPreview.getAttribute("src");
  expect(coverSrc).toBeTruthy();
  expect(coverSrc).toContain("blob:");
});
