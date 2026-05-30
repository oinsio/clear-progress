// implements FR6 of add-supabase-integration-tests
// Shared helpers for integration tests that use the pre-authenticated storageState.
import { type Browser, type Page, test } from "@playwright/test";
import { AUTH_STATE_PATH, readTestConfig } from "./config.js";

const SYNC_COMPLETE_TIMEOUT_MS = 15_000;
const AUTO_SYNC_TIMEOUT_MS = 12_000;
const MANUAL_SYNC_TIMEOUT_MS = 5_000;
const SYNC_SETTLE_MS = 300;
const LAST_SYNC_STORAGE_KEY = "last_sync";
const SYNC_MAX_RETRIES = 3;
const SYNC_RETRY_SETTLE_MS = 1_000;
const SYNC_CLICK_RETRY_MS = 8_000;
const SYNC_IDLE_TIMEOUT_MS = 8_000;

export interface AuthenticatedContext {
  page: Page;
  accessToken: string;
  supabaseUrl: string;
  anonKey: string;
}

/**
 * Closes the browser context (and its pages) to prevent resource leaks.
 * Use in afterAll instead of page.close() to properly release all resources.
 */
export async function closeAuthenticatedPage(
  page: Page | undefined,
): Promise<void> {
  if (!page) return;
  try {
    await page.context().close();
  } catch {
    // Context might already be closed
  }
}

/**
 * Creates a browser context pre-loaded with auth state from the shared setup,
 * navigates to /tasks, and waits for the initial auto-sync to complete.
 * This ensures the sync engine is idle before tests begin.
 */
export async function createAuthenticatedPage(
  browser: Browser,
): Promise<AuthenticatedContext> {
  const config = readTestConfig();
  const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
  const page = await context.newPage();

  await page.goto("/tasks");

  // Read last_sync immediately after navigation — before React initializes sync
  const storedLastSync = await page.evaluate(
    (key) => localStorage.getItem(key),
    LAST_SYNC_STORAGE_KEY,
  );

  await page.waitForSelector('[data-testid="active-tasks-page"]', {
    timeout: SYNC_COMPLETE_TIMEOUT_MS,
  });

  // Wait for auto-sync to complete (last_sync changes from storageState value).
  // This ensures the sync engine is initialized and idle before tests begin,
  // preventing mutex conflicts when tests trigger their own syncs.
  try {
    await page.waitForFunction(
      (prev) => {
        const current = localStorage.getItem("last_sync");
        return current !== null && current !== prev;
      },
      storedLastSync,
      { timeout: AUTO_SYNC_TIMEOUT_MS },
    );
  } catch {
    // Auto-sync didn't fire in time — force a manual sync.
    // Use a shorter timeout; if this also fails, proceed anyway —
    // individual tests will sync via triggerSyncAndWait.
    try {
      await page.getByTestId("sidebar-sync").first().click();
      await page.waitForFunction(
        (prev) => {
          const current = localStorage.getItem("last_sync");
          return current !== null && current !== prev;
        },
        storedLastSync,
        { timeout: MANUAL_SYNC_TIMEOUT_MS },
      );
    } catch {
      // Manual sync also timed out — Docker may be under load.
      // Proceed; tests will trigger their own syncs.
      console.warn(
        "[test-helpers] createAuthenticatedPage: initial sync timed out, proceeding without sync",
      );
    }
  }

  // Brief settle time to ensure the sync mutex is fully released
  await page.waitForTimeout(SYNC_SETTLE_MS);

  const accessToken = await page.evaluate(() => {
    // Supabase SDK stores session under sb-<hostname>-auth-token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sb-") && key.endsWith("-auth-token")) {
        try {
          const session = JSON.parse(localStorage.getItem(key) ?? "");
          if (session?.access_token) return session.access_token as string;
        } catch {
          // not valid JSON, skip
        }
      }
    }
    // Fallback: GAS backend stores token directly
    return localStorage.getItem("access_token") ?? "";
  });

  return {
    page,
    accessToken,
    supabaseUrl: config.supabaseUrl,
    anonKey: config.anonKey,
  };
}

