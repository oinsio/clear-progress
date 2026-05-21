import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SYNC_DEBOUNCE_MS } from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");
import "@/test/helpers/mockRepositories";

import {
  renderProviderWithScheduler,
  setupBeforeEach,
} from "./SyncProvider.test-helpers";
import { mockPull, mockPush } from "./SyncProvider.test-mocks";

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

describe("SyncProvider — schedulePush", () => {
  it("should not call push immediately when schedulePush is triggered", async () => {
    renderProviderWithScheduler();
    await act(async () => {});
    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
    mockPull.mockResolvedValue(undefined);
    await act(async () => {
      fireEvent.click(screen.getByTestId("schedule-btn"));
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should call push and pull after SYNC_DEBOUNCE_MS when schedulePush is triggered", async () => {
    renderProviderWithScheduler();
    await act(async () => {});
    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
    mockPull.mockResolvedValue(undefined);
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
    renderProviderWithScheduler();
    await act(async () => {});
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
    renderProviderWithScheduler();
    await act(async () => {});
    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
    mockPull.mockResolvedValue(undefined);
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
    const { unmount } = renderProviderWithScheduler();
    await act(async () => {});
    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
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
