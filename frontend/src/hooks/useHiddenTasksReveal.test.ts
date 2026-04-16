import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { Temporal, type Clock } from "@/lib/temporal";

const { mockRevealHiddenTasks } = vi.hoisted(() => ({
  mockRevealHiddenTasks: vi.fn(),
}));

vi.mock("@/services/HiddenTaskService", () => ({
  HiddenTaskService: vi.fn().mockImplementation(() => ({
    revealHiddenTasks: mockRevealHiddenTasks,
  })),
}));

vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn(),
}));

import { HiddenTaskService } from "@/services/HiddenTaskService";
import { useHiddenTasksReveal } from "./useHiddenTasksReveal";

beforeEach(() => {
  vi.clearAllMocks();
  mockRevealHiddenTasks.mockResolvedValue([]);
  vi.mocked(HiddenTaskService).mockImplementation(
    () =>
      ({
        revealHiddenTasks: mockRevealHiddenTasks,
      }) as unknown as HiddenTaskService,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createMutableClock(
  isoTimestamp: string,
  timeZone: string,
): Clock & { setInstant(iso: string): void } {
  let instant = Temporal.Instant.from(isoTimestamp);
  return {
    instant: () => instant,
    plainDateISO: () =>
      instant.toZonedDateTimeISO(timeZone).toPlainDate(),
    timeZoneId: () => timeZone,
    setInstant(iso: string) {
      instant = Temporal.Instant.from(iso);
    },
  };
}

describe("useHiddenTasksReveal", () => {
  it("should reveal tasks on mount", async () => {
    renderHook(() => useHiddenTasksReveal());
    await act(async () => {});

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);
  });

  it("should reveal tasks on sync_complete event", async () => {
    renderHook(() => useHiddenTasksReveal());
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    await act(async () => {
      window.dispatchEvent(new Event("sync_complete"));
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);
  });

  it("should reveal tasks when page becomes visible via visibilitychange", async () => {
    renderHook(() => useHiddenTasksReveal());
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);
  });

  it("should NOT reveal tasks when page becomes hidden via visibilitychange", async () => {
    renderHook(() => useHiddenTasksReveal());
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        value: "hidden",
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(mockRevealHiddenTasks).not.toHaveBeenCalled();
  });

  it("should remove visibilitychange listener on unmount", async () => {
    const { unmount } = renderHook(() => useHiddenTasksReveal());
    await act(async () => {});

    mockRevealHiddenTasks.mockClear();

    unmount();

    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        value: "visible",
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(mockRevealHiddenTasks).not.toHaveBeenCalled();
  });

  it("should schedule midnight reveal on mount", async () => {
    vi.useFakeTimers();
    const clock = createMutableClock("2026-04-16T22:00:00Z", "UTC");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    // Очистить вызов при монтировании
    mockRevealHiddenTasks.mockClear();

    // Продвинуть время до полуночи + 1 секунда
    // 22:00 → 00:00:01 = 2 часа 1 секунда = 7201000 мс
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

    // Первая полночь: 23:00 → 00:00:01 = 1 час 1 секунда = 3601000 мс
    await act(async () => {
      vi.advanceTimersByTime(3601000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    // Обновить clock для следующего дня
    clock.setInstant("2026-04-17T00:00:01Z");

    mockRevealHiddenTasks.mockClear();

    // Вторая полночь: 00:00:01 → 24:00:01 = 24 часа = 86400000 мс
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

    // Продвинуть время до полуночи
    await act(async () => {
      vi.advanceTimersByTime(3601000);
    });

    // Не должно быть вызова после размонтирования
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

    // До полуночи по Москве: 23:00 → 00:00:01 = 1 час 1 секунда = 3601000 мс
    await act(async () => {
      vi.advanceTimersByTime(3601000);
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("should pass clock to HiddenTaskService", async () => {
    const clock = createMutableClock("2026-04-16T10:00:00Z", "Asia/Tokyo");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    expect(HiddenTaskService).toHaveBeenCalledWith(expect.anything(), clock);
  });
});