/**
 * Attempts a sync by clicking the sync button until last_sync updates.
 * First waits for any in-flight sync (auto-sync from navigation) to complete,
 * then clicks to trigger a NEW sync that includes the latest local changes.
 *
 * Success is determined solely by last_sync changing in localStorage — this
 * means the full push→pull→persistLastSync cycle completed. If the click is
 * silently dropped by the app's isSyncingRef mutex, last_sync won't change
 * and we retry.
 */
async function waitForSyncButtonIdle(
  testPage: Page,
  timeoutMs: number,
): Promise<void> {
  try {
    await testPage.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="sidebar-sync"]');
        if (!button) return false;
        const icon = button.querySelector("svg");
        return icon !== null && !icon.classList.contains("animate-spin");
      },
      { timeout: timeoutMs },
    );
  } catch {
    // Button might not have the spinning icon; proceed anyway.
  }
}

async function attemptSync(
  testPage: Page,
  timeoutMs: number,
): Promise<{ succeeded: boolean; diagnostics: string }> {
  const deadline = Date.now() + timeoutMs;

  // Capture browser console errors for diagnostics
  const consoleErrors: string[] = [];
  const onConsole = (message: import("@playwright/test").ConsoleMessage) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleErrors.push(`[${message.type()}] ${message.text()}`);
    }
  };
  testPage.on("console", onConsole);

  const onPageError = (error: Error) => {
    consoleErrors.push(`[PAGE_ERROR] ${error.message}`);
  };
  testPage.on("pageerror", onPageError);

  let apiCallCount = 0;
  const apiFailures: string[] = [];

  const onResponse = (response: import("@playwright/test").Response) => {
    const url = response.url();
    if (url.includes("/functions/v1/") || url.includes("/storage/")) {
      apiCallCount++;
      if (!response.ok()) {
        apiFailures.push(`${response.status()} ${url}`);
      }
      // Capture response body for edge functions to detect ok:false
      if (url.includes("/functions/v1/")) {
        void response
          .text()
          .then((body) => {
            const shortUrl = url.split("/functions/v1/")[1]?.split("?")[0];
            consoleErrors.push(
              `[API:${shortUrl}] ${response.status()} ${body.slice(0, 200)}`,
            );
          })
          .catch(() => {});
      }
    }
  };

  testPage.on("response", onResponse);

  try {
    // 1. Wait for any in-flight auto-sync to fully finish (button stops spinning).
    //    This is more reliable than checking last_sync stability because sync can
    //    fail (last_sync never changes) but the button still stops spinning.
    await waitForSyncButtonIdle(
      testPage,
      Math.min(SYNC_IDLE_TIMEOUT_MS, deadline - Date.now()),
    );
    await testPage.waitForTimeout(SYNC_SETTLE_MS);

    // 2. Clear background intervals (ping interval, periodic sync) that can
    //    run applySyncResult concurrently with our click-triggered sync.
    //    performPing lacks isSyncingRef mutex, causing concurrent sync races.
    await testPage.evaluate(() => {
      const highestId = window.setTimeout(() => {}, 0);
      for (let i = 1; i <= highestId; i++) {
        window.clearInterval(i);
      }
    });
    await testPage.waitForTimeout(SYNC_SETTLE_MS);

    // 3. Read last_sync AFTER auto-sync finished — baseline for our click-triggered sync.
    const previousSync = await testPage.evaluate(
      (key) => localStorage.getItem(key),
      LAST_SYNC_STORAGE_KEY,
    );

    // 3. Click sync and wait for completion (retry clicks if mutex-blocked).
    while (Date.now() < deadline) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) break;

      try {
        await testPage.getByTestId("sidebar-sync").first().click();
      } catch {
        await testPage.waitForTimeout(SYNC_SETTLE_MS);
        continue;
      }

      // Wait for the button to go through syncing → idle/error cycle
      // First wait briefly for the spin to START
      try {
        await testPage.waitForFunction(
          () => {
            const button = document.querySelector(
              '[data-testid="sidebar-sync"]',
            );
            if (!button) return false;
            const icon = button.querySelector("svg");
            return icon?.classList.contains("animate-spin") ?? false;
          },
          { timeout: SYNC_SETTLE_MS * 2 },
        );
      } catch {
        // Click may have been mutex-blocked (no spin started). Retry after settle.
        await testPage.waitForTimeout(SYNC_SETTLE_MS);
        continue;
      }

      // Now wait for spin to STOP (sync completed, either success or failure)
      await waitForSyncButtonIdle(
        testPage,
        Math.min(SYNC_CLICK_RETRY_MS, remainingMs),
      );
      await testPage.waitForTimeout(SYNC_SETTLE_MS);

      // Check if last_sync changed — success indicator
      const currentSync = await testPage.evaluate(
        (key) => localStorage.getItem(key),
        LAST_SYNC_STORAGE_KEY,
      );

      if (currentSync !== null && currentSync !== previousSync) {
        return { succeeded: true, diagnostics: "" };
      }

      // Sync completed but last_sync didn't change — sync failed internally.
      // Brief settle before retry.
      await testPage.waitForTimeout(SYNC_SETTLE_MS);
    }

    const diag = [
      `API calls: ${apiCallCount}`,
      apiFailures.length > 0 ? `API failures: [${apiFailures.join("; ")}]` : "",
      consoleErrors.length > 0
        ? `Console: ${consoleErrors.slice(-3).join(" | ")}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");

    return { succeeded: false, diagnostics: diag };
  } finally {
    testPage.off("response", onResponse);
    testPage.off("console", onConsole);
    testPage.off("pageerror", onPageError);
  }
}

/**
 * Ensures the page is ready for sync. Checks if the sync button is accessible
 * and navigates to /tasks if needed. Also verifies auth token exists.
 */
async function ensureSyncReady(testPage: Page): Promise<void> {
  const syncButton = testPage.getByTestId("sidebar-sync").first();
  const isVisible = await syncButton.isVisible().catch(() => false);

  if (!isVisible) {
    await testPage.goto("/tasks");
    await testPage.waitForSelector('[data-testid="active-tasks-page"]', {
      timeout: SYNC_COMPLETE_TIMEOUT_MS,
    });
  }
}

/**
 * Navigates to /tasks and waits for the auto-sync from page load to complete.
 * Returns true if auto-sync completed (last_sync changed).
 */
async function reloadAndWaitForAutoSync(testPage: Page): Promise<boolean> {
  await testPage.goto("/tasks", { waitUntil: "load" });
  await testPage.waitForSelector('[data-testid="active-tasks-page"]', {
    timeout: SYNC_COMPLETE_TIMEOUT_MS,
  });

  const preReloadSync = await testPage.evaluate(
    (key) => localStorage.getItem(key),
    LAST_SYNC_STORAGE_KEY,
  );

  try {
    await testPage.waitForFunction(
      (prev) => {
        const current = localStorage.getItem("last_sync");
        return current !== null && current !== prev;
      },
      preReloadSync,
      { timeout: AUTO_SYNC_TIMEOUT_MS },
    );
    // Auto-sync completed — wait for settle
    await testPage.waitForTimeout(SYNC_RETRY_SETTLE_MS);
    return true;
  } catch {
    await testPage.waitForTimeout(SYNC_RETRY_SETTLE_MS);
    return false;
  }
}

/**
 * Triggers a sync by clicking the sync button, then waits for completion.
 * If sync times out, reloads the page to reset SyncProvider state and retries.
 * The page reload triggers a fresh auto-sync which often resolves race conditions
 * between concurrent cover syncs and the main sync cycle.
 */
/**
 * Credentials needed to call Supabase Edge Functions directly from Node.js.
 */
export interface ServerCallCredentials {
  accessToken: string;
  supabaseUrl: string;
  anonKey: string;
}

/**
 * Calls the pull Edge Function and returns the full dataset (since_revision=0).
 * Generic parameter T lets each test file narrow the response type.
 */
export async function pullFromServer<T = Record<string, unknown>>(
  credentials: ServerCallCredentials,
): Promise<T> {
  const response = await fetch(`${credentials.supabaseUrl}/functions/v1/pull`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      apikey: credentials.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ since_revision: 0 }),
  });
  if (!response.ok) {
    throw new Error(`pull failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as Promise<T>;
}

