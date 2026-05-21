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

// State carried between sequential tests (5.4.1 → ...)
let createdCategoryName: string;
let createdCategoryId: string;

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
  categories: Array<{
    id: string;
    name: string;
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
    categories: Array<{
      id: string;
      name: string;
      sort_order: number;
      is_deleted: boolean;
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// 5.4.1 — Create category locally → push → verify category exists on server
// ---------------------------------------------------------------------------
test("create category locally → push → verify category exists on server", async () => {
  createdCategoryName = `Sync Test Category ${Date.now()}`;

  // Navigate to the Categories page
  await page.goto("/categories");
  await page.waitForSelector('[data-testid="categories-page"]');

  // Add a category via the UI
  await page.getByTestId("add-category-button").first().click();
  await page.getByTestId("add-category-input").fill(createdCategoryName);
  await page.getByTestId("add-category-input").press("Enter");

  // Wait for the category to appear in the list
  await page
    .locator(`text=${createdCategoryName}`)
    .waitFor({ state: "visible" });

  // Trigger push + pull immediately instead of waiting for the debounce process
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  expect(pullResponse.ok).toBe(true);

  const serverCategory = pullResponse.categories.find(
    (category) => category.name === createdCategoryName && !category.is_deleted,
  );
  expect(serverCategory).toBeDefined();
  if (!serverCategory) return;
  expect(serverCategory.is_deleted).toBe(false);

  createdCategoryId = serverCategory.id;
});

// ---------------------------------------------------------------------------
// 5.4.2 — Modify category → push → pull → verify
// ---------------------------------------------------------------------------
test("modify category → push → pull → verify", async () => {
  // Navigate to category detail page
  await page.locator(`text=${createdCategoryName}`).click();
  await page.waitForSelector('[data-testid="category-detail-page"]');

  // Enter edit mode
  await page.getByTestId("category-edit-btn").click();

  // Change name
  const updatedCategoryName = `Updated Category ${Date.now()}`;
  await page.getByTestId("category-name-input").fill(updatedCategoryName);

  // Save
  await page.getByTestId("category-save-btn").click();

  // Update shared state
  createdCategoryName = updatedCategoryName;

  // Trigger sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  const serverCategory = pullResponse.categories.find(
    (category) => category.id === createdCategoryId,
  );
  expect(serverCategory).toBeDefined();
  expect(serverCategory?.name).toBe(updatedCategoryName);
  expect(serverCategory?.is_deleted).toBe(false);

  // Navigate back to the categories list
  await page.goto("/categories");
  await page.waitForSelector('[data-testid="categories-page"]');
});

// ---------------------------------------------------------------------------
// 5.4.3 — Soft-delete category → push → pull → verify
// ---------------------------------------------------------------------------
test("soft-delete category → push → pull → verify", async () => {
  // Navigate to category detail page
  await page.locator(`text=${createdCategoryName}`).click();
  await page.waitForSelector('[data-testid="category-detail-page"]');

  // Enter edit mode
  await page.getByTestId("category-edit-btn").click();

  // Click delete
  await page.getByTestId("category-delete-btn").click();

  // Confirm deletion
  await page.getByTestId("category-delete-confirm-btn").click();

  // Wait for navigation back to /categories
  await page.waitForSelector('[data-testid="categories-page"]');

  // Trigger sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  const serverCategory = pullResponse.categories.find(
    (category) => category.id === createdCategoryId,
  );
  expect(serverCategory).toBeDefined();
  expect(serverCategory?.is_deleted).toBe(true);
});
