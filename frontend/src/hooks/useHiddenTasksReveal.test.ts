import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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
});
