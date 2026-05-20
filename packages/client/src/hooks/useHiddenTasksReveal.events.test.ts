import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/HiddenTaskService", () => ({ HiddenTaskService: vi.fn() }));
vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn(),
}));

import { HiddenTaskService } from "@/services/HiddenTaskService";
import { useHiddenTasksReveal } from "./useHiddenTasksReveal";
import { setupHiddenTasksRevealMocks } from "./useHiddenTasksReveal.test-utils";

const mockRevealHiddenTasks = vi.fn();
setupHiddenTasksRevealMocks(
  mockRevealHiddenTasks,
  vi.mocked(HiddenTaskService),
);

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
