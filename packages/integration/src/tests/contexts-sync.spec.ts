// implements FR6, FR8 of add-supabase-integration-tests
import { expect, test } from "@playwright/test";
import {
  pullFromServer,
  setupSingleDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPage, getCredentials } = setupSingleDeviceTest();

// State carried between sequential tests (5.5.1 → ...)
let createdContextName: string;
let createdContextId: string;

// ---------------------------------------------------------------------------

interface ContextsPullResponse {
  ok: boolean;
  contexts: Array<{
    id: string;
    name: string;
    sort_order: number;
    is_deleted: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// 5.5.1 — Create context locally → push → verify context exists on server
// ---------------------------------------------------------------------------
test("create context locally → push → verify context exists on server", async () => {
  const page = getPage();
  createdContextName = `Sync Test Context ${Date.now()}`;

  // Navigate to Contexts page
  await page.goto("/contexts");
  await page.waitForSelector('[data-testid="contexts-page"]');

  // Add a context via the UI
  await page.getByTestId("add-context-button").first().click();
  await page.getByTestId("add-context-input").fill(createdContextName);
  await page.getByTestId("add-context-input").press("Enter");

  // Wait for the context to appear in the list
  await page
    .locator(`text=${createdContextName}`)
    .waitFor({ state: "visible" });

  // Trigger push + pull immediately instead of waiting for the debounce process
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<ContextsPullResponse>(
    getCredentials(),
  );
  expect(pullResponse.ok).toBe(true);

  const serverContext = pullResponse.contexts.find(
    (context) => context.name === createdContextName && !context.is_deleted,
  );
  expect(serverContext).toBeDefined();
  if (!serverContext) return;
  expect(serverContext.is_deleted).toBe(false);

  createdContextId = serverContext.id;
});

// ---------------------------------------------------------------------------
// 5.5.2 — Modify context → push → pull → verify
// ---------------------------------------------------------------------------
test("modify context → push → pull → verify", async () => {
  const page = getPage();
  // Navigate to context detail page
  await page.locator(`text=${createdContextName}`).click();
  await page.waitForSelector('[data-testid="context-detail-page"]');

  // Enter edit mode
  await page.getByTestId("context-edit-btn").click();

  // Change name
  const updatedContextName = `Updated Context ${Date.now()}`;
  await page.getByTestId("context-name-input").fill(updatedContextName);

  // Save
  await page.getByTestId("context-save-btn").click();

  // Update shared state
  createdContextName = updatedContextName;

  // Trigger sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<ContextsPullResponse>(
    getCredentials(),
  );
  const serverContext = pullResponse.contexts.find(
    (context) => context.id === createdContextId,
  );
  expect(serverContext).toBeDefined();
  expect(serverContext?.name).toBe(updatedContextName);
  expect(serverContext?.is_deleted).toBe(false);

  // Navigate back to contexts list
  await page.goto("/contexts");
  await page.waitForSelector('[data-testid="contexts-page"]');
});

// ---------------------------------------------------------------------------
// 5.5.3 — Soft-delete context → push → pull → verify
// ---------------------------------------------------------------------------
test("soft-delete context → push → pull → verify", async () => {
  const page = getPage();
  // Navigate to context detail page
  await page.locator(`text=${createdContextName}`).click();
  await page.waitForSelector('[data-testid="context-detail-page"]');

  // Enter edit mode
  await page.getByTestId("context-edit-btn").click();

  // Click delete
  await page.getByTestId("context-delete-btn").click();

  // Confirm deletion
  await page.getByTestId("context-delete-confirm-btn").click();

  // Wait for navigation back to /contexts
  await page.waitForSelector('[data-testid="contexts-page"]');

  // Trigger sync and verify on server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer<ContextsPullResponse>(
    getCredentials(),
  );
  const serverContext = pullResponse.contexts.find(
    (context) => context.id === createdContextId,
  );
  expect(serverContext).toBeDefined();
  expect(serverContext?.is_deleted).toBe(true);
});