/**
 * Calls the get-cover Edge Function to retrieve cover data by hash.
 */
export async function getCoverFromServer(
  credentials: ServerCallCredentials,
  hashes: string[],
): Promise<{
  ok: boolean;
  covers: Array<{
    hash: string;
    mime_type?: string;
    data?: string;
    error?: string;
  }>;
}> {
  const response = await fetch(
    `${credentials.supabaseUrl}/functions/v1/get-cover`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        apikey: credentials.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hashes }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `get-cover failed: ${response.status} ${await response.text()}`,
    );
  }
  return (await response.json()) as Promise<{
    ok: boolean;
    covers: Array<{
      hash: string;
      mime_type?: string;
      data?: string;
      error?: string;
    }>;
  }>;
}

/**
 * Returns a minimal 1x1 pixel PNG buffer (67 bytes) for cover upload tests.
 */
export function createMinimalPng(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64",
  );
}

/**
 * Registers serial mode, beforeAll (create authenticated page + credentials),
 * and afterAll (close page). Returns getters for page and credentials —
 * call them inside tests, after beforeAll has run.
 */
export function setupSingleDeviceTest() {
  let page: Page;
  let credentials: ServerCallCredentials;

  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser: b }) => {
    const auth = await createAuthenticatedPage(b);
    page = auth.page;
    credentials = {
      accessToken: auth.accessToken,
      supabaseUrl: auth.supabaseUrl,
      anonKey: auth.anonKey,
    };
  });

  test.afterAll(async () => {
    await closeAuthenticatedPage(page);
  });

  return { getPage: () => page, getCredentials: () => credentials };
}

