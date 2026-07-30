// implements FR3, D4, NFR-P1 of configurable-sync-timing
import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS, SYNC_INTERVAL_MS } from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");

import { useAuth } from "@/app/providers/AuthProvider";
import { mockSettingsGetValue } from "@/test/helpers/mockRepositories";
import "@/test/helpers/mockRepositories";

import { renderProvider, setupBeforeEach } from "./SyncProvider.test-helpers";
import { mockPull, mockPush } from "./SyncProvider.test-mocks";

const ONE_MINUTE_MS = 60 * 1000;

/**
 * Makes the shared, mocked SettingsRepository resolve `value` for
 * STORAGE_KEYS.SYNC_INTERVAL specifically, and `undefined` (→ default) for
 * every other key — mirrors the AUTO_SYNC_DELAY helper pattern used in
 * SyncProvider.schedule.test.tsx.
 */
function mockSyncIntervalSetting(value: string | undefined): void {
  mockSettingsGetValue.mockImplementation(async (key: string) =>
    key === STORAGE_KEYS.SYNC_INTERVAL ? value : undefined,
  );
}

/**
 * Renders the provider, flushes the mount-time sync, then resets mocks so
 * each test's assertions only see periodic-timer activity.
 */
async function renderProviderAndResetMocks(): Promise<
  ReturnType<typeof renderProvider>
> {
  const rendered = renderProvider();
  await act(async () => {});
  vi.clearAllMocks();
  mockPush.mockResolvedValue(undefined);
  mockPull.mockResolvedValue(undefined);
  return rendered;
}

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

describe("SyncProvider — periodic interval uses configurable sync_interval", () => {
  it("should still fire a periodic sync after SYNC_INTERVAL_MS (default 5min) when sync_interval is absent", async () => {
    // Verifies M1: default behavior is preserved when no setting is stored.
    mockSyncIntervalSetting(undefined);
    await renderProviderAndResetMocks();

    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should fire a periodic sync after the configured sync_interval (1 minute) instead of the default", async () => {
    mockSyncIntervalSetting("1");
    await renderProviderAndResetMocks();

    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPull).toHaveBeenCalledTimes(1);
  });

  it("should NOT fire a periodic sync before the configured 1-minute interval elapses", async () => {
    mockSyncIntervalSetting("1");
    await renderProviderAndResetMocks();

    await act(async () => {
      vi.advanceTimersByTime(30 * 1000);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should never create no periodic sync when sync_interval is disabled (empty string)", async () => {
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    mockSyncIntervalSetting("");
    renderProvider();
    await act(async () => {});
    // The mount-time sync (T1) still fires once — only the periodic timer is disabled.
    expect(mockPush).toHaveBeenCalledTimes(1);
    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
    mockPull.mockResolvedValue(undefined);
    // (mount already flushed above; the shared helper would flush a second,
    // unwanted mount, so this test resets mocks inline instead.)

    await act(async () => {
      vi.advanceTimersByTime(TWENTY_FOUR_HOURS_MS);
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPull).not.toHaveBeenCalled();
  });

  it("should pick up a newly configured interval value on a fresh mount (regression guard for D4 recreation)", async () => {
    // A full runtime "recreate the interval without reload" scenario needs the
    // event-driven re-read wired up in a later task (6). For now this guards
    // that a freshly-mounted provider always uses whatever value the settings
    // service currently reports, i.e. the interval is never hardcoded/stale
    // across provider instances with different configured values.
    mockSyncIntervalSetting("1");
    const firstMount = await renderProviderAndResetMocks();
    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    firstMount.unmount();

    mockSyncIntervalSetting("2");
    await renderProviderAndResetMocks();

    // The old 1-minute value must NOT trigger a sync anymore.
    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });
    expect(mockPush).not.toHaveBeenCalled();

    // The new 2-minute value fires once the remaining minute elapses.
    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("should trigger exactly one periodic sync per configured interval tick, never overlapping intervals", async () => {
    // Verifies NFR-P1 of configurable-sync-timing: no duplicate periodic timers.
    mockSyncIntervalSetting("1");
    await renderProviderAndResetMocks();

    // Advance one tick at a time so each sync's microtasks (and the
    // isSyncingRef mutex release) flush before the next interval fires —
    // a single large advanceTimersByTime jump fires all pending
    // setInterval callbacks synchronously with no microtask flushing
    // between them, which would cause ticks 2 and 3 to be dropped by the
    // in-flight-sync mutex.
    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });
    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });
    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });

    expect(mockPush).toHaveBeenCalledTimes(3);
    expect(mockPull).toHaveBeenCalledTimes(3);
  });

  // implements FR3, D4, NFR-P1 of configurable-sync-timing
  it("should never create a periodic sync when signed out (accessToken absent) even though a connection config exists", async () => {
    vi.mocked(useAuth).mockReturnValue({
      accessToken: null,
      authProvider: null,
      userEmail: null,
      userPicture: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      silentRefresh: vi.fn(),
    });
    mockSyncIntervalSetting("1");
    await renderProviderAndResetMocks();

    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should never create a periodic sync when no connection config is configured even though signed in", async () => {
    localStorage.removeItem("connection_config");
    mockSyncIntervalSetting("1");
    await renderProviderAndResetMocks();

    await act(async () => {
      vi.advanceTimersByTime(ONE_MINUTE_MS);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
