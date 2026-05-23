import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import type { Task } from "@/types/entities";
import { useCategoryTasks } from "./useCategoryTasks";

describe("useCategoryTasks — mutations", () => {
  let mockTaskService: TaskService;
  const categoryId = "cat-1";

  beforeEach(() => {
    mockTaskService = createMockTaskService();
  });

  it("should call create with category_id when createTask is called", async () => {
    const mockGetByCategoryId = vi.fn().mockResolvedValue([]);
    mockTaskService = createMockTaskService({
      getByCategoryId: mockGetByCategoryId,
    });
    const { result } = renderHook(() =>
      useCategoryTasks(categoryId, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.createTask("New task", BOX.TODAY);
    });

    expect(mockTaskService.create).toHaveBeenCalledWith({
      name: "New task",
      box: BOX.TODAY,
      description: "",
      category_id: categoryId,
    });
  });

  async function setupHookWithTask() {
    const task = buildTask({ category_id: categoryId });
    const mockGetByCategoryId = vi.fn().mockResolvedValue([task]);
    mockTaskService = createMockTaskService({
      getByCategoryId: mockGetByCategoryId,
    });
    const { result } = renderHook(() =>
      useCategoryTasks(categoryId, mockTaskService),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    return { result, task, mockGetByCategoryId };
  }

  it.each([
    {
      name: "should call softDelete when deleteTask is called",
      action: (
        result: ReturnType<
          typeof renderHook<ReturnType<typeof useCategoryTasks>, unknown>
        >["result"],
        task: Task,
      ) => result.current.deleteTask(task.id),
      expectation: (task: Task) =>
        expect(mockTaskService.softDelete).toHaveBeenCalledWith(task.id),
    },
    {
      name: "should call moveToBox when moveTask is called",
      action: (
        result: ReturnType<
          typeof renderHook<ReturnType<typeof useCategoryTasks>, unknown>
        >["result"],
        task: Task,
      ) => result.current.moveTask(task.id, BOX.WEEK),
      expectation: (task: Task) =>
        expect(mockTaskService.moveToBox).toHaveBeenCalledWith(
          task.id,
          BOX.WEEK,
        ),
    },
    {
      name: "should call update when updateTask is called",
      action: (
        result: ReturnType<
          typeof renderHook<ReturnType<typeof useCategoryTasks>, unknown>
        >["result"],
        task: Task,
      ) => result.current.updateTask(task.id, { name: "Updated" }),
      expectation: (task: Task) =>
        expect(mockTaskService.update).toHaveBeenCalledWith(task.id, {
          name: "Updated",
        }),
    },
  ])("$name", async ({ action, expectation }) => {
    const { result, task } = await setupHookWithTask();

    await act(async () => {
      await action(result, task);
    });

    expectation(task);
  });
});
