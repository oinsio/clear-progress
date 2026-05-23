import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PING_INTERVAL_MS } from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");
import "@/test/helpers/mockRepositories";

import {
  renderProvider,
  setNavigatorOffline,
  setNavigatorOnline,
  setupBeforeEach,
  VALID_PING_INITIALIZED,
} from "./SyncProvider.test-helpers";
import { mockPing, mockPull, mockPush } from "./SyncProvider.test-mocks";

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

describe("SyncProvider — ping on mount", () => {
  it("should call ping on mount when online", async () => {
    renderProvider();
    await act(async () => {});
    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it("should not call ping on mount when offline", async () => {
    setNavigatorOffline();
    renderProvider();
    await act(async () => {});
    expect(mockPing).not.toHaveBeenCalled();
  });

  it("should start periodic ping when offline", async () => {
    setNavigatorOffline();
    mockPing.mockRejectedValue(new Error("Server offline"));
    renderProvider();
    await act(async () => {});

    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });
    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it("should set status to 'offline' when navigator is offline", async () => {
    setNavigatorOffline();
    renderProvider();
    await act(async () => {});
    expect(screen.getByTestId("status").textContent).toBe("offline");
  });

  it("should set status to 'offline' when ping fails", async () => {
    mockPing.mockRejectedValue(new Error("Server unreachable"));
    renderProvider();
    await act(async () => {});
    expect(screen.getByTestId("status").textContent).toBe("offline");
  });

  it("should start ping interval after going offline", async () => {
    renderProvider();
    await act(async () => {});
    vi.clearAllMocks();

    setNavigatorOffline();
    await act(async () => {
      window.dispatchEvent(new Event("offline"));
    });

    mockPing.mockResolvedValue(VALID_PING_INITIALIZED);
    mockPull.mockResolvedValue(undefined);
    mockPush.mockResolvedValue(undefined);
    await act(async () => {
      vi.advanceTimersByTime(PING_INTERVAL_MS);
    });
    expect(mockPing).toHaveBeenCalledTimes(1);
  });

  it("should resume sync after online event fires", async () => {
    setNavigatorOffline();
    renderProvider();
    await act(async () => {});
    vi.clearAllMocks();

    mockPing.mockResolvedValue(VALID_PING_INITIALIZED);
    mockPull.mockResolvedValue(undefined);
    mockPush.mockResolvedValue(undefined);
    setNavigatorOnline();
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    expect(mockPing).toHaveBeenCalledTimes(1);
  });
});
