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

describe("useHiddenTasksReveal", () => {
  it("should pass clock to HiddenTaskService", async () => {
    const clock = createMutableClock("2026-04-16T10:00:00Z", "Asia/Tokyo");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    expect(HiddenTaskService).toHaveBeenCalledWith(expect.anything(), clock);
  });

  it("should pass logicalDate to revealHiddenTasks on mount", async () => {
    // 2026-04-16T10:00:00Z UTC, boundary 00:00 => logicalDate = "2026-04-16"
    const clock = createMutableClock("2026-04-16T10:00:00Z", "UTC");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    expect(mockRevealHiddenTasks).toHaveBeenCalledWith("2026-04-16");
  });

  it("should pass logicalDate based on boundary to revealHiddenTasks", async () => {
    // 2026-04-16T01:00:00Z UTC, boundary 02:00
    // Current time 01:00 < boundary 02:00 => logicalDate = previous day = "2026-04-15"
    localStorage.setItem(STORAGE_KEYS.DAY_BOUNDARY, "02:00");
    const clock = createMutableClock("2026-04-16T01:00:00Z", "UTC");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    expect(mockRevealHiddenTasks).toHaveBeenCalledWith("2026-04-15");

    localStorage.removeItem(STORAGE_KEYS.DAY_BOUNDARY);
  });

  it("should use updated boundary for logicalDate after DAY_BOUNDARY_CHANGED_EVENT", async () => {
    // Start at 01:00 UTC with default boundary 00:00
    // 01:00 >= 00:00 => logicalDate = "2026-04-16"
    const clock = createMutableClock("2026-04-16T01:00:00Z", "UTC");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    expect(mockRevealHiddenTasks).toHaveBeenCalledWith("2026-04-16");

    mockRevealHiddenTasks.mockClear();

    // Change boundary to 02:00
    // 01:00 < 02:00 => logicalDate = "2026-04-15"
    localStorage.setItem(STORAGE_KEYS.DAY_BOUNDARY, "02:00");
    await act(async () => {
      window.dispatchEvent(new CustomEvent(DAY_BOUNDARY_CHANGED_EVENT));
    });

    expect(mockRevealHiddenTasks).toHaveBeenCalledWith("2026-04-15");

    localStorage.removeItem(STORAGE_KEYS.DAY_BOUNDARY);
  });
});
