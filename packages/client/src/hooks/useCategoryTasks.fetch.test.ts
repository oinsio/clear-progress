import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import { useCategoryTasks } from "./useCategoryTasks";

describe("useCategoryTasks — fetch", () => {
  let mockTaskService: TaskService;
  const categoryId = "cat-1";

  beforeEach(() => {
    mockTaskService = createMockTaskService();
  });

  it("should return empty array when category has no tasks", async () => {
    const { result } = renderHook(() =>
      useCategoryTasks(categoryId, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual([]);
  });

  it("should call getByCategoryId with the given categoryId", async () => {
    const { result } = renderHook(() =>
      useCategoryTasks(categoryId, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockTaskService.getByCategoryId).toHaveBeenCalledWith(categoryId);
  });

  it("should return category tasks after loading", async () => {
    const tasks = [
      buildTask({ category_id: categoryId }),
      buildTask({ category_id: categoryId }),
    ];
    mockTaskService = createMockTaskService({
      getByCategoryId: vi.fn().mockResolvedValue(tasks),
    });
    const { result } = renderHook(() =>
      useCategoryTasks(categoryId, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tasks).toEqual(tasks);
  });
});
