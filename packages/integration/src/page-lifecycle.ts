import type { Browser, Page } from "@playwright/test";
import { AUTH_STATE_PATH, readTestConfig } from "./config.js";
import {
  AUTO_SYNC_TIMEOUT_MS,
  LAST_SYNC_STORAGE_KEY,
  MANUAL_SYNC_TIMEOUT_MS,
  SYNC_SETTLE_MS,
} from "./sync-helpers.js";

const SYNC_COMPLETE_TIMEOUT_MS = 15_000;

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
 * Creates a browser context preloaded with auth state from the shared setup,
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
    // Fallback: read token from localStorage directly
    return localStorage.getItem("access_token") ?? "";
  });

  return {
    page,
    accessToken,
    supabaseUrl: config.supabaseUrl,
    anonKey: config.anonKey,
  };
}
