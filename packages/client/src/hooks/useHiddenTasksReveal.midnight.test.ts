import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/HiddenTaskService", () => ({ HiddenTaskService: vi.fn() }));
vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn(),
}));

import { STORAGE_KEYS } from "@/constants";
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

describe("useHiddenTasksReveal — boundary timer", () => {
  it("should schedule reveal at default boundary (00:00) on mount", async () => {
    vi.useFakeTimers();
    const clock = createMutableClock("2026-04-16T22:00:00Z", "UTC");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    // 22:00 -> 00:00 + 1s buffer = 2h 1s = 7201000 ms
    await act(async () => {
      vi.advanceTimersByTime(7201000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("should schedule reveal at custom boundary (02:00) instead of midnight", async () => {
    vi.useFakeTimers();
    localStorage.setItem(STORAGE_KEYS.DAY_BOUNDARY, "02:00");
    const clock = createMutableClock("2026-04-16T22:00:00Z", "UTC");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    // Should NOT fire at midnight (2h + 1s buffer = 7201000 ms)
    await act(async () => {
      vi.advanceTimersByTime(7201000);
    });

    expect(mockRevealHiddenTasks).not.toHaveBeenCalled();

    // Should fire at 02:00 + 1s buffer: 22:00 -> 02:00 = 4h + 1s = 14401000 ms
    await act(async () => {
      vi.advanceTimersByTime(14401000 - 7201000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    localStorage.removeItem(STORAGE_KEYS.DAY_BOUNDARY);
    vi.useRealTimers();
  });

  it("should reschedule boundary reveal after first trigger", async () => {
    vi.useFakeTimers();
    const clock = createMutableClock("2026-04-16T23:00:00Z", "UTC");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    // First boundary (00:00): 23:00 -> 00:00 + 1s = 3601000 ms
    await act(async () => {
      vi.advanceTimersByTime(3601000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    clock.setInstant("2026-04-17T00:00:01Z");

    mockRevealHiddenTasks.mockClear();

    // Second boundary: 00:00:01 -> next 00:00 + 1s = ~24h = 86400000 ms
    await act(async () => {
      vi.advanceTimersByTime(86400000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("should clear boundary timeout on unmount", async () => {
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

  it("should handle timezone correctly when scheduling boundary", async () => {
    vi.useFakeTimers();
    // 2026-04-16 20:00 UTC = 2026-04-16 23:00 Europe/Moscow (UTC+3)
    const clock = createMutableClock("2026-04-16T20:00:00Z", "Europe/Moscow");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    // Until midnight Moscow time: 23:00 -> 00:00 + 1s buffer = 3601000 ms
    await act(async () => {
      vi.advanceTimersByTime(3601000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("should schedule at next day boundary when current time is past boundary", async () => {
    vi.useFakeTimers();
    localStorage.setItem(STORAGE_KEYS.DAY_BOUNDARY, "04:00");
    // Current time 06:00 UTC — already past 04:00 boundary
    const clock = createMutableClock("2026-04-16T06:00:00Z", "UTC");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    // Next boundary: 06:00 -> next day 04:00 + 1s = 22h + 1s = 79201000 ms
    await act(async () => {
      vi.advanceTimersByTime(79201000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    localStorage.removeItem(STORAGE_KEYS.DAY_BOUNDARY);
    vi.useRealTimers();
  });
});
