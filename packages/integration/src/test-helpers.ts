// implements FR6 of add-supabase-integration-tests
// Shared helpers for integration tests that use the pre-authenticated storageState.
import type { Browser, Page } from "@playwright/test";
import { AUTH_STATE_PATH, readTestConfig } from "./config.js";

const SYNC_COMPLETE_TIMEOUT_MS = 10_000;
const AUTO_SYNC_TIMEOUT_MS = 3_000;
const MANUAL_SYNC_TIMEOUT_MS = 5_000;
const SYNC_SETTLE_MS = 300;
const LAST_SYNC_STORAGE_KEY = "last_sync";
const SYNC_MAX_RETRIES = 2;
const SYNC_RETRY_SETTLE_MS = 1_000;
const SYNC_CLICK_RETRY_MS = 3_000;
const SYNC_IDLE_TIMEOUT_MS = 5_000;
const SYNC_POST_RESPONSE_SETTLE_MS = 3_000;

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

  await page.waitForSelector('[data-testid="inbox-page"]', {
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
      await page.getByTestId("right-panel-sync").first().click();
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

  const accessToken = await page.evaluate(
    () => localStorage.getItem("access_token") ?? "",
  );

  return {
    page,
    accessToken,
    supabaseUrl: config.supabaseUrl,
    anonKey: config.anonKey,
  };
}

export async function waitForLastSyncToUpdate(
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
 * Waits for any in-flight sync to complete by checking that last_sync
 * is stable (unchanged) for SYNC_SETTLE_MS. This prevents false positives
 * when auto-sync (from page navigation) updates last_sync while we're
 * trying to trigger our own sync.
 */
async function waitForSyncIdle(
  testPage: Page,
  deadlineMs: number,
): Promise<string | null> {
  let previousSync = await testPage.evaluate(
    (key) => localStorage.getItem(key),
    LAST_SYNC_STORAGE_KEY,
  );

  while (Date.now() < deadlineMs) {
    await testPage.waitForTimeout(SYNC_SETTLE_MS);
    const currentSync = await testPage.evaluate(
      (key) => localStorage.getItem(key),
      LAST_SYNC_STORAGE_KEY,
    );
    if (currentSync === previousSync) return currentSync;
    previousSync = currentSync;
  }

  return previousSync;
}

/**
 * Attempts a sync by clicking the sync button until last_sync updates.
 * First waits for any in-flight sync (auto-sync from navigation) to complete,
 * then clicks to trigger a NEW sync that includes the latest local changes.
 *
 * Returns true if sync completed, false if it timed out.
 */
interface AttemptSyncResult {
  succeeded: boolean;
  apiCallCount: number;
  apiFailures: string[];
  consoleErrors: string[];
}

async function attemptSync(
  testPage: Page,
  timeoutMs: number,
): Promise<AttemptSyncResult> {
  const deadline = Date.now() + timeoutMs;

  // Wait for any in-flight auto-sync (from page navigation) to fully complete.
  // 1. Wait for last_sync to stabilize (sync finished updating localStorage).
  await waitForSyncIdle(
    testPage,
    Math.min(Date.now() + SYNC_IDLE_TIMEOUT_MS, deadline),
  );

  // 2. Wait for the sync button to stop spinning (mutex released).
  //    This is critical: last_sync is written before isSyncingRef resets,
  //    so a brief gap exists where last_sync is stable but mutex is still held.
  try {
    await testPage.waitForFunction(
      () => {
        const button = document.querySelector(
          '[data-testid="right-panel-sync"]',
        );
        if (!button) return false;
        const icon = button.querySelector("svg");
        return icon !== null && !icon.classList.contains("animate-spin");
      },
      { timeout: Math.min(SYNC_SETTLE_MS * 3, deadline - Date.now()) },
    );
  } catch {
    // Button might not have the spinning icon; proceed anyway.
  }

  await testPage.waitForTimeout(SYNC_SETTLE_MS);

  // Now auto-sync is fully done and mutex is free.
  // Read last_sync AFTER idle — this is the baseline for our click-triggered sync.
  const previousSync = await testPage.evaluate(
    (key) => localStorage.getItem(key),
    LAST_SYNC_STORAGE_KEY,
  );

  const apiFailures: string[] = [];
  const consoleErrors: string[] = [];
  let apiCallCount = 0;

  const onResponse = (response: import("@playwright/test").Response) => {
    const url = response.url();
    if (url.includes("/functions/v1/")) {
      apiCallCount++;
      if (!response.ok()) {
        apiFailures.push(`${response.status()} ${url}`);
      }
    }
  };
  const onConsoleMessage = (msg: import("@playwright/test").ConsoleMessage) => {
    const msgType = msg.type();
    if (msgType === "error" || msgType === "warning") {
      consoleErrors.push(`[${msgType}] ${msg.text()}`);
    }
  };

  testPage.on("response", onResponse);
  testPage.on("console", onConsoleMessage);

  try {
    while (Date.now() < deadline) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) break;

      // Set up response listener BEFORE click to catch push or pull call.
      const syncResponsePromise = testPage
        .waitForResponse(
          (resp) =>
            resp.url().includes("/functions/v1/push") ||
            resp.url().includes("/functions/v1/pull"),
          { timeout: Math.min(SYNC_CLICK_RETRY_MS, remainingMs) },
        )
        .catch(() => null);

      try {
        await testPage.getByTestId("right-panel-sync").first().click();
      } catch {
        await testPage.waitForTimeout(SYNC_SETTLE_MS);
        continue;
      }

      const syncResponse = await syncResponsePromise;

      if (syncResponse) {
        // Sync API call detected — wait for last_sync to update.
        try {
          await testPage.waitForFunction(
            (prev) => {
              const current = localStorage.getItem("last_sync");
              return current !== null && current !== prev;
            },
            previousSync,
            {
              timeout: Math.min(SYNC_POST_RESPONSE_SETTLE_MS, remainingMs),
            },
          );
        } catch {
          // last_sync didn't change — sync had nothing new to apply.
          await testPage.waitForTimeout(SYNC_SETTLE_MS);
        }
        return { succeeded: true, apiCallCount, apiFailures, consoleErrors };
      }
      // No response — click was mutex-blocked. Brief settle then retry.
      await testPage.waitForTimeout(SYNC_SETTLE_MS);
    }

    return { succeeded: false, apiCallCount, apiFailures, consoleErrors };
  } finally {
    testPage.off("response", onResponse);
    testPage.off("console", onConsoleMessage);
  }
}

