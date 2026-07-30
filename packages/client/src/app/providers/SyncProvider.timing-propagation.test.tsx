// implements FR3, G2, U4, D7 of configurable-sync-timing
// RED (task 6.1): SyncProvider must re-read sync_interval on the "sync_complete"
// event (fired by SyncService.pull() after every pull) and recreate the periodic
// interval with the new value — covers timing values that arrive via PULL.
import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS, SYNC_TIMING_CHANGED_EVENT } from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");

import { mockSettingsGetValue } from "@/test/helpers/mockRepositories";
import "@/test/helpers/mockRepositories";

import {
  clickScheduleButton,
  renderProvider,
  renderProviderWithScheduler,
  resetSyncMocks,
  setupBeforeEach,
} from "./SyncProvider.test-helpers";
import { mockPull, mockPush } from "./SyncProvider.test-mocks";

const ONE_MINUTE_MS = 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const FIVE_SECONDS_MS = 5 * 1000;

/**
 * Makes the shared, mocked SettingsRepository resolve `value` for the given
 * storage key specifically, and `undefined` (→ default) for every other key
 * — mirrors the per-key helpers in SyncProvider.periodic-interval.test.tsx
 * and SyncProvider.schedule.test.tsx.
 */
function mockStorageSetting(key: string, value: string | undefined): void {
  mockSettingsGetValue.mockImplementation(async (settingKey: string) =>
    settingKey === key ? value : undefined,
  );
}

function mockSyncIntervalSetting(value: string | undefined): void {
  mockStorageSetting(STORAGE_KEYS.SYNC_INTERVAL, value);
}

function mockAutoSyncDelaySetting(value: string | undefined): void {
  mockStorageSetting(STORAGE_KEYS.AUTO_SYNC_DELAY, value);
}

function dispatchSyncComplete(): void {
  window.dispatchEvent(new CustomEvent("sync_complete"));
}

function dispatchSyncTimingChanged(): void {
  window.dispatchEvent(new CustomEvent(SYNC_TIMING_CHANGED_EVENT));
}

/**
 * Renders the provider with an initial 30s auto_sync_delay, then delivers a
 * new 5s delay via sync_complete — the shared arrange for both "stale delay
 * gone" assertions below.
 */
async function renderWithDelayChangedViaSyncComplete(): Promise<void> {
  mockAutoSyncDelaySetting("30");
  renderProviderWithScheduler();
  await act(async () => {});
  resetSyncMocks();

  mockAutoSyncDelaySetting("5");
  await act(async () => {
    dispatchSyncComplete();
  });
  resetSyncMocks();
}

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

describe("SyncProvider — re-reads sync_interval on sync_complete (pull-driven propagation, D7)", () => {
  it("should recreate the periodic interval with the value pulled after sync_complete fires", async () => {
    // Verifies FR3, G2, U4, D7: a value delivered via PULL must take effect
    // without a page reload.
    mockSyncIntervalSetting("1");
    renderProvider();
    await act(async () => {});
    resetSyncMocks();

    // Simulate the pulled settings row now reporting a new sync_interval (2min)
    // and the "sync_complete" event SyncService.pull() dispatches after every pull.
    mockSyncIntervalSetting("2");
    await act(async () => {
      dispatchSyncComplete();
    });
    resetSyncMocks();

    // The stale 1-minute cadence must NOT fire anymore.
    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });
    expect(mockPush).not.toHaveBeenCalled();

    // The new 2-minute cadence fires once the remaining minute elapses.
    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should stop the periodic interval after sync_complete delivers a disabled (empty) sync_interval", async () => {
    // Verifies FR3, D7: a pulled disable value (empty string) must stop the
    // periodic timer without a page reload.
    mockSyncIntervalSetting("1");
    renderProvider();
    await act(async () => {});
    resetSyncMocks();

    mockSyncIntervalSetting("");
    await act(async () => {
      dispatchSyncComplete();
    });
    resetSyncMocks();

    await act(async () => {
      vi.advanceTimersByTime(TWENTY_FOUR_HOURS_MS);
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPull).not.toHaveBeenCalled();
  });

  it("should remove the sync_complete listener on unmount", async () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    mockSyncIntervalSetting("1");
    const { unmount } = renderProvider();
    await act(async () => {});

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "sync_complete",
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });

  it("should NOT react to sync_complete dispatched after unmount", async () => {
    mockSyncIntervalSetting("1");
    const { unmount } = renderProvider();
    await act(async () => {});
    unmount();
    resetSyncMocks();

    mockSyncIntervalSetting("2");
    await act(async () => {
      dispatchSyncComplete();
    });

    await act(async () => {
      vi.advanceTimersByTime(TWENTY_FOUR_HOURS_MS);
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPull).not.toHaveBeenCalled();
  });
});

