// implements FR6, FR8, FR16 of add-supabase-integration-tests
import { type Browser, expect, type Page, test } from "@playwright/test";
import { readTestConfig } from "../config.js";

const SYNC_COMPLETE_TIMEOUT_MS = 30_000;
const CONNECTION_CHECK_TIMEOUT_MS = 10_000;
const LAST_SYNC_STORAGE_KEY = "last_sync";

test.describe.configure({ mode: "serial" });

let browser: Browser;
let page: Page;
let accessToken: string;
let supabaseUrl: string;
let anonKey: string;

// State carried between sequential tests (5.2.1 → 5.2.2 → 5.2.3)
let createdTaskName: string;
let createdTaskId: string;

test.beforeAll(async ({ browser: b }) => {
  const config = readTestConfig();
  supabaseUrl = config.supabaseUrl;
  anonKey = config.anonKey;

  browser = b;
  const context = await browser.newContext();
  page = await context.newPage();

  // --- Step 1: Connect via Setup UI (as a real user would) ---
  await page.goto("/setup");
  await page.waitForLoadState("networkidle");

  await page.getByTestId("setup-supabase-section-toggle").click();
  await page.getByTestId("setup-supabase-url-input").fill(supabaseUrl);
  await page.getByTestId("setup-supabase-anon-key-input").fill(anonKey);
  await page.getByTestId("setup-supabase-connect-button").click();

  // Wait for connection to succeed — shows OAuth buttons
  const oauthButtons = page.getByTestId("setup-supabase-oauth-buttons");
  await expect(oauthButtons).toBeVisible({
    timeout: CONNECTION_CHECK_TIMEOUT_MS,
  });

  // --- Step 2: Sign in via mock OAuth (keycloak provider) ---
  await page.getByTestId("setup-supabase-oauth-keycloak").click();

  // navikt/mock-oauth2-server login form (server-rendered HTML)
  await page.waitForSelector('input[name="username"]', {
    timeout: SYNC_COMPLETE_TIMEOUT_MS,
  });
  await page.fill('input[name="username"]', "test@example.com");
  await page.locator('input[type="submit"][value="Sign-in"]').click();

  // --- Step 3: App handles callback → navigates to /tasks ---
  await page.waitForURL("**/tasks", { timeout: SYNC_COMPLETE_TIMEOUT_MS });
  await page.waitForSelector('[data-testid="inbox-page"]');

  // --- Step 4: Extract access token for server-side verification (pullFromServer) ---
  await page.waitForFunction(
    () => localStorage.getItem("access_token") !== null,
    undefined,
    { timeout: SYNC_COMPLETE_TIMEOUT_MS },
  );

  accessToken = await page.evaluate(
    () => localStorage.getItem("access_token") ?? "",
  );

  // --- Step 5: Wait for initial sync (ping → init → push/pull) ---
  await waitForLastSyncToUpdate(page, null);
});

