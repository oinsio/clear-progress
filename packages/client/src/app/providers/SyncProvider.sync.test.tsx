import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SYNC_INTERVAL_MS } from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");
import "@/test/helpers/mockRepositories";

import {
  renderProvider,
  renderProviderWithMethod,
  renderProviderWithVersion,
  setupBeforeEach,
} from "./SyncProvider.test-helpers";
import { mockPull, mockPush } from "./SyncProvider.test-mocks";

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

describe("SyncProvider — push call", () => {
  it("should call push with no arguments on sync", async () => {
    renderProvider();
    await act(async () => {});
    expect(mockPush).toHaveBeenCalledWith();
  });

  it("should call push with no arguments regardless of lastSyncedAt", async () => {
    localStorage.setItem("last_sync", "2026-03-01T10:00:00.000Z");
    renderProvider();
    await act(async () => {});
    expect(mockPush).toHaveBeenCalledWith();
  });
});

describe("SyncProvider — push+pull pairing", () => {
  function trackCallOrder() {
    const callOrder: string[] = [];
    mockPush.mockImplementation(async () => {
      callOrder.push("push");
    });
    mockPull.mockImplementation(async () => {
      callOrder.push("pull");
    });
    return callOrder;
  }

  it("should call push before pull on initial sync", async () => {
    const callOrder = trackCallOrder();
    renderProvider();
    await act(async () => {});
    expect(callOrder).toEqual(["push", "pull"]);
  });

  it("should call push before pull on periodic interval sync", async () => {
    renderProvider();
    await act(async () => {});
    const callOrder = trackCallOrder();
    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });
    expect(callOrder).toEqual(["push", "pull"]);
  });

  it("should call push before pull when pull() context method is invoked", async () => {
    renderProviderWithMethod("pull");
    await act(async () => {});
    const callOrder = trackCallOrder();
    await act(async () => {
      fireEvent.click(screen.getByTestId("pull-btn"));
    });
    expect(callOrder).toEqual(["push", "pull"]);
  });

  it("should call pull after push when push() context method is invoked", async () => {
    renderProviderWithMethod("push");
    await act(async () => {});
    const callOrder = trackCallOrder();
    await act(async () => {
      fireEvent.click(screen.getByTestId("push-btn"));
    });
    expect(callOrder).toEqual(["push", "pull"]);
  });
});

describe("SyncProvider — syncVersion", () => {
  it("should expose syncVersion starting at 0", () => {
    renderProviderWithVersion();
    expect(screen.getByTestId("version").textContent).toBe("0");
  });

  it("should increment syncVersion after successful sync", async () => {
    renderProviderWithVersion();
    await act(async () => {});
    expect(screen.getByTestId("version").textContent).toBe("1");
  });

  it("should increment syncVersion after periodic sync", async () => {
    renderProviderWithVersion();
    await act(async () => {});
    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });
    expect(screen.getByTestId("version").textContent).toBe("2");
  });
});
