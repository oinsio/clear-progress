import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import { useTaskMutations } from "./useTaskMutations";
import {
  createTestContext,
  type TestContext,
} from "./useTaskMutations.test-utils";

const mockSchedulePush = vi.fn();

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({
    syncVersion: 0,
    syncStatus: "idle",
    pull: vi.fn(),
    push: vi.fn(),
    schedulePush: mockSchedulePush,
  }),
}));

async function completeAndReturn(
  ctx: TestContext,
  taskId: string,
): Promise<string | null> {
  const { result } = renderHook(() =>
    useTaskMutations(ctx.mockTaskService, ctx.onReload),
  );
  let recurringId: string | null = null;
  await act(async () => {
    recurringId = await result.current.completeTask(taskId);
  });
  return recurringId;
}

describe("useTaskMutations > completeTask", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
    mockSchedulePush.mockClear();
  });

  describe("when task is found and not completed", () => {
    let task: Task;

    beforeEach(async () => {
      task = buildTask({ is_completed: false });
      ctx = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      await completeAndReturn(ctx, task.id);
    });

    it("should call getById with the task id", () => {
      expect(ctx.mockTaskService.getById).toHaveBeenCalledWith(task.id);
    });

    it("should call complete", () => {
      expect(ctx.mockTaskService.complete).toHaveBeenCalledWith(
        task.id,
        expect.any(String),
      );
    });

    it("should call reload", () => {
      expect(ctx.onReload).toHaveBeenCalledOnce();
    });

    it("should call schedulePush", () => {
      expect(mockSchedulePush).toHaveBeenCalledOnce();
    });
  });

  describe("when task is already completed", () => {
    let task: Task;

    beforeEach(async () => {
      task = buildTask({ is_completed: true });
      ctx = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      await completeAndReturn(ctx, task.id);
    });

    it("should call noncomplete", () => {
      expect(ctx.mockTaskService.noncomplete).toHaveBeenCalledWith(task.id);
    });

    it("should call reload", () => {
      expect(ctx.onReload).toHaveBeenCalledOnce();
    });
  });

  describe("when task is not found", () => {
    beforeEach(async () => {
      ctx = createTestContext({
        getById: vi.fn().mockResolvedValue(undefined),
      });
      await completeAndReturn(ctx, "nonexistent-id");
    });

    it("should not call complete or noncomplete", () => {
      expect(ctx.mockTaskService.complete).not.toHaveBeenCalled();
      expect(ctx.mockTaskService.noncomplete).not.toHaveBeenCalled();
    });

    it("should not call reload", () => {
      expect(ctx.onReload).not.toHaveBeenCalled();
    });

    it("should not call schedulePush", () => {
      expect(mockSchedulePush).not.toHaveBeenCalled();
    });
  });

  describe("return value", () => {
    it("should return null when task has no repeat_rule", async () => {
      const task = buildTask({ is_completed: false, repeat_rule: "" });
      ctx = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
        complete: vi
          .fn()
          .mockResolvedValue({ completed: task, recurring: null }),
      });

      const recurringId = await completeAndReturn(ctx, task.id);

      expect(recurringId).toBeNull();
    });

    it("should return the recurring task id when task has repeat_rule", async () => {
      const task = buildTask({
        is_completed: false,
        repeat_rule: JSON.stringify({ type: "daily" }),
      });
      const recurringTask = buildTask({ id: "new-recurring-id" });
      ctx = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
        complete: vi
          .fn()
          .mockResolvedValue({ completed: task, recurring: recurringTask }),
      });

      const recurringId = await completeAndReturn(ctx, task.id);

      expect(recurringId).toBe("new-recurring-id");
    });
  });
});
