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

// State carried between sequential tests (5.6.1 → ...)
let createdIdeaName: string;
let createdIdeaId: string;

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
  ideas: Array<{
    id: string;
    name: string;
    description: string;
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
    ideas: Array<{
      id: string;
      name: string;
      description: string;
      sort_order: number;
      is_deleted: boolean;
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// 5.6.1 — Create idea locally → push → verify idea exists on server
// ---------------------------------------------------------------------------
test("create idea locally → push → verify idea exists on server", async () => {
  createdIdeaName = `Sync Test Idea ${Date.now()}`;

  // Navigate to Ideas page
  await page.goto("/ideas");
  await page.waitForSelector('[data-testid="ideas-page"]');

  // Add an idea via the UI
  await page.getByTestId("add-idea-button").first().click();
  await page.getByTestId("add-idea-input").fill(createdIdeaName);
  await page.getByTestId("add-idea-input").press("Enter");

  // Wait for the idea to appear in the list
  await page.locator(`text=${createdIdeaName}`).waitFor({ state: "visible" });

  // Trigger push + pull immediately instead of waiting for the debounce process
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  expect(pullResponse.ok).toBe(true);

  const serverIdea = pullResponse.ideas.find(
    (idea) => idea.name === createdIdeaName && !idea.is_deleted,
  );
  expect(serverIdea).toBeDefined();
  if (!serverIdea) return;
  expect(serverIdea.is_deleted).toBe(false);

  createdIdeaId = serverIdea.id;
});

// ---------------------------------------------------------------------------
// 5.6.2 — Modify idea → push → pull → verify
// ---------------------------------------------------------------------------
test("modify idea → push → pull → verify", async () => {
  // Open idea detail panel by clicking edit on the matching idea item
  await page
    .locator('[data-testid="idea-item"]')
    .filter({ has: page.locator(`text=${createdIdeaName}`) })
    .locator('[data-testid="idea-edit-button"]')
    .click();
  await page.waitForSelector('[data-testid="idea-detail-panel"]');

  // Change name
  const updatedIdeaName = `Updated Idea ${Date.now()}`;
  await page.getByTestId("idea-detail-name").fill(updatedIdeaName);
  await page.getByTestId("idea-detail-name").blur(); // save on blur

  // Update shared state
  createdIdeaName = updatedIdeaName;

  // Trigger sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  const serverIdea = pullResponse.ideas.find(
    (idea) => idea.id === createdIdeaId,
  );
  expect(serverIdea).toBeDefined();
  expect(serverIdea?.name).toBe(updatedIdeaName);
  expect(serverIdea?.is_deleted).toBe(false);
});

// ---------------------------------------------------------------------------
// 5.6.3 — Soft-delete idea → push → pull → verify
// ---------------------------------------------------------------------------
test("soft-delete idea → push → pull → verify", async () => {
  // Open idea detail panel by clicking edit on the matching idea item
  await page
    .locator('[data-testid="idea-item"]')
    .filter({ has: page.locator(`text=${createdIdeaName}`) })
    .locator('[data-testid="idea-edit-button"]')
    .click();
  await page.waitForSelector('[data-testid="idea-detail-panel"]');

  // Click delete button inside the detail panel
  await page
    .getByTestId("idea-detail-panel")
    .getByRole("button", { name: /delete/i })
    .click();

  // Confirm deletion
  await page.getByTestId("idea-detail-delete-confirm-btn").click();

  // Trigger sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  const serverIdea = pullResponse.ideas.find(
    (idea) => idea.id === createdIdeaId,
  );
  expect(serverIdea).toBeDefined();
  expect(serverIdea?.is_deleted).toBe(true);
});
