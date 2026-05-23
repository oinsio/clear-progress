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
  it("should pass clock to HiddenTaskService", async () => {
    const clock = createMutableClock("2026-04-16T10:00:00Z", "Asia/Tokyo");

    renderHook(() => useHiddenTasksReveal(clock));
    await act(async () => {});

    expect(HiddenTaskService).toHaveBeenCalledWith(expect.anything(), clock);
  });
});