// implements FR4, D7 of configurable-sync-timing
// RED (task 6.2): SyncProvider must re-read auto_sync_delay both on "sync_complete"
// (PULL-driven, since a pulled settings row can carry the value) and on
// SYNC_TIMING_CHANGED_EVENT (LOCAL-WRITE-driven, dispatched by useSettings setters)
// so that the NEXT schedulePush() call uses the new debounce delay.
describe("SyncProvider — auto_sync_delay propagation", () => {
  it("should use the delay pulled after sync_complete fires for the next schedulePush", async () => {
    // Verifies FR4, D7: a value delivered via PULL must take effect without reload.
    await renderWithDelayChangedViaSyncComplete();

    await act(async () => {
      clickScheduleButton();
    });

    // The stale 30s delay must NOT still be in effect.
    await act(async () => {
      vi.advanceTimersByTime(FIVE_SECONDS_MS);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should NOT fire at the stale 30s delay after sync_complete delivers a new 5s delay", async () => {
    await renderWithDelayChangedViaSyncComplete();

    await act(async () => {
      clickScheduleButton();
    });

    // A push before the new 5s delay elapses would prove the stale 30s cadence
    // is gone too early — instead assert nothing fires before 5s, then it does.
    await act(async () => {
      vi.advanceTimersByTime(FIVE_SECONDS_MS - 1);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should use the delay changed via SYNC_TIMING_CHANGED_EVENT for the next schedulePush", async () => {
    // Verifies FR4, D7: a value delivered via a LOCAL WRITE (useSettings setter)
    // must take effect without reload.
    mockAutoSyncDelaySetting("30");
    renderProviderWithScheduler();
    await act(async () => {});
    resetSyncMocks();

    mockAutoSyncDelaySetting("5");
    await act(async () => {
      dispatchSyncTimingChanged();
    });
    resetSyncMocks();

    await act(async () => {
      clickScheduleButton();
    });

    // The stale 30s cadence must not still govern the debounce — the new 5s
    // delay must be in effect for this schedulePush call.
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

  it("should fire schedulePush essentially immediately when SYNC_TIMING_CHANGED_EVENT delivers a 0/empty delay", async () => {
    // Verifies FR4, D7: an immediate (disabled debounce) value delivered via a
    // local write must take effect for the next schedulePush.
    mockAutoSyncDelaySetting("30");
    renderProviderWithScheduler();
    await act(async () => {});
    resetSyncMocks();

    mockAutoSyncDelaySetting("0");
    await act(async () => {
      dispatchSyncTimingChanged();
    });
    resetSyncMocks();

    await act(async () => {
      clickScheduleButton();
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should remove the SYNC_TIMING_CHANGED_EVENT listener on unmount", async () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    mockAutoSyncDelaySetting("30");
    const { unmount } = renderProviderWithScheduler();
    await act(async () => {});

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      SYNC_TIMING_CHANGED_EVENT,
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });

  it("should NOT react to SYNC_TIMING_CHANGED_EVENT dispatched after unmount", async () => {
    mockAutoSyncDelaySetting("30");
    const { unmount } = renderProviderWithScheduler();
    await act(async () => {});
    unmount();
    resetSyncMocks();

    mockAutoSyncDelaySetting("5");
    await act(async () => {
      dispatchSyncTimingChanged();
    });

    await act(async () => {
      vi.advanceTimersByTime(TWENTY_FOUR_HOURS_MS);
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPull).not.toHaveBeenCalled();
  });
});
