import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SYNC_INTERVAL_MS } from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");
import "@/test/helpers/mockRepositories";

import { SyncProvider } from "./SyncProvider";
import {
  FullSyncTrigger,
  renderProvider,
  SyncStatusDisplay,
  setupBeforeEach,
} from "./SyncProvider.test-helpers";
import { mockFileSync, mockPull, mockPush } from "./SyncProvider.test-mocks";

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

describe("SyncProvider — sync mutex", () => {
  it("should not start a second sync while one is already in progress", async () => {
    let resolvePush!: () => void;
    mockPush.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePush = resolve;
        }),
    );
    renderProvider();
    await act(async () => {});
    vi.clearAllMocks();

    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });
    expect(mockPush).not.toHaveBeenCalled();

    await act(async () => {
      resolvePush();
    });
    await act(async () => {});

    mockPush.mockResolvedValue(undefined);
    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("should not start fullSync if a regular sync is already in progress", async () => {
    let resolvePush!: () => void;
    mockPush.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePush = resolve;
        }),
    );
    const onProgress = vi.fn();
    render(
      <SyncProvider>
        <SyncStatusDisplay />
        <FullSyncTrigger onProgress={onProgress} testId="full-sync-btn2" />
      </SyncProvider>,
    );
    await act(async () => {});
    vi.clearAllMocks();

    await act(async () => {
      fireEvent.click(screen.getByTestId("full-sync-btn2"));
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(onProgress).not.toHaveBeenCalled();
    resolvePush();
  });
});

describe("SyncProvider — file sync error handling", () => {
  it("should complete sync and set status to idle even if file sync throws", async () => {
    mockFileSync.mockRejectedValue(new Error("File sync failed"));
    renderProvider();
    await act(async () => {});
    expect(screen.getByTestId("status").textContent).toBe("idle");
    expect(mockPush).toHaveBeenCalled();
    expect(mockPull).toHaveBeenCalled();
  });

  it("should not propagate file sync error to the main sync error handler", async () => {
    mockFileSync.mockRejectedValue(new Error("File sync failed"));
    renderProvider();
    await act(async () => {});
    expect(screen.getByTestId("status").textContent).not.toBe("error");
  });
});

describe("SyncProvider — localStorage resilience", () => {
  it("should not throw when localStorage.setItem fails during sync", async () => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    vi.spyOn(localStorage, "setItem").mockImplementation(
      (key: string, value: string) => {
        if (key === "last_sync") throw new Error("QuotaExceededError");
        originalSetItem(key, value);
      },
    );
    renderProvider();
    await act(async () => {});
    expect(screen.getByTestId("status").textContent).toBe("idle");
    vi.restoreAllMocks();
  });
});
