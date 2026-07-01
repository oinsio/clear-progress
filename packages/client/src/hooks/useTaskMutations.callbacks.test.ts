import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSchedulePush } from "@/app/providers/__mocks__/SyncProvider";
import { BOX } from "@/constants";
import type { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskService } from "@/test/mocks/taskServiceMock";
import { useTaskMutations } from "./useTaskMutations";
import { createTestContext } from "./useTaskMutations.test-utils";

vi.mock(
  "@/app/providers/AlertProvider",
  async () => import("@/app/providers/__mocks__/AlertProvider"),
);
vi.mock(
  "@/app/providers/SyncProvider",
  async () => import("@/app/providers/__mocks__/SyncProvider"),
);

describe("useTaskMutations > callback updates when dependencies change", () => {
  let mockTaskService: TaskService;

  beforeEach(() => {
    const ctx = createTestContext();
    mockTaskService = ctx.mockTaskService;
    mockSchedulePush.mockClear();
  });

  it.each([
    {
      method: "completeTask" as const,
      setup: (): string => {
        const task = buildTask({ is_completed: false });
        mockTaskService = createMockTaskService({
          getById: vi.fn().mockResolvedValue(task),
        });
        return task.id;
      },
    },
    {
      method: "updateTask" as const,
      setup: (): string => "task-1",
    },
    {
      method: "moveTask" as const,
      setup: (): string => "task-1",
    },
    {
      method: "deleteTask" as const,
      setup: (): string => "task-1",
    },
  ])("should call updated onReload in $method after onReload changes", async ({
    method,
    setup,
  }) => {
    const taskId = setup();
    const firstOnReload = vi.fn().mockResolvedValue(undefined);
    const secondOnReload = vi.fn().mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ reload }: { reload: () => Promise<void> }) =>
        useTaskMutations(mockTaskService, reload),
      { initialProps: { reload: firstOnReload } },
    );

    rerender({ reload: secondOnReload });

    await act(async () => {
      if (method === "completeTask") {
        await result.current.completeTask(taskId);
      } else if (method === "updateTask") {
        await result.current.updateTask(taskId, { description: "Updated" });
      } else if (method === "moveTask") {
        await result.current.moveTask(taskId, BOX.TODAY);
      } else if (method === "deleteTask") {
        await result.current.deleteTask(taskId);
      }
    });

    expect(secondOnReload).toHaveBeenCalledOnce();
    expect(firstOnReload).not.toHaveBeenCalled();
  });
});
