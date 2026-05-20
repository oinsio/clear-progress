import { describe, expect, it, vi } from "vitest";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildTask } from "@/test/factories/taskFactory";
import type { ChecklistItem, Task } from "@/types/entities";
import {
  createTestContext,
  getCreatedItem,
  getCreatedTask,
} from "./TaskService-test-utils";

describe("TaskService", () => {
  describe("duplicate", () => {
    const setupDuplicateTest = async (
      taskOverrides: Partial<Task> = {},
      checklistItems: ChecklistItem[] = [],
    ) => {
      const originalTask = buildTask(taskOverrides);
      const context = createTestContext(
        { getById: vi.fn().mockResolvedValue(originalTask) },
        { getByTaskId: vi.fn().mockResolvedValue(checklistItems) },
      );
      await context.taskService.duplicate(originalTask.id);
      return { originalTask, ...context };
    };

    it("should throw when task not found", async () => {
      const { taskService } = createTestContext();
      await expect(taskService.duplicate("nonexistent")).rejects.toThrow(
        "Task not found: nonexistent",
      );
    });

    it("should create new task with copied name", async () => {
      const { mockTaskRepository } = await setupDuplicateTest({
        name: "Original task",
      });
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.name).toBe("Original task");
    });

    it("should create new task with copied box", async () => {
      const { mockTaskRepository } = await setupDuplicateTest({
        box: "today",
      });
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.box).toBe("today");
    });

    it("should create new task with copied description", async () => {
      const { mockTaskRepository } = await setupDuplicateTest({
        description: "Important description",
      });
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.description).toBe("Important description");
    });

    it("should create new task with copied goal_id", async () => {
      const { mockTaskRepository } = await setupDuplicateTest({
        goal_id: "goal-123",
      });
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.goal_id).toBe("goal-123");
    });

    it("should create new task with copied context_id", async () => {
      const { mockTaskRepository } = await setupDuplicateTest({
        context_id: "ctx-456",
      });
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.context_id).toBe("ctx-456");
    });

    it("should create new task with copied category_id", async () => {
      const { mockTaskRepository } = await setupDuplicateTest({
        category_id: "cat-789",
      });
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.category_id).toBe("cat-789");
    });

    it("should create new task with copied repeat_rule", async () => {
      const repeatRule = JSON.stringify({ type: "weekly" });
      const { mockTaskRepository } = await setupDuplicateTest({
        repeat_rule: repeatRule,
      });
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.repeat_rule).toBe(repeatRule);
    });

    it("should create new task with different id", async () => {
      const { originalTask, mockTaskRepository } = await setupDuplicateTest();
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.id).not.toBe(originalTask.id);
    });

    it("should return the newly created task", async () => {
      const originalTask = buildTask({ name: "Test task" });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(originalTask),
      });
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
      const { mockChecklistRepository } = await setupDuplicateTest(
        {},
        checklistItems,
      );
      expect(mockChecklistRepository.create).toHaveBeenCalledTimes(2);
    });

    it("should copy checklist items with new task_id", async () => {
      const originalTask = buildTask();
      const originalItem = buildChecklistItem({ task_id: originalTask.id });
      const { mockTaskRepository, mockChecklistRepository } =
        await setupDuplicateTest({}, [originalItem]);
      const createdTask = getCreatedTask(mockTaskRepository);
      const copiedItem = getCreatedItem(mockChecklistRepository);
      expect(copiedItem.task_id).toBe(createdTask.id);
    });

    it("should copy checklist items with preserved name", async () => {
      const originalTask = buildTask();
      const originalItem = buildChecklistItem({
        task_id: originalTask.id,
        name: "Checklist item name",
      });
      const { mockChecklistRepository } = await setupDuplicateTest({}, [
        originalItem,
      ]);
      const copiedItem = getCreatedItem(mockChecklistRepository);
      expect(copiedItem.name).toBe("Checklist item name");
    });

    it("should copy checklist items with preserved sort_order", async () => {
      const originalTask = buildTask();
      const originalItem = buildChecklistItem({
        task_id: originalTask.id,
        sort_order: 5,
      });
      const { mockChecklistRepository } = await setupDuplicateTest({}, [
        originalItem,
      ]);
      const copiedItem = getCreatedItem(mockChecklistRepository);
      expect(copiedItem.sort_order).toBe(5);
    });

    it("should not copy checklist items when task has no checklist", async () => {
      const { mockChecklistRepository } = await setupDuplicateTest({}, []);
      expect(mockChecklistRepository.create).not.toHaveBeenCalled();
    });
  });
});