/**
 * Like setupSingleDeviceTest but creates two authenticated pages (A and B).
 * Use for multi-device conflict / dirty-protection / recurring tests.
 */
export function setupTwoDeviceTest() {
  let pageA: Page;
  let pageB: Page;
  let credentials: ServerCallCredentials;

  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser: b }) => {
    const authA = await createAuthenticatedPage(b);
    pageA = authA.page;
    credentials = {
      accessToken: authA.accessToken,
      supabaseUrl: authA.supabaseUrl,
      anonKey: authA.anonKey,
    };

    const authB = await createAuthenticatedPage(b);
    pageB = authB.page;
  });

  test.afterAll(async () => {
    await closeAuthenticatedPage(pageA);
    await closeAuthenticatedPage(pageB);
  });

  return {
    getPageA: () => pageA,
    getPageB: () => pageB,
    getCredentials: () => credentials,
  };
}

export async function triggerSyncAndWait(testPage: Page): Promise<void> {
  let lastDiagnostics = "";

  for (let attempt = 1; attempt <= SYNC_MAX_RETRIES; attempt++) {
    await ensureSyncReady(testPage);
    const result = await attemptSync(testPage, SYNC_COMPLETE_TIMEOUT_MS);
    if (result.succeeded) return;
    lastDiagnostics = result.diagnostics;

    if (attempt < SYNC_MAX_RETRIES) {
      // Page reload resets SyncProvider state (isSyncingRef, syncStatus).
      // The fresh page triggers auto-sync which may push pending changes.
      const autoSynced = await reloadAndWaitForAutoSync(testPage);
      if (autoSynced) {
      }
    }
  }

  throw new Error(
    `triggerSyncAndWait: sync failed after ${SYNC_MAX_RETRIES} attempts. ${lastDiagnostics}`,
  );
}
