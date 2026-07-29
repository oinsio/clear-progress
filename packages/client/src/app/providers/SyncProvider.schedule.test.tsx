import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS, SYNC_DEBOUNCE_MS } from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");

import { mockSettingsGetValue } from "@/test/helpers/mockRepositories";
import "@/test/helpers/mockRepositories";

import {
  renderSchedulerReady,
  renderSchedulerSettled,
  setupBeforeEach,
} from "./SyncProvider.test-helpers";
import { mockPull, mockPush } from "./SyncProvider.test-mocks";

/**
 * Makes the shared, mocked SettingsRepository resolve `value` for
 * STORAGE_KEYS.AUTO_SYNC_DELAY specifically, and `undefined` (→ default) for
 * every other key — mirrors how the real repository is keyed by setting key.
 */
function mockAutoSyncDelaySetting(value: string | undefined): void {
  mockSettingsGetValue.mockImplementation(async (key: string) =>
    key === STORAGE_KEYS.AUTO_SYNC_DELAY ? value : undefined,
  );
}

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

describe("SyncProvider — schedulePush", () => {
  it("should not call push immediately when schedulePush is triggered", async () => {
    await renderSchedulerReady();
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should call push and pull after SYNC_DEBOUNCE_MS when schedulePush is triggered", async () => {
    await renderSchedulerReady();
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should call push before pull when schedulePush fires", async () => {
    await renderSchedulerSettled();
    const callOrder: string[] = [];
    mockPush.mockImplementation(async () => {
      callOrder.push("push");
    });
    mockPull.mockImplementation(async () => {
      callOrder.push("pull");
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS);
    });
    expect(callOrder).toEqual(["push", "pull"]);
  });

  it("should reset debounce timer when schedulePush is called multiple times", async () => {
    await renderSchedulerReady();
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS - 1000);
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    expect(mockPush).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("should clear debounce timer on unmount without triggering push", async () => {
    const { unmount } = await renderSchedulerReady();
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// implements FR4, D3, NFR-P1 of configurable-sync-timing
describe("SyncProvider — schedulePush uses configurable auto_sync_delay", () => {
  it("should still wait SYNC_DEBOUNCE_MS (default 15s) when auto_sync_delay is absent", async () => {
    mockAutoSyncDelaySetting(undefined);
    await renderSchedulerReady();
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS - 1);
    });
    expect(mockPush).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should wait the configured auto_sync_delay (30s) instead of the default 15s", async () => {
    mockAutoSyncDelaySetting("30");
    await renderSchedulerReady();
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    // Should NOT have fired yet at the old default (15s).
    await act(async () => {
      vi.advanceTimersByTime(SYNC_DEBOUNCE_MS);
    });
    expect(mockPush).not.toHaveBeenCalled();
    // Fires once the configured 30s delay elapses.
    const configuredDelayMs = 30 * 1000;
    await act(async () => {
      vi.advanceTimersByTime(configuredDelayMs - SYNC_DEBOUNCE_MS);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["0"],
    [""],
  ])("should trigger an immediate sync (0ms) when auto_sync_delay is %j", async (delayValue) => {
    mockAutoSyncDelaySetting(delayValue);
    await renderSchedulerReady();
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should use the latest configured delay when schedulePush fires after mount settles", async () => {
    // Regression guard for D3: delayMsRef must reflect the value read at
    // provider init, not a stale closure captured before the async settle.
    mockAutoSyncDelaySetting("5");
    await renderSchedulerReady();
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    await act(async () => {
      vi.advanceTimersByTime(5 * 1000 - 1);
    });
    expect(mockPush).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("should result in exactly ONE sync cycle from a single schedulePush call regardless of configured delay", async () => {
    // Verifies NFR-P1 of configurable-sync-timing
    mockAutoSyncDelaySetting("1");
    await renderSchedulerReady();
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    await act(async () => {
      vi.advanceTimersByTime(60 * 1000);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });
});