test.afterAll(async () => {
  await page.close();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForLastSyncToUpdate(
  testPage: Page,
  previousValue: string | null,
): Promise<void> {
  await testPage.waitForFunction(
    (prev) => {
      const current = localStorage.getItem("last_sync");
      return current !== null && current !== prev;
    },
    previousValue,
    { timeout: SYNC_COMPLETE_TIMEOUT_MS },
  );
}

/**
 * Clicks the sync button to immediately push + pull, then waits for
 * last_sync to update in localStorage — confirming sync completion.
 */
async function triggerSyncAndWait(testPage: Page): Promise<void> {
  const previousSync = await testPage.evaluate(
    (key) => localStorage.getItem(key),
    LAST_SYNC_STORAGE_KEY,
  );
  // The sync button is rendered in both the open and collapsed panel states.
  // Use .first() in case both are present in DOM simultaneously.
  await testPage.getByTestId("right-panel-sync").first().click();
  await waitForLastSyncToUpdate(testPage, previousSync);
}

/**
 * Calls the pull Edge Function from Node.js to verify server-side state.
 * Uses since_revision=0 to receive the full dataset.
 */
async function pullFromServer(): Promise<{
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
    is_completed: boolean;
    repeat_rule: string;
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
    tasks: Array<{
      id: string;
      name: string;
      is_deleted: boolean;
      is_completed: boolean;
      repeat_rule: string;
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// 5.2.1 — Create task locally → push → verify task exists on server
// ---------------------------------------------------------------------------
test("create task locally → push → verify task exists on server", async () => {
  createdTaskName = `Sync Test Task ${Date.now()}`;

  // Add a task via the UI (creates in Today box by default)
  await page.getByTestId("add-task-button").click();
  await page.getByTestId("add-task-input").fill(createdTaskName);
  await page.getByTestId("add-task-input").press("Enter");

  // Trigger push + pull immediately instead of waiting for the 15-second debounce
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  expect(pullResponse.ok).toBe(true);

  const serverTask = pullResponse.tasks.find(
    (task) => task.name === createdTaskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();
  if (!serverTask) return;
  expect(serverTask.is_deleted).toBe(false);

  createdTaskId = serverTask.id;
});

// ---------------------------------------------------------------------------
// 5.2.2 — Modify task (title) locally → push → pull → verify changes
// Builds on 5.2.1: createdTaskName and createdTaskId are set.
// ---------------------------------------------------------------------------
test("modify task title locally → push → verify changes on server", async () => {
  const updatedName = `Updated Task ${Date.now()}`;

  // Click the task item body to open the detail panel (desktop: single click)
  await page
    .locator('[data-testid="task-item"]')
    .filter({
      has: page.locator('[data-testid="task-item-name"]', {
        hasText: createdTaskName,
      }),
    })
    .locator('[data-testid="task-item-body"]')
    .click();

  await page.waitForSelector('[data-testid="task-detail-panel"]');

  // Clear and type the new name
  await page.getByTestId("task-detail-name").fill(updatedName);
  // Blur to commit the change (name is saved on blur)
  await page.getByTestId("task-detail-name").blur();

  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  const serverTask = pullResponse.tasks.find(
    (task) => task.id === createdTaskId,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.name).toBe(updatedName);
  expect(serverTask?.is_deleted).toBe(false);

  // Carry the updated name so 5.2.3 can reference it if needed
  createdTaskName = updatedName;
});

// ---------------------------------------------------------------------------
// 5.2.3 — Soft-delete task locally → push → pull → verify is_deleted=true
// Builds on 5.2.2: task detail panel is open with the updated task.
// ---------------------------------------------------------------------------
test("soft-delete task locally → push → verify is_deleted=true on server", async () => {
  // The task detail panel should still be open from 5.2.2.
  // Click the delete (trash) icon in the panel header.
  await page
    .getByTestId("task-detail-panel")
    .getByRole("button", { name: /delete task/i })
    .click();

  // A confirmation dialog always appears — confirm the deletion.
  await page.waitForSelector('[data-testid="task-detail-delete-confirm-btn"]');
  await page.getByTestId("task-detail-delete-confirm-btn").click();

  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  const serverTask = pullResponse.tasks.find(
    (task) => task.id === createdTaskId,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.is_deleted).toBe(true);
});

// ---------------------------------------------------------------------------
// 5.2.4 — Create recurring task → push → verify repeat_rule persisted
// Starts fresh: does not depend on the deleted task from 5.2.3.
// ---------------------------------------------------------------------------
test("create recurring task → push → verify repeat rule persisted", async () => {
  const recurringTaskName = `Recurring Task ${Date.now()}`;

  // Create a new task
  await page.getByTestId("add-task-button").click();
  await page.getByTestId("add-task-input").fill(recurringTaskName);
  await page.getByTestId("add-task-input").press("Enter");

  // Open the task detail panel
  await page
    .locator('[data-testid="task-item"]')
    .filter({
      has: page.locator('[data-testid="task-item-name"]', {
        hasText: recurringTaskName,
      }),
    })
    .locator('[data-testid="task-item-body"]')
    .click();

  await page.waitForSelector('[data-testid="task-detail-panel"]');

  // Open the Repeat selector — the DrillDownRow button contains label "Repeat"
  await page
    .getByTestId("task-detail-panel")
    .getByRole("button", { name: /Repeat/ })
    .click();

  // Select "Fixed" repeat type — wait for it to appear first
  await page.getByTestId("repeat-type-fixed").waitFor({ state: "visible" });
  await page.getByTestId("repeat-type-fixed").click();

  // Choose daily frequency — wait for frequency options to render
  await page
    .getByTestId("repeat-frequency-daily")
    .waitFor({ state: "visible" });
  await page.getByTestId("repeat-frequency-daily").click();

  // Proceed to placement step
  await page.getByTestId("repeat-fixed-next").waitFor({ state: "visible" });
  await page.getByTestId("repeat-fixed-next").click();

  // Apply the repeat rule (saves and closes selector)
  await page.getByTestId("repeat-apply").waitFor({ state: "visible" });
  await page.getByTestId("repeat-apply").click();

  // Wait for the repeat selector to close — indicates save completed
  await page.getByTestId("repeat-apply").waitFor({ state: "hidden" });

  // Trigger sync to push the recurring task to the server
  await triggerSyncAndWait(page);

  const pullResponse = await pullFromServer();
  const serverTask = pullResponse.tasks.find(
    (task) => task.name === recurringTaskName && !task.is_deleted,
  );
  expect(serverTask).toBeDefined();
  expect(serverTask?.repeat_rule).not.toBe("");
});
