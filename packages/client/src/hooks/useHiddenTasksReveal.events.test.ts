import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/HiddenTaskService", () => ({ HiddenTaskService: vi.fn() }));
vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn(),
}));

import { DAY_BOUNDARY_CHANGED_EVENT, STORAGE_KEYS } from "@/constants";
import { HiddenTaskService } from "@/services/HiddenTaskService";
import { useHiddenTasksReveal } from "./useHiddenTasksReveal";
import {
  createMutableClock,
  setupHiddenTasksRevealMocks,
} from "./useHiddenTasksReveal.test-utils";

const mockRevealHiddenTasks = vi.fn();
setupHiddenTasksRevealMocks(
  mockRevealHiddenTasks,
  vi.mocked(HiddenTaskService),
);

async function mountHookAndClearMocks(
  clock?: Parameters<typeof useHiddenTasksReveal>[0],
) {
  const hookResult = renderHook(() => useHiddenTasksReveal(clock));
  await act(async () => {});
  mockRevealHiddenTasks.mockClear();
  return hookResult;
}

async function simulateVisibilityChange(state: DocumentVisibilityState) {
  await act(async () => {
    Object.defineProperty(document, "visibilityState", {
      value: state,
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

describe("useHiddenTasksReveal", () => {
  it("should reveal tasks on mount", async () => {
    renderHook(() => useHiddenTasksReveal());
    await act(async () => {});

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);
  });

  it("should reveal tasks on sync_complete event", async () => {
    await mountHookAndClearMocks();

    await act(async () => {
      window.dispatchEvent(new Event("sync_complete"));
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);
  });

  it("should reveal tasks when page becomes visible via visibilitychange", async () => {
    await mountHookAndClearMocks();

    await simulateVisibilityChange("visible");

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);
  });

  it("should NOT reveal tasks when page becomes hidden via visibilitychange", async () => {
    await mountHookAndClearMocks();

    await simulateVisibilityChange("hidden");

    expect(mockRevealHiddenTasks).not.toHaveBeenCalled();
  });

  it("should remove visibilitychange listener on unmount", async () => {
    const { unmount } = await mountHookAndClearMocks();

    unmount();

    await simulateVisibilityChange("visible");

    expect(mockRevealHiddenTasks).not.toHaveBeenCalled();
  });

  it("should run immediate reveal on DAY_BOUNDARY_CHANGED_EVENT — FR6", async () => {
    await mountHookAndClearMocks();

    await act(async () => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);
  });

  it("should reschedule timer on DAY_BOUNDARY_CHANGED_EVENT — FR6", async () => {
    vi.useFakeTimers();
    // Start at 22:00 UTC, default boundary 00:00
    const clock = createMutableClock("2026-04-16T22:00:00Z", "UTC");

    await mountHookAndClearMocks(clock);

    // Change boundary to 23:00 — should reschedule timer
    localStorage.setItem(STORAGE_KEYS.DAY_BOUNDARY, "23:00");
    await act(async () => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });

    // One call from the immediate reveal in handleDayBoundaryChanged
    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);
    mockRevealHiddenTasks.mockClear();

    // New timer should fire at 23:00 + 1s buffer = 1h + 1s = 3601000 ms from 22:00
    await act(async () => {
      vi.advanceTimersByTime(3601000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    localStorage.removeItem(STORAGE_KEYS.DAY_BOUNDARY);
    vi.useRealTimers();
  });

  it("should remove DAY_BOUNDARY_CHANGED_EVENT listener on unmount", async () => {
    const { unmount } = await mountHookAndClearMocks();

    unmount();

    await act(async () => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });

    expect(mockRevealHiddenTasks).not.toHaveBeenCalled();
  });
});
