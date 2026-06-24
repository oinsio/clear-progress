import type { Page } from "@playwright/test";
import { test } from "@playwright/test";
import {
  closeAuthenticatedPage,
  createAuthenticatedPage,
} from "./page-lifecycle.js";
import type { ServerCallCredentials } from "./server-api.js";

/**
 * Returns a minimal 1x1 pixel PNG buffer with a unique suffix appended after
 * the IEND chunk. Each call produces a different SHA-256 hash, preventing
 * cross-test file hash collisions on the shared server. Within a test, reuse
 * the same buffer for "same hash" scenarios.
 */
let pngSequence = 0;
export function createMinimalPng(): Buffer {
  const base = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64",
  );
  const suffix = Buffer.alloc(8);
  const now = Date.now();
  suffix.writeUInt32BE(Math.floor(now / 0x100000000) >>> 0, 0);
  suffix.writeUInt32BE((now >>> 0) + pngSequence++, 4);
  return Buffer.concat([base, suffix]);
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
