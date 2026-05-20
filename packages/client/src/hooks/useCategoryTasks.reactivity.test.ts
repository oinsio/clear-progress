import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import type { TaskService } from "@/services/TaskService";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import { useCategoryTasks } from "./useCategoryTasks";

describe("useCategoryTasks — reactivity", () => {
  let mockTaskService: TaskService;

  beforeEach(() => {
    mockTaskService = createMockTaskService();
  });

  it("should create task with updated categoryId after categoryId changes", async () => {
    const mockGetByCategoryId = vi.fn().mockResolvedValue([]);
    mockTaskService = createMockTaskService({
      getByCategoryId: mockGetByCategoryId,
    });
    const { result, rerender } = renderHook(
      ({ catId }: { catId: string }) =>
        useCategoryTasks(catId, mockTaskService),
      { initialProps: { catId: "cat-1" } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ catId: "cat-2" });
    await waitFor(() =>
      expect(mockTaskService.getByCategoryId).toHaveBeenCalledWith("cat-2"),
    );

    await act(async () => {
      await result.current.createTask("New task", BOX.TODAY);
    });

    expect(mockTaskService.create).toHaveBeenCalledWith({
      name: "New task",
      box: BOX.TODAY,
      description: "",
      category_id: "cat-2",
    });
  });

  it("should refetch when categoryId changes", async () => {
    const { rerender } = renderHook(
      ({ catId }: { catId: string }) =>
        useCategoryTasks(catId, mockTaskService),
      { initialProps: { catId: "cat-1" } },
    );
    await waitFor(() =>
      expect(mockTaskService.getByCategoryId).toHaveBeenCalledWith("cat-1"),
    );

    rerender({ catId: "cat-2" });
    await waitFor(() =>
      expect(mockTaskService.getByCategoryId).toHaveBeenCalledWith("cat-2"),
    );
  });
});
