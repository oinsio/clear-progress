// implements FR6, D7 of configurable-sync-timing
// RED: SyncProvider must read the localStorage cache SYNCHRONOUSLY at start-up
// so the sync timers use the correct debounce delay and periodic interval
// BEFORE the asynchronous IndexedDB (SettingsService) read finishes. These
// tests keep the IndexedDB read pending forever, so only the synchronous
// start-up cache can supply the value.
import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");

import { mockSettingsGetValue } from "@/test/helpers/mockRepositories";
import "@/test/helpers/mockRepositories";

import {
  clickScheduleButton,
  renderProvider,
  renderSchedulerReady,
  resetSyncMocks,
  setupBeforeEach,
} from "./SyncProvider.test-helpers";
import { mockPull, mockPush } from "./SyncProvider.test-mocks";

const ONE_MINUTE_MS = 60 * 1000;
const FIVE_SECONDS_MS = 5 * 1000;

/**
 * Makes the shared, mocked SettingsRepository hang forever, so the async
 * start-up read in useSyncTiming never completes and cannot overwrite the
 * synchronous localStorage-cache initialisation under test.
 */
function makeIndexedDbReadHang(): void {
  mockSettingsGetValue.mockReturnValue(new Promise<never>(() => {}));
}

beforeEach(() => setupBeforeEach());
afterEach(() => {
  localStorage.removeItem(STORAGE_KEYS.SYNC_INTERVAL);
  localStorage.removeItem(STORAGE_KEYS.AUTO_SYNC_DELAY);
  vi.useRealTimers();
});

describe("SyncProvider — reads localStorage timing cache synchronously at start-up (FR6, D7)", () => {
  it("should debounce schedulePush by the cached auto_sync_delay before IndexedDB resolves", async () => {
    // Cache says 5s; the default constant is 15s, so a push at exactly 5s
    // proves the synchronous cache — not the constant — governs the debounce.
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_DELAY, "5");
    makeIndexedDbReadHang();
    // renderSchedulerReady renders, lets the ping/init startup sequence
    // settle, then clears the push/pull it triggers so the counts below
    // reflect only the debounced schedulePush.
    await renderSchedulerReady();

    await act(async () => {
      clickScheduleButton();
    });

    await act(async () => {
      vi.advanceTimersByTime(FIVE_SECONDS_MS - 1);
    });
    expect(mockPush).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should drive the periodic interval by the cached sync_interval before IndexedDB resolves", async () => {
    // Cache says 1 minute; the default constant is 5 minutes, so a sync after
    // 1 minute proves the synchronous cache governs the periodic interval.
    localStorage.setItem(STORAGE_KEYS.SYNC_INTERVAL, "1");
    makeIndexedDbReadHang();
    renderProvider();
    // Let the ping/init startup sequence settle, then clear the push/pull it
    // triggers so the counts below reflect only the periodic interval.
    await act(async () => {});
    resetSyncMocks();

    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });
});
