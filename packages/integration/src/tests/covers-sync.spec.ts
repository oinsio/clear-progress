// implements FR7 of add-supabase-integration-tests
import { expect, test } from "@playwright/test";
import {
  createGoal,
  navigateToGoals,
  openGoalDetail,
} from "../page-actions.js";
import {
  createMinimalPng,
  getCoverFromServer,
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

// State carried between sequential tests (5.9.1 → 5.9.2 → 5.9.3)
let coverGoalName: string;
let coverGoalId: string;
let coverFileId: string;

interface CoverPullResponse {
  ok: boolean;
  goals: Array<{
    id: string;
    name: string;
    cover_file_id: string;
    is_deleted: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// 5.9.1 — Upload cover for a goal → push → verify cover_file_id on server
// ---------------------------------------------------------------------------
test("upload cover for a goal → push → verify cover_file_id on server", async () => {
  const page = getPage();
  coverGoalName = `Cover Test Goal ${Date.now()}`;

  // Navigate to Goals page, create goal, open detail
  await navigateToGoals(page);
  await createGoal(page, coverGoalName);
  await openGoalDetail(page, coverGoalName);

  // Enter edit mode
  await page.getByTestId("edit-goal-button").click();

  // Upload a cover image via the hidden file input
  const pngBuffer = createMinimalPng();
  await page.getByTestId("cover-file-input").setInputFiles({
    name: "test-cover.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });

  // Wait for cover preview to appear
  await page.getByTestId("cover-preview-img").waitFor({ state: "visible" });

  // Save changes
  await page.getByTestId("goal-save-button").click();

  // Wait for edit mode to close (detail page visible without edit controls)
  await page.getByTestId("edit-goal-button").waitFor({ state: "visible" });

  // Trigger sync to push the cover to server
  await triggerSyncAndWait(page);

  // Verify server-side state — cover_file_id must be non-empty
  const pullResponse = await pullFromServer<CoverPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverGoal = pullResponse.goals.find(
    (goal) => goal.name === coverGoalName,
  );
  expect(serverGoal).toBeDefined();
  expect(serverGoal?.cover_file_id).not.toBe("");

  coverGoalId = serverGoal?.id ?? "";
  coverFileId = serverGoal?.cover_file_id ?? "";
});

// ---------------------------------------------------------------------------
// 5.9.2 — Retrieve cover URL → verify file is accessible on server
// ---------------------------------------------------------------------------
test("retrieve cover from server → verify image data is accessible", async () => {
  // Use the get-cover Edge Function to fetch the uploaded cover
  const coverResponse = await getCoverFromServer(getCredentials(), [
    coverFileId,
  ]);
  expect(coverResponse.ok).toBe(true);
  expect(coverResponse.covers).toHaveLength(1);

  const coverResult = coverResponse.covers[0];
  expect(coverResult).toBeDefined();
  expect(coverResult?.file_id).toBe(coverFileId);
  expect(coverResult?.mime_type).toContain("image");
  expect(coverResult?.data).toBeDefined();
  expect(coverResult?.error).toBeUndefined();

  // Verify the returned data is valid base64 (decodable)
  const decodedBytes = Buffer.from(coverResult?.data ?? "", "base64");
  expect(decodedBytes.length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// 5.9.3 — Delete cover → push → verify cover_file_id is empty on server
// ---------------------------------------------------------------------------
test("delete cover → push → verify cover_file_id is empty on server", async () => {
  const page = getPage();
  // Should still be on the goal detail page from 5.9.1
  // Enter edit mode
  await page.getByTestId("edit-goal-button").click();

  // Remove the cover
  await page.getByTestId("cover-remove-button").click();

  // Save changes
  await page.getByTestId("goal-save-button").click();

  // Wait for edit mode to close
  await page.getByTestId("edit-goal-button").waitFor({ state: "visible" });

  // Trigger sync to push the removal to server
  await triggerSyncAndWait(page);

  // Verify server-side state — cover_file_id must be empty
  const pullResponse = await pullFromServer<CoverPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverGoal = pullResponse.goals.find((goal) => goal.id === coverGoalId);
  expect(serverGoal).toBeDefined();
  expect(serverGoal?.cover_file_id).toBe("");
});
