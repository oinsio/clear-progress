// implements FR6, FR8 of add-supabase-integration-tests
import { expect, test } from "@playwright/test";
import {
  createCategory,
  deleteCategoryFromDetail,
  navigateToCategories,
  openCategoryDetail,
  updateCategoryName,
} from "../page-actions.js";
import {
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

// State carried between sequential tests (5.4.1 → ...)
let createdCategoryName: string;
let createdCategoryId: string;

interface CategoriesPullResponse {
  ok: boolean;
  categories: Array<{
    id: string;
    name: string;
    sort_order: number;
    is_deleted: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// 5.4.1 — Create category locally → push → verify category exists on server
// ---------------------------------------------------------------------------
test("create category locally → push → verify category exists on server", async () => {
  const page = getPage();
  createdCategoryName = `Sync Test Category ${Date.now()}`;

  // Navigate to the Categories page and add a category
  await navigateToCategories(page);
  await createCategory(page, createdCategoryName);

  // Trigger push + pull immediately instead of waiting for the debounce process
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<CategoriesPullResponse>(
    getCredentials(),
  );
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
  const page = getPage();

  // Navigate to category detail page, edit name
  await openCategoryDetail(page, createdCategoryName);
  const updatedCategoryName = `Updated Category ${Date.now()}`;
  await updateCategoryName(page, updatedCategoryName);
  createdCategoryName = updatedCategoryName;

  // Trigger sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<CategoriesPullResponse>(
    getCredentials(),
  );
  const serverCategory = pullResponse.categories.find(
    (category) => category.id === createdCategoryId,
  );
  expect(serverCategory).toBeDefined();
  expect(serverCategory?.name).toBe(updatedCategoryName);
  expect(serverCategory?.is_deleted).toBe(false);

  // Navigate back to the categories list
  await navigateToCategories(page);
});

// ---------------------------------------------------------------------------
// 5.4.3 — Soft-delete category → push → pull → verify
// ---------------------------------------------------------------------------
test("soft-delete category → push → pull → verify", async () => {
  const page = getPage();

  // Navigate to category detail page and delete
  await openCategoryDetail(page, createdCategoryName);
  await deleteCategoryFromDetail(page);

  // Trigger sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<CategoriesPullResponse>(
    getCredentials(),
  );
  const serverCategory = pullResponse.categories.find(
    (category) => category.id === createdCategoryId,
  );
  expect(serverCategory).toBeDefined();
  expect(serverCategory?.is_deleted).toBe(true);
});
