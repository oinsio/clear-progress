import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { Temporal } from "@/lib/temporal";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskRepository } from "@/test/mocks/taskRepositoryMock";
import type { ChecklistItem, Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { TaskService } from "./TaskService";

function expectSortedAscendingByOrder(tasks: Task[]) {
  expect(tasks[0].sort_order).toBe(1);
  expect(tasks[1].sort_order).toBe(2);
  expect(tasks[2].sort_order).toBe(3);
}

describe("TaskService", () => {
  let mockTaskRepository: TaskRepository;
  let mockChecklistRepository: ChecklistRepository;

  // Shared test helpers
  const getCreatedTask = () =>
    (mockTaskRepository.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
  const getCreatedItem = () =>
    (mockChecklistRepository.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0];

  beforeEach(() => {
    mockTaskRepository = createMockTaskRepository();
    mockChecklistRepository = createMockChecklistRepository();
  });

  describe("getByBox", () => {
    it("should return empty array when box has no tasks", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getByBox(BOX.TODAY);
      expect(tasks).toEqual([]);
    });

    it("should return tasks sorted by sort_order ascending", async () => {
      const unsortedTasks = [
        buildTask({ box: "today", sort_order: 3 }),
        buildTask({ box: "today", sort_order: 1 }),
        buildTask({ box: "today", sort_order: 2 }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getByBox: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getByBox(BOX.TODAY);
      expectSortedAscendingByOrder(tasks);
    });
  });

  describe("getById", () => {
    it("should return task when found", async () => {
      const task = buildTask();
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const result = await taskService.getById(task.id);
      expect(result).toEqual(task);
    });

    it("should return undefined when task not found", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const result = await taskService.getById("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("getByGoalId", () => {
    it("should return empty array when goal has no tasks", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getByGoalId("goal-1");
      expect(tasks).toEqual([]);
    });

    it("should return tasks sorted by sort_order ascending", async () => {
      const goalId = "goal-1";
      const unsortedTasks = [
        buildTask({ goal_id: goalId, sort_order: 3 }),
        buildTask({ goal_id: goalId, sort_order: 1 }),
        buildTask({ goal_id: goalId, sort_order: 2 }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getByGoalId: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getByGoalId(goalId);
      expectSortedAscendingByOrder(tasks);
    });

    it("should call repository.getByGoalId with the goalId", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.getByGoalId("goal-abc");
      expect(mockTaskRepository.getByGoalId).toHaveBeenCalledWith("goal-abc");
    });
  });

  describe("create", () => {
    let createdTask: Task;

    beforeEach(async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      createdTask = await taskService.create({
        name: "My task",
        box: "inbox",
      });
    });

    it("should create task with given name and box", () => {
      expect(createdTask.name).toBe("My task");
      expect(createdTask.box).toBe("inbox");
    });

    it("should create task with is_deleted false", () => {
      expect(createdTask.is_deleted).toBe(false);
    });

    it("should create task with a UUID id", () => {
      expect(createdTask.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should create task with empty string defaults for optional fields", () => {
      expect(createdTask.description).toBe("");
      expect(createdTask.goal_id).toBe("");
      expect(createdTask.context_id).toBe("");
      expect(createdTask.category_id).toBe("");
      expect(createdTask.completed_at).toBe("");
      expect(createdTask.repeat_rule).toBe("");
      expect(createdTask.next_date).toBe("");
      expect(createdTask.appear_date).toBe("");
      expect(createdTask.original_task_id).toBe("");
    });

    it("should create task with is_completed false", () => {
      expect(createdTask.is_completed).toBe(false);
    });

    it("should create task with is_hidden false", () => {
      expect(createdTask.is_hidden).toBe(false);
    });

    it("should create task with needsSync true", () => {
      expect(createdTask.needsSync).toBe(true);
    });

    it("should create task with sort_order 0 by default", () => {
      expect(createdTask.sort_order).toBe(0);
    });

    it("should call repository.create with the constructed task", () => {
      expect(mockTaskRepository.create).toHaveBeenCalledWith(createdTask);
    });
  });

  describe("update", () => {
    it("should update task fields", async () => {
      const task = buildTask({ name: "Old name" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const updated = await taskService.update(task.id, { name: "New name" });
      expect(updated.name).toBe("New name");
    });

    it("should throw when task not found", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await expect(taskService.update("nonexistent", {})).rejects.toThrow(
        "Task not found: nonexistent",
      );
    });

    it("should throw error message with task id when task not found", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await expect(taskService.update("task-123", {})).rejects.toThrow(
        "task-123",
      );
    });
  });

  describe("complete", () => {
    const setupRecurringTaskWithItem = async (
      itemOverrides: Partial<ChecklistItem> = {},
    ): Promise<ChecklistItem> => {
      const task = buildTask({
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        }),
      });
      const originalItem = buildChecklistItem({
        task_id: task.id,
        ...itemOverrides,
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      mockChecklistRepository = createMockChecklistRepository({
        getByTaskId: vi.fn().mockResolvedValue([originalItem]),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      return originalItem;
    };

    it("should set is_completed to true", async () => {
      const task = buildTask({ is_completed: false });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const { completed } = await taskService.complete(task.id);
      expect(completed.is_completed).toBe(true);
    });

    it("should set completed_at to a non-empty ISO string", async () => {
      const task = buildTask({ completed_at: "" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const { completed } = await taskService.complete(task.id);
      expect(completed.completed_at).not.toBe("");
    });

    it("should return null for recurring when repeat_rule is empty", async () => {
      const task = buildTask({ repeat_rule: "" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const { recurring } = await taskService.complete(task.id);
      expect(recurring).toBeNull();
    });

    it("should return null for recurring when repeat_rule is invalid JSON", async () => {
      const task = buildTask({ repeat_rule: "invalid json" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const { recurring } = await taskService.complete(task.id);
      expect(recurring).toBeNull();
    });

    it("should return null for recurring when parseRepeatRule returns null", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({ invalid: "rule" }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const { recurring } = await taskService.complete(task.id);
      expect(recurring).toBeNull();
    });

    it("should return the new recurring task when repeat_rule is set", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const { recurring } = await taskService.complete(task.id);
      expect(recurring).not.toBeNull();
      expect(recurring?.id).not.toBe(task.id);
    });

    it("should NOT create a recurring copy when repeat_rule is empty", async () => {
      const task = buildTask({ repeat_rule: "" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      expect(mockTaskRepository.create).not.toHaveBeenCalled();
    });

    it("should create a recurring copy when repeat_rule is set", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      expect(mockTaskRepository.create).toHaveBeenCalledOnce();
    });

    it("should create recurring copy with same name and box", async () => {
      const task = buildTask({
        name: "Daily standup",
        box: "today",
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      const createdTask = getCreatedTask();
      expect(createdTask.name).toBe("Daily standup");
      expect(createdTask.box).toBe("today");
    });

    it("should use task.id as searchId when original_task_id is empty", async () => {
      const task = buildTask({
        id: "task-1",
        original_task_id: "",
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
        findHiddenRecurringTask: vi.fn().mockResolvedValue(undefined),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      expect(mockTaskRepository.findHiddenRecurringTask).toHaveBeenCalledWith(
        "task-1",
      );
    });

    it("should use original_task_id as searchId when it is set", async () => {
      const task = buildTask({
        id: "task-2",
        original_task_id: "task-1",
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
        findHiddenRecurringTask: vi.fn().mockResolvedValue(undefined),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      expect(mockTaskRepository.findHiddenRecurringTask).toHaveBeenCalledWith(
        "task-1",
      );
    });

    it("should create recurring copy with reset completion state", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "weekly",
          interval: 1,
          weekdays: [1],
          target_box: "today",
          advance_days: 0,
        }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      const createdTask = getCreatedTask();
      expect(createdTask.is_completed).toBe(false);
      expect(createdTask.completed_at).toBe("");
    });

    it("should create recurring copy with a new unique id", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      const createdTask = getCreatedTask();
      expect(createdTask.id).not.toBe(task.id);
    });

    it("should not call repository.update when task not found", async () => {
      const task = buildTask();
      mockTaskRepository = createMockTaskRepository({
        getById: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await expect(taskService.complete("nonexistent")).rejects.toThrow();
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
    });

    it("should preserve repeat_rule in the recurring copy", async () => {
      const repeatRule = JSON.stringify({
        type: "fixed",
        frequency: "daily",
        interval: 1,
        target_box: "today",
        advance_days: 0,
      });
      const task = buildTask({ repeat_rule: repeatRule });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      const createdTask = getCreatedTask();
      expect(createdTask.repeat_rule).toBe(repeatRule);
    });

    it("should copy checklist items to the recurring copy", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        }),
      });
      const checklistItems = [
        buildChecklistItem({ task_id: task.id }),
        buildChecklistItem({ task_id: task.id }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      mockChecklistRepository = createMockChecklistRepository({
        getByTaskId: vi.fn().mockResolvedValue(checklistItems),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      expect(mockChecklistRepository.create).toHaveBeenCalledTimes(2);
    });

    it("should not copy checklist items when task has no checklist", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      mockChecklistRepository = createMockChecklistRepository({
        getByTaskId: vi.fn().mockResolvedValue([]),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      expect(mockChecklistRepository.create).not.toHaveBeenCalled();
    });

    it("should copy checklist items with new unique ids", async () => {
      const originalItem = await setupRecurringTaskWithItem();
      const copiedItem = getCreatedItem();
      expect(copiedItem.id).not.toBe(originalItem.id);
    });

    it("should copy checklist items with the new task id", async () => {
      await setupRecurringTaskWithItem();
      const createdTask = getCreatedTask();
      const copiedItem = getCreatedItem();
      expect(copiedItem.task_id).toBe(createdTask.id);
    });

    it("should copy checklist items with is_completed reset to false", async () => {
      await setupRecurringTaskWithItem({ is_completed: true });
      const copiedItem = getCreatedItem();
      expect(copiedItem.is_completed).toBe(false);
    });

    it("should copy checklist items with preserved name and sort_order", async () => {
      await setupRecurringTaskWithItem({ name: "Buy milk", sort_order: 3 });
      const copiedItem = getCreatedItem();
      expect(copiedItem.name).toBe("Buy milk");
      expect(copiedItem.sort_order).toBe(3);
    });

    it("should copy checklist items with needsSync true", async () => {
      await setupRecurringTaskWithItem();
      const copiedItem = getCreatedItem();
      expect(copiedItem.needsSync).toBe(true);
    });

    it("should NOT copy checklist items when repeat_rule is empty", async () => {
      const task = buildTask({ repeat_rule: "" });
      const item = buildChecklistItem({ task_id: task.id });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      mockChecklistRepository = createMockChecklistRepository({
        getByTaskId: vi.fn().mockResolvedValue([item]),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      expect(mockChecklistRepository.create).not.toHaveBeenCalled();
    });

    it("should call getByTaskId when completing task with repeat_rule", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.complete(task.id);
      expect(mockChecklistRepository.getByTaskId).toHaveBeenCalledWith(task.id);
    });
  });

  describe("noncomplete", () => {
    it("should set is_completed to false", async () => {
      const task = buildTask({ is_completed: true });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const result = await taskService.noncomplete(task.id);
      expect(result.is_completed).toBe(false);
    });

    it("should clear completed_at to empty string", async () => {
      const task = buildTask({
        is_completed: true,
        completed_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
        ),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const result = await taskService.noncomplete(task.id);
      expect(result.completed_at).toBe("");
    });

    it("should throw when task not found", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await expect(taskService.noncomplete("nonexistent")).rejects.toThrow(
        "Task not found: nonexistent",
      );
    });

    it("should not call update when task not found in noncomplete", async () => {
      const task = buildTask();
      mockTaskRepository = createMockTaskRepository({
        getById: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await expect(taskService.noncomplete("nonexistent")).rejects.toThrow();
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const task = buildTask({ is_deleted: false });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const deleted = await taskService.softDelete(task.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should call findByOriginalTaskId when deleting task", async () => {
      const task = buildTask({ id: "task-1", original_task_id: "" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
        findByOriginalTaskId: vi.fn().mockResolvedValue([]),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.softDelete(task.id);
      expect(mockTaskRepository.findByOriginalTaskId).toHaveBeenCalledWith(
        "task-1",
      );
    });
  });

  describe("restore", () => {
    it("should set is_deleted to false", async () => {
      const task = buildTask({ is_deleted: true });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const restored = await taskService.restore(task.id);
      expect(restored.is_deleted).toBe(false);
    });

    it("should throw when task not found", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await expect(taskService.restore("nonexistent-id")).rejects.toThrow(
        "Task not found: nonexistent-id",
      );
    });
  });

  describe("moveToBox", () => {
    it("should update task box", async () => {
      const task = buildTask({ box: "inbox" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const moved = await taskService.moveToBox(task.id, BOX.TODAY);
      expect(moved.box).toBe("today");
    });
  });

  describe("reorderTasks", () => {
    const getUpsertedTasks = () =>
      (mockTaskRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as Task[];

    it("should call bulkUpsert with tasks assigned sort_order by position", async () => {
      const taskA = buildTask({ sort_order: 2 });
      const taskB = buildTask({ sort_order: 0 });
      const taskC = buildTask({ sort_order: 1 });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.reorderTasks([taskA, taskB, taskC]);
      const upserted = getUpsertedTasks();
      expect(upserted[0].sort_order).toBe(0);
      expect(upserted[1].sort_order).toBe(1);
      expect(upserted[2].sort_order).toBe(2);
    });

    it("should update updated_at for each reordered task", async () => {
      const taskA = buildTask({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.reorderTasks([taskA]);
      const upserted = getUpsertedTasks();
      expect(upserted[0].updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
    });

    it("should preserve task ids after reorder", async () => {
      const taskA = buildTask();
      const taskB = buildTask();
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.reorderTasks([taskA, taskB]);
      const upserted = getUpsertedTasks();
      expect(upserted[0].id).toBe(taskA.id);
      expect(upserted[1].id).toBe(taskB.id);
    });

    it("should not call bulkUpsert when given empty array", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.reorderTasks([]);
      expect(mockTaskRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should not call bulkUpsert when order has not changed", async () => {
      const taskA = buildTask({ sort_order: 0 });
      const taskB = buildTask({ sort_order: 1 });
      const taskC = buildTask({ sort_order: 2 });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.reorderTasks([taskA, taskB, taskC]);
      expect(mockTaskRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should not update updated_at for tasks that did not change position", async () => {
      const oldTimestamp = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
      );
      const taskA = buildTask({ sort_order: 0, updated_at: oldTimestamp });
      const taskB = buildTask({ sort_order: 2, updated_at: oldTimestamp });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.reorderTasks([taskA, taskB]);
      const upserted = getUpsertedTasks();
      expect(upserted[0].updated_at).toBe(oldTimestamp); // не изменился
      expect(upserted[1].updated_at).not.toBe(oldTimestamp); // изменился
    });

    // FR18: Reorder optimization — needsSync only for changed records
    it("should set needsSync to false for tasks that did not change position", async () => {
      const taskA = buildTask({ sort_order: 0, needsSync: true });
      const taskB = buildTask({ sort_order: 2, needsSync: true });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.reorderTasks([taskA, taskB]);
      const upserted = getUpsertedTasks();
      expect(upserted[0].needsSync).toBe(false); // не изменился
      expect(upserted[1].needsSync).toBe(true); // изменился с 2 на 1
    });

    it("should not call bulkUpsert when all tasks keep their positions", async () => {
      const taskA = buildTask({ sort_order: 0, needsSync: false });
      const taskB = buildTask({ sort_order: 1, needsSync: false });
      const taskC = buildTask({ sort_order: 2, needsSync: false });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.reorderTasks([taskA, taskB, taskC]);
      expect(mockTaskRepository.bulkUpsert).not.toHaveBeenCalled();
    });
  });

  describe("getCompleted", () => {
    it("should return empty array when no completed tasks exist", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getCompleted();
      expect(tasks).toEqual([]);
    });

    it("should sort completed tasks by completed_at descending", async () => {
      const timestamp1 = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
      );
      const timestamp2 = toISOTimestamp(
        Temporal.Instant.from("2025-01-02T10:00:00.000Z"),
      );
      const timestamp3 = toISOTimestamp(
        Temporal.Instant.from("2025-01-03T10:00:00.000Z"),
      );
      const completedTasks = [
        buildTask({
          is_completed: true,
          completed_at: timestamp1,
        }),
        buildTask({
          is_completed: true,
          completed_at: timestamp3,
        }),
        buildTask({
          is_completed: true,
          completed_at: timestamp2,
        }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getCompleted: vi.fn().mockResolvedValue(completedTasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getCompleted();
      expect(tasks[0].completed_at).toBe(timestamp3);
      expect(tasks[1].completed_at).toBe(timestamp2);
      expect(tasks[2].completed_at).toBe(timestamp1);
    });

    it("should sort by sort_order descending when completed_at is empty", async () => {
      const completedTasks = [
        buildTask({ is_completed: true, completed_at: "", sort_order: 1 }),
        buildTask({ is_completed: true, completed_at: "", sort_order: 3 }),
        buildTask({ is_completed: true, completed_at: "", sort_order: 2 }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getCompleted: vi.fn().mockResolvedValue(completedTasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getCompleted();
      expect(tasks[0].sort_order).toBe(3);
      expect(tasks[1].sort_order).toBe(2);
      expect(tasks[2].sort_order).toBe(1);
    });

    it("should sort by sort_order when only one task has completed_at", async () => {
      const taskWithDate = buildTask({
        is_completed: true,
        completed_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
        ),
        sort_order: 1,
      });
      const taskWithoutDate = buildTask({
        is_completed: true,
        completed_at: "",
        sort_order: 10,
      });
      mockTaskRepository = createMockTaskRepository({
        getCompleted: vi
          .fn()
          .mockResolvedValue([taskWithDate, taskWithoutDate]),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getCompleted();
      expect(tasks[0].sort_order).toBe(10);
      expect(tasks[1].sort_order).toBe(1);
    });
  });

  describe("getByCategoryId", () => {
    it("should return empty array when no tasks for category", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getByCategoryId("cat-1");
      expect(tasks).toEqual([]);
    });

    it("should return tasks sorted by sort_order ascending", async () => {
      const categoryId = "cat-1";
      const unsortedTasks = [
        buildTask({ category_id: categoryId, sort_order: 3 }),
        buildTask({ category_id: categoryId, sort_order: 1 }),
        buildTask({ category_id: categoryId, sort_order: 2 }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getByCategoryId: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getByCategoryId(categoryId);
      expectSortedAscendingByOrder(tasks);
    });

    it("should call repository.getByCategoryId with the categoryId", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.getByCategoryId("cat-abc");
      expect(mockTaskRepository.getByCategoryId).toHaveBeenCalledWith(
        "cat-abc",
      );
    });
  });

  describe("getByContextId", () => {
    it("should return empty array when no tasks for context", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getByContextId("ctx-1");
      expect(tasks).toEqual([]);
    });

    it("should return tasks sorted by sort_order ascending", async () => {
      const contextId = "ctx-1";
      const unsortedTasks = [
        buildTask({ context_id: contextId, sort_order: 3 }),
        buildTask({ context_id: contextId, sort_order: 1 }),
        buildTask({ context_id: contextId, sort_order: 2 }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getByContextId: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const tasks = await taskService.getByContextId(contextId);
      expectSortedAscendingByOrder(tasks);
    });

    it("should call repository.getByContextId with the contextId", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.getByContextId("ctx-abc");
      expect(mockTaskRepository.getByContextId).toHaveBeenCalledWith("ctx-abc");
    });
  });

  describe("getCategoryTaskCounts", () => {
    it("should return empty object when no active incomplete tasks", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const counts = await taskService.getCategoryTaskCounts();
      expect(counts).toEqual({});
    });

    it("should count tasks per category_id", async () => {
      const tasks = [
        buildTask({ category_id: "cat-1" }),
        buildTask({ category_id: "cat-1" }),
        buildTask({ category_id: "cat-2" }),
        buildTask({ category_id: "" }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const counts = await taskService.getCategoryTaskCounts();
      expect(counts["cat-1"]).toBe(2);
      expect(counts["cat-2"]).toBe(1);
      expect(counts[""]).toBeUndefined();
    });
  });

  describe("getContextTaskCounts", () => {
    it("should return empty object when no active incomplete tasks", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const counts = await taskService.getContextTaskCounts();
      expect(counts).toEqual({});
    });

    it("should count tasks per context_id", async () => {
      const tasks = [
        buildTask({ context_id: "ctx-1" }),
        buildTask({ context_id: "ctx-1" }),
        buildTask({ context_id: "ctx-2" }),
        buildTask({ context_id: "" }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const counts = await taskService.getContextTaskCounts();
      expect(counts["ctx-1"]).toBe(2);
      expect(counts["ctx-2"]).toBe(1);
      expect(counts[""]).toBeUndefined();
    });
  });

  describe("getGoalTaskCounts", () => {
    it("should return empty object when no active incomplete tasks", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const counts = await taskService.getGoalTaskCounts();
      expect(counts).toEqual({});
    });

    it("should count tasks per goal_id", async () => {
      const tasks = [
        buildTask({ goal_id: "goal-1" }),
        buildTask({ goal_id: "goal-1" }),
        buildTask({ goal_id: "goal-2" }),
        buildTask({ goal_id: "" }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const counts = await taskService.getGoalTaskCounts();
      expect(counts["goal-1"]).toBe(2);
      expect(counts["goal-2"]).toBe(1);
      expect(counts[""]).toBeUndefined();
    });

    it("should not include tasks with empty goal_id in counts", async () => {
      const tasks = [buildTask({ goal_id: "" }), buildTask({ goal_id: "" })];
      mockTaskRepository = createMockTaskRepository({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const counts = await taskService.getGoalTaskCounts();
      expect(Object.keys(counts)).toHaveLength(0);
    });
  });

  describe("searchByName", () => {
    const setupSearchTest = async (
      tasks: Task[],
      query: string,
    ): Promise<Task[]> => {
      mockTaskRepository = createMockTaskRepository({
        getActive: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      return await taskService.searchByName(query);
    };

    it("should return empty array when no tasks match", async () => {
      const tasks = [buildTask({ name: "Buy groceries" })];
      const results = await setupSearchTest(tasks, "nonexistent");
      expect(results).toEqual([]);
    });

    it("should return matching tasks case-insensitively", async () => {
      const tasks = [
        buildTask({ name: "Buy groceries" }),
        buildTask({ name: "Call dentist" }),
        buildTask({ name: "Buy medicine" }),
      ];
      const results = await setupSearchTest(tasks, "buy");
      expect(results).toHaveLength(2);
    });

    it("should return tasks whose description contain the query", async () => {
      const matchingTask = buildTask({
        name: "Project meeting",
        description: "Discuss budget allocation",
      });
      const nonMatchingTask = buildTask({
        name: "Shopping",
        description: "Buy groceries",
      });
      const results = await setupSearchTest(
        [matchingTask, nonMatchingTask],
        "budget",
      );
      expect(results).toEqual([matchingTask]);
    });

    it("should return tasks matching in either name or description", async () => {
      const matchInName = buildTask({
        name: "Budget review",
        description: "Quarterly report",
      });
      const matchInDescription = buildTask({
        name: "Team meeting",
        description: "Review budget proposals",
      });
      const noMatch = buildTask({ name: "Lunch", description: "Restaurant" });
      const results = await setupSearchTest(
        [matchInName, matchInDescription, noMatch],
        "budget",
      );
      expect(results).toHaveLength(2);
      expect(results).toContain(matchInName);
      expect(results).toContain(matchInDescription);
    });

    it("should match case-insensitively in description", async () => {
      const task = buildTask({
        name: "Meeting",
        description: "Discuss Budget",
      });
      const results = await setupSearchTest([task], "budget");
      expect(results).toHaveLength(1);
    });

    it.each([
      { isCompleted: false, label: "incomplete" },
      { isCompleted: true, label: "completed" },
    ])("should sort $label tasks by updated_at descending", async ({
      isCompleted,
    }) => {
      const timestamp1 = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
      );
      const timestamp2 = toISOTimestamp(
        Temporal.Instant.from("2025-01-02T10:00:00.000Z"),
      );
      const timestamp3 = toISOTimestamp(
        Temporal.Instant.from("2025-01-03T10:00:00.000Z"),
      );
      const tasks = [
        buildTask({
          name: "Task A",
          is_completed: isCompleted,
          updated_at: timestamp1,
        }),
        buildTask({
          name: "Task B",
          is_completed: isCompleted,
          updated_at: timestamp3,
        }),
        buildTask({
          name: "Task C",
          is_completed: isCompleted,
          updated_at: timestamp2,
        }),
      ];
      const results = await setupSearchTest(tasks, "task");
      expect(results[0].updated_at).toBe(timestamp3);
      expect(results[1].updated_at).toBe(timestamp2);
      expect(results[2].updated_at).toBe(timestamp1);
    });

    it("should place incomplete tasks before completed tasks", async () => {
      const completedTask = buildTask({
        name: "Task A",
        is_completed: true,
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-03T10:00:00.000Z"),
        ),
      });
      const incompleteTask = buildTask({
        name: "Task B",
        is_completed: false,
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
        ),
      });
      const results = await setupSearchTest(
        [completedTask, incompleteTask],
        "task",
      );
      expect(results[0].is_completed).toBe(false);
      expect(results[1].is_completed).toBe(true);
    });
  });

  describe("duplicate", () => {
    const setupDuplicateTest = async (
      taskOverrides: Partial<Task> = {},
      checklistItems: ChecklistItem[] = [],
    ) => {
      const originalTask = buildTask(taskOverrides);
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(originalTask),
      });
      mockChecklistRepository = createMockChecklistRepository({
        getByTaskId: vi.fn().mockResolvedValue(checklistItems),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await taskService.duplicate(originalTask.id);
      return originalTask;
    };

    it("should throw when task not found", async () => {
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      await expect(taskService.duplicate("nonexistent")).rejects.toThrow(
        "Task not found: nonexistent",
      );
    });

    it("should create new task with copied name", async () => {
      await setupDuplicateTest({ name: "Original task" });
      const createdTask = getCreatedTask();
      expect(createdTask.name).toBe("Original task");
    });

    it("should create new task with copied box", async () => {
      await setupDuplicateTest({ box: "today" });
      const createdTask = getCreatedTask();
      expect(createdTask.box).toBe("today");
    });

    it("should create new task with copied description", async () => {
      await setupDuplicateTest({ description: "Important description" });
      const createdTask = getCreatedTask();
      expect(createdTask.description).toBe("Important description");
    });

    it("should create new task with copied goal_id", async () => {
      await setupDuplicateTest({ goal_id: "goal-123" });
      const createdTask = getCreatedTask();
      expect(createdTask.goal_id).toBe("goal-123");
    });

    it("should create new task with copied context_id", async () => {
      await setupDuplicateTest({ context_id: "ctx-456" });
      const createdTask = getCreatedTask();
      expect(createdTask.context_id).toBe("ctx-456");
    });

    it("should create new task with copied category_id", async () => {
      await setupDuplicateTest({ category_id: "cat-789" });
      const createdTask = getCreatedTask();
      expect(createdTask.category_id).toBe("cat-789");
    });

    it("should create new task with copied repeat_rule", async () => {
      const repeatRule = JSON.stringify({ type: "weekly" });
      await setupDuplicateTest({ repeat_rule: repeatRule });
      const createdTask = getCreatedTask();
      expect(createdTask.repeat_rule).toBe(repeatRule);
    });

    it("should create new task with different id", async () => {
      const originalTask = await setupDuplicateTest();
      const createdTask = getCreatedTask();
      expect(createdTask.id).not.toBe(originalTask.id);
    });

    it("should return the newly created task", async () => {
      const originalTask = buildTask({ name: "Test task" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(originalTask),
      });
      const taskService = new TaskService(
        mockTaskRepository,
        mockChecklistRepository,
      );
      const duplicatedTask = await taskService.duplicate(originalTask.id);
      expect(duplicatedTask.name).toBe("Test task");
      expect(duplicatedTask.id).toBeDefined();
    });

    it("should copy checklist items when task has checklist", async () => {
      const originalTask = buildTask();
      const checklistItems = [
        buildChecklistItem({ task_id: originalTask.id }),
        buildChecklistItem({ task_id: originalTask.id }),
      ];
      await setupDuplicateTest({}, checklistItems);
      expect(mockChecklistRepository.create).toHaveBeenCalledTimes(2);
    });

    it("should copy checklist items with new task_id", async () => {
      const originalTask = buildTask();
      const originalItem = buildChecklistItem({ task_id: originalTask.id });
      await setupDuplicateTest({}, [originalItem]);
      const createdTask = getCreatedTask();
      const copiedItem = getCreatedItem();
      expect(copiedItem.task_id).toBe(createdTask.id);
    });

    it("should copy checklist items with preserved name", async () => {
      const originalTask = buildTask();
      const originalItem = buildChecklistItem({
        task_id: originalTask.id,
        name: "Checklist item name",
      });
      await setupDuplicateTest({}, [originalItem]);
      const copiedItem = getCreatedItem();
      expect(copiedItem.name).toBe("Checklist item name");
    });

    it("should copy checklist items with preserved sort_order", async () => {
      const originalTask = buildTask();
      const originalItem = buildChecklistItem({
        task_id: originalTask.id,
        sort_order: 5,
      });
      await setupDuplicateTest({}, [originalItem]);
      const copiedItem = getCreatedItem();
      expect(copiedItem.sort_order).toBe(5);
    });

    it("should not copy checklist items when task has no checklist", async () => {
      await setupDuplicateTest({}, []);
      expect(mockChecklistRepository.create).not.toHaveBeenCalled();
    });
  });
});