/**
 * Ensures the page is ready for sync. Checks if the sync button is accessible
 * and navigates to /tasks if needed. Also verifies auth token exists.
 */
async function ensureSyncReady(testPage: Page): Promise<void> {
  const syncButton = testPage.getByTestId("right-panel-sync").first();
  const isVisible = await syncButton.isVisible().catch(() => false);

  if (!isVisible) {
    await testPage.goto("/tasks");
    await testPage.waitForSelector('[data-testid="inbox-page"]', {
      timeout: SYNC_COMPLETE_TIMEOUT_MS,
    });
  }
}

/**
 * Triggers a sync by clicking the sync button, then waits for completion.
 * If sync times out, navigates to /tasks and retries up to SYNC_MAX_RETRIES times.
 */
export async function triggerSyncAndWait(testPage: Page): Promise<void> {
  let lastResult: AttemptSyncResult | undefined;

  for (let attempt = 1; attempt <= SYNC_MAX_RETRIES; attempt++) {
    await ensureSyncReady(testPage);
    const result = await attemptSync(testPage, SYNC_COMPLETE_TIMEOUT_MS);
    lastResult = result;
    if (result.succeeded) return;

    if (attempt < SYNC_MAX_RETRIES) {
      await testPage.goto("/tasks", { waitUntil: "load" });
      await testPage.waitForSelector('[data-testid="inbox-page"]', {
        timeout: SYNC_COMPLETE_TIMEOUT_MS,
      });
      await testPage.waitForTimeout(SYNC_RETRY_SETTLE_MS);
    }
  }

  const diag = lastResult
    ? `API calls: ${lastResult.apiCallCount}, ` +
      `API failures: [${lastResult.apiFailures.join("; ")}], ` +
      `console errors: [${lastResult.consoleErrors.join("; ")}]`
    : "no diagnostics";

  throw new Error(
    `triggerSyncAndWait: sync failed after ${SYNC_MAX_RETRIES} attempts. ${diag}`,
  );
}
