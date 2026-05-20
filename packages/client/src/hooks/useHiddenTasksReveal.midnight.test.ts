import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/HiddenTaskService", () => ({ HiddenTaskService: vi.fn() }));
vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn(),
}));

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

describe("useHiddenTasksReveal", () => {
  it("should schedule midnight reveal on mount", async () => {
    vi.useFakeTimers();
    const clock = createMutableClock("2026-04-16T22:00:00Z", "UTC");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    // 22:00 -> 00:00:01 = 2 hours 1 second = 7201000 ms
    await act(async () => {
      vi.advanceTimersByTime(7201000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("should reschedule midnight reveal after first trigger", async () => {
    vi.useFakeTimers();
    const clock = createMutableClock("2026-04-16T23:00:00Z", "UTC");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    // First midnight: 23:00 -> 00:00:01 = 1 hour 1 second = 3601000 ms
    await act(async () => {
      vi.advanceTimersByTime(3601000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    clock.setInstant("2026-04-17T00:00:01Z");

    mockRevealHiddenTasks.mockClear();

    // Second midnight: 00:00:01 -> 24:00:01 = 24 hours = 86400000 ms
    await act(async () => {
      vi.advanceTimersByTime(86400000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("should clear midnight timeout on unmount", async () => {
    vi.useFakeTimers();
    const clock = createMutableClock("2026-04-16T23:00:00Z", "UTC");

    const { unmount } = renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(3601000);
    });

    expect(mockRevealHiddenTasks).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should handle timezone correctly when scheduling midnight", async () => {
    vi.useFakeTimers();
    // 2026-04-16 20:00 UTC = 2026-04-16 23:00 Europe/Moscow (UTC+3)
    const clock = createMutableClock("2026-04-16T20:00:00Z", "Europe/Moscow");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    // Until midnight Moscow time: 23:00 -> 00:00:01 = 1 hour 1 second = 3601000 ms
    await act(async () => {
      vi.advanceTimersByTime(3601000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
