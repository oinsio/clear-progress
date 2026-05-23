import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskService } from "@/services/TaskService";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import { useCategoryTasks } from "./useCategoryTasks";

describe("useCategoryTasks — loading", () => {
  let mockTaskService: TaskService;
  const categoryId = "cat-1";

  beforeEach(() => {
    mockTaskService = createMockTaskService();
  });

  it("should set isLoading to true on initial render", () => {
    const { result } = renderHook(() =>
      useCategoryTasks(categoryId, mockTaskService),
    );
    expect(result.current.isLoading).toBe(true);
  });

  it("should set isLoading to false after tasks are fetched", async () => {
    const { result } = renderHook(() =>
      useCategoryTasks(categoryId, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("should have empty initial tasks before loading completes", () => {
    mockTaskService = createMockTaskService({
      getByCategoryId: vi.fn().mockReturnValue(new Promise(() => {})),
    });
    const { result } = renderHook(() =>
      useCategoryTasks(categoryId, mockTaskService),
    );
    expect(result.current.tasks).toEqual([]);
  });
});
