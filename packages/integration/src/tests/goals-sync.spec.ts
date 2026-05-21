// implements FR6, FR8 of add-supabase-integration-tests
import { expect, type Page, test } from "@playwright/test";
import {
  closeAuthenticatedPage,
  createAuthenticatedPage,
  triggerSyncAndWait,
} from "../test-helpers.js";

test.describe.configure({ mode: "serial" });

let page: Page;
let accessToken: string;
let supabaseUrl: string;
let anonKey: string;

// State carried between sequential tests (5.3.1 → 5.3.2 → 5.3.3)
let createdGoalName: string;
let createdGoalId: string;

test.beforeAll(async ({ browser: b }) => {
  const auth = await createAuthenticatedPage(b);
  page = auth.page;
  accessToken = auth.accessToken;
  supabaseUrl = auth.supabaseUrl;
  anonKey = auth.anonKey;
});

test.afterAll(async () => {
  await closeAuthenticatedPage(page);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calls the pull Edge Function from Node.js to verify server-side state.
 * Uses since_revision=0 to receive the full dataset.
 */
async function pullFromServer(): Promise<{
  ok: boolean;
  goals: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    cover_file_id: string;
    sort_order: number;
    is_deleted: boolean;
  }>;
}> {
  const response = await fetch(`${supabaseUrl}/functions/v1/pull`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ since_revision: 0 }),
  });
  if (!response.ok) {
    throw new Error(`pull failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as Promise<{
    ok: boolean;
    goals: Array<{
      id: string;
      name: string;
      description: string;
      status: string;
      cover_file_id: string;
      sort_order: number;
      is_deleted: boolean;
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// 5.3.1 — Create goal locally → push → verify goal exists on server
// ---------------------------------------------------------------------------
test("create goal locally → push → verify goal exists on server", async () => {
  createdGoalName = `Sync Test Goal ${Date.now()}`;

  // Navigate to Goals page
  await page.goto("/goals");
  await page.waitForSelector('[data-testid="goals-page"]');

  // Add a goal via the UI
  await page.getByTestId("add-goal-button").first().click();
  await page.getByTestId("add-goal-input").fill(createdGoalName);
  await page.getByTestId("add-goal-input").press("Enter");

  // Wait for the goal to appear in the list
  await page
    .locator('[data-testid="goal-item"]')
    .filter({
      has: page.locator(`text=${createdGoalName}`),
    })
    .waitFor({ state: "visible" });

  // Trigger push + pull immediately instead of waiting for the debounce process
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  expect(pullResponse.ok).toBe(true);

  const serverGoal = pullResponse.goals.find(
    (goal) => goal.name === createdGoalName && !goal.is_deleted,
  );
  expect(serverGoal).toBeDefined();
  if (!serverGoal) return;
  expect(serverGoal.is_deleted).toBe(false);
  expect(serverGoal.status).toBe("planning");

  createdGoalId = serverGoal.id;
});

// ---------------------------------------------------------------------------
// 5.3.2 — Modify goal (title, status) → push → pull → verify changes
// ---------------------------------------------------------------------------
test("modify goal (title, status) → push → pull → verify changes", async () => {
  // Navigate to the goal detail page
  await page
    .locator('[data-testid="goal-item"]')
    .filter({ has: page.locator(`text=${createdGoalName}`) })
    .locator('[data-testid="goal-navigate-button"]')
    .click();

  await page.waitForSelector('[data-testid="goal-detail-page"]');

  // Enter edit mode
  await page.getByTestId("edit-goal-button").click();

  // Change the name
  const updatedGoalName = `Updated Goal ${Date.now()}`;
  await page.getByTestId("goal-name-input").fill(updatedGoalName);

  // Change status to "in_progress" (4th button, index 3):
  // Order: cancelled(0), paused(1), planning(2), in_progress(3), completed(4)
  const statusButtons = page
    .getByTestId("goal-card")
    .locator(".flex.rounded-full.border-accent button");
  await statusButtons.nth(3).click();

  // Save changes
  await page.getByTestId("goal-save-button").click();

  // Update shared state for subsequent tests
  createdGoalName = updatedGoalName;

  // Push changes to server
  await triggerSyncAndWait(page);

  // Verify server-side state
  const pullResponse = await pullFromServer();
  expect(pullResponse.ok).toBe(true);

  const serverGoal = pullResponse.goals.find(
    (goal) => goal.id === createdGoalId,
  );
  expect(serverGoal).toBeDefined();
  if (!serverGoal) return;
  expect(serverGoal.name).toBe(updatedGoalName);
  expect(serverGoal.status).toBe("in_progress");
  expect(serverGoal.is_deleted).toBe(false);

  // Navigate back to /goals for subsequent tests
  await page.goto("/goals");
  await page.waitForSelector('[data-testid="goals-page"]');
});

// ---------------------------------------------------------------------------
// 5.3.3 — Soft-delete goal → push → pull → verify is_deleted
// ---------------------------------------------------------------------------
test("soft-delete goal → push → pull → verify is_deleted", async () => {
  // Navigate to the goal detail page
  await page
    .locator('[data-testid="goal-item"]')
    .filter({ has: page.locator(`text=${createdGoalName}`) })
    .locator('[data-testid="goal-navigate-button"]')
    .click();

  await page.waitForSelector('[data-testid="goal-detail-page"]');

  // Enter edit mode
  await page.getByTestId("edit-goal-button").click();

  // Click delete button
  await page.getByTestId("goal-delete-button").click();

  // Wait for delete confirmation dialog and confirm
  await page.waitForSelector('[data-testid="goal-delete-confirm"]');
  await page.getByTestId("goal-delete-confirm-btn").click();

  // After deletion, the app navigates back to /goals
  await page.waitForSelector('[data-testid="goals-page"]');

  // Push changes to server
  await triggerSyncAndWait(page);

  // Verify server-side state — goal should be soft-deleted
  const pullResponse = await pullFromServer();
  const serverGoal = pullResponse.goals.find(
    (goal) => goal.id === createdGoalId,
  );
  expect(serverGoal).toBeDefined();
  expect(serverGoal?.is_deleted).toBe(true);
});
