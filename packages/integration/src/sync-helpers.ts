import type { Page } from "@playwright/test";

const SYNC_COMPLETE_TIMEOUT_MS = 15_000;
export const AUTO_SYNC_TIMEOUT_MS = 12_000;
export const MANUAL_SYNC_TIMEOUT_MS = 5_000;
export const SYNC_SETTLE_MS = 300;
export const LAST_SYNC_STORAGE_KEY = "last_sync";
const SYNC_MAX_RETRIES = 3;
const SYNC_RETRY_SETTLE_MS = 1_000;
const SYNC_CLICK_RETRY_MS = 8_000;
const SYNC_IDLE_TIMEOUT_MS = 8_000;

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

    // 4. Click sync and wait for completion (retry clicks if mutex-blocked).
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
 * and navigates to /tasks if needed.
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
 * Attempts a sync by clicking the sync button until last_sync updates.
 * First waits for any in-flight sync (auto-sync from navigation) to complete,
 * then clicks to trigger a NEW sync that includes the latest local changes.
 *
 * Success is determined solely by last_sync changing in localStorage — this
 * means the full push→pull→persistLastSync cycle completed. If the click is
 * silently dropped by the app's isSyncingRef mutex, last_sync won't change
 * and we retry.
 */
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
      await reloadAndWaitForAutoSync(testPage);
    }
  }

  throw new Error(
    `triggerSyncAndWait: sync failed after ${SYNC_MAX_RETRIES} attempts. ${lastDiagnostics}`,
  );
}
