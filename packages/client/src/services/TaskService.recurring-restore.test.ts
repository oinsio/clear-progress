// implements FR1 of fix-recurring-restore
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import type { TaskService } from "./TaskService";
import { createTestContext } from "./TaskService-test-utils";

describe("TaskService - Recurring Restore (fix-recurring-restore)", () => {
  let taskService: TaskService;
  let mockTaskRepository: TaskRepository;

  beforeEach(() => {
    const context = createTestContext();
    taskService = context.taskService;
    mockTaskRepository = context.mockTaskRepository;
    vi.clearAllMocks();
  });

  describe("softDelete records promoted copy ID", () => {
    // FR1: softDelete records promoted copy ID in original_task_id of deleted task
    it("should record promoted copy ID in original_task_id of deleted task", async () => {
      const originalTask = buildTask({
        id: "a",
        original_task_id: "",
        repeat_rule: "daily",
      });

      const activeCopy = buildTask({
        id: "b",
        original_task_id: "a",
        is_deleted: false,
      });

      const updates: Record<string, Task> = {};

      mockTaskRepository.getById = vi.fn().mockImplementation(async (id) => {
        if (id === "a") return updates.a ?? originalTask;
        if (id === "b") return updates.b ?? activeCopy;
        return undefined;
      });
      mockTaskRepository.findByOriginalTaskId = vi
        .fn()
        .mockResolvedValue([activeCopy]);
      mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
        updates[task.id] = task;
        return task;
      });

      await taskService.softDelete("a");

      expect(updates.a.original_task_id).toBe("b");
      expect(updates.a.is_deleted).toBe(true);
      expect(updates.b.original_task_id).toBe("");
    });

    // FR1: softDelete without copies does not change original_task_id
    it("should not change original_task_id when no copies exist", async () => {
      const originalTask = buildTask({
        id: "a",
        original_task_id: "",
        repeat_rule: "daily",
      });

      const updates: Record<string, Task> = {};

      mockTaskRepository.getById = vi.fn().mockResolvedValue(originalTask);
      mockTaskRepository.findByOriginalTaskId = vi.fn().mockResolvedValue([]);
      mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
        updates[task.id] = task;
        return task;
      });

      await taskService.softDelete("a");

      expect(updates.a.original_task_id).toBe("");
      expect(updates.a.is_deleted).toBe(true);
    });
  });

  // implements FR2, FR3, FR4, FR5 of fix-recurring-restore
  describe("restore conditional logic for recurring tasks", () => {
    function expectRestoredWithClearedRecurrence(
      updates: Record<string, Task>,
      taskId: string,
    ) {
      expect(updates[taskId].is_deleted).toBe(false);
      expect(updates[taskId].repeat_rule).toBe("");
      expect(updates[taskId].next_date).toBe("");
      expect(updates[taskId].appear_date).toBe("");
    }

    function setupRestoreMocks(
      tasks: Record<string, Task>,
    ): Record<string, Task> {
      const updates: Record<string, Task> = {};
      mockTaskRepository.getById = vi.fn().mockImplementation(async (id) => {
        return updates[id] ?? tasks[id] ?? undefined;
      });
      mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
        updates[task.id] = task;
        return task;
      });
      return updates;
    }

    // FR3: promoted successor is alive — clear repeat_rule, next_date, appear_date
    it("should clear repeat_rule, next_date, appear_date when promoted successor is active", async () => {
      const updates = setupRestoreMocks({
        a: buildTask({
          id: "a",
          original_task_id: "b",
          repeat_rule: "daily",
          next_date: "2025-01-15",
          appear_date: "2025-01-14",
          is_deleted: true,
        }),
        b: buildTask({
          id: "b",
          original_task_id: "",
          repeat_rule: "daily",
          is_deleted: false,
        }),
      });
      await taskService.restore("a");
      expectRestoredWithClearedRecurrence(updates, "a");
      expect(updates.a.original_task_id).toBe("b");
    });

    // FR4: promoted successor is deleted — restore as original
    it("should restore as original when promoted successor is deleted", async () => {
      const updates = setupRestoreMocks({
        a: buildTask({
          id: "a",
          original_task_id: "b",
          repeat_rule: "daily",
          is_deleted: true,
        }),
        b: buildTask({ id: "b", is_deleted: true }),
      });
      await taskService.restore("a");
      expect(updates.a.is_deleted).toBe(false);
      expect(updates.a.original_task_id).toBe("");
      expect(updates.a.repeat_rule).toBe("daily");
    });

    // FR4: promoted successor does not exist — restore as original
    it("should restore as original when promoted successor does not exist", async () => {
      const updates = setupRestoreMocks({
        a: buildTask({
          id: "a",
          original_task_id: "b",
          repeat_rule: "daily",
          is_deleted: true,
        }),
      });
      await taskService.restore("a");
      expect(updates.a.is_deleted).toBe(false);
      expect(updates.a.original_task_id).toBe("");
      expect(updates.a.repeat_rule).toBe("daily");
    });

    // FR3: promoted successor is hidden but alive — clear repeat_rule
    it("should clear repeat_rule when promoted successor is hidden but alive", async () => {
      const updates = setupRestoreMocks({
        a: buildTask({
          id: "a",
          original_task_id: "b",
          repeat_rule: "daily",
          next_date: "2025-01-15",
          appear_date: "2025-01-14",
          is_deleted: true,
        }),
        b: buildTask({ id: "b", is_hidden: true, is_deleted: false }),
      });
      await taskService.restore("a");
      expectRestoredWithClearedRecurrence(updates, "a");
    });

    // FR5: no repeat_rule — restore without changes
    it("should restore without changes when task has no repeat_rule", async () => {
      const updates = setupRestoreMocks({
        a: buildTask({
          id: "a",
          original_task_id: "",
          repeat_rule: "",
          is_deleted: true,
        }),
      });
      await taskService.restore("a");
      expect(updates.a.is_deleted).toBe(false);
      expect(updates.a.original_task_id).toBe("");
      expect(updates.a.repeat_rule).toBe("");
    });

    // FR5: copy with original_task_id but no repeat_rule — restore unchanged
    it("should restore unchanged when task has original_task_id but no repeat_rule", async () => {
      const updates = setupRestoreMocks({
        b: buildTask({
          id: "b",
          original_task_id: "a",
          repeat_rule: "",
          is_deleted: true,
        }),
      });
      await taskService.restore("b");
      expect(updates.b.is_deleted).toBe(false);
      expect(updates.b.original_task_id).toBe("a");
      expect(updates.b.repeat_rule).toBe("");
    });
  });
});
