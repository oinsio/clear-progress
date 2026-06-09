import { describe, expect, it, vi } from "vitest";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildTask } from "@/test/factories/taskFactory";
import type { ChecklistItem } from "@/types/entities";
import {
  createTestContext,
  getCreatedItem,
  getCreatedTask,
} from "./TaskService-test-utils";

const DAILY_REPEAT_RULE = JSON.stringify({
  type: "fixed",
  frequency: "daily",
  interval: 1,
  target_box: "today",
  advance_days: 0,
});

function setupRecurringTaskWithItem(
  itemOverrides: Partial<ChecklistItem> = {},
) {
  const task = buildTask({ repeat_rule: DAILY_REPEAT_RULE });
  const originalItem = buildChecklistItem({
    task_id: task.id,
    ...itemOverrides,
  });
  const context = createTestContext(
    { getById: vi.fn().mockResolvedValue(task) },
    { getActiveByTaskId: vi.fn().mockResolvedValue([originalItem]) },
  );
  return { task, originalItem, ...context };
}

describe("TaskService", () => {
  describe("complete — checklist copying", () => {
    it("should copy checklist items to the recurring copy", async () => {
      const task = buildTask({ repeat_rule: DAILY_REPEAT_RULE });
      const checklistItems = [
        buildChecklistItem({ task_id: task.id }),
        buildChecklistItem({ task_id: task.id }),
      ];
      const { taskService, mockChecklistRepository } = createTestContext(
        { getById: vi.fn().mockResolvedValue(task) },
        { getActiveByTaskId: vi.fn().mockResolvedValue(checklistItems) },
      );
      await taskService.complete(task.id);
      expect(mockChecklistRepository.create).toHaveBeenCalledTimes(2);
    });

    it("should not copy checklist items when task has no checklist", async () => {
      const task = buildTask({ repeat_rule: DAILY_REPEAT_RULE });
      const { taskService, mockChecklistRepository } = createTestContext(
        { getById: vi.fn().mockResolvedValue(task) },
        { getActiveByTaskId: vi.fn().mockResolvedValue([]) },
      );
      await taskService.complete(task.id);
      expect(mockChecklistRepository.create).not.toHaveBeenCalled();
    });

    it("should copy checklist items with new unique ids", async () => {
      const { task, originalItem, taskService, mockChecklistRepository } =
        setupRecurringTaskWithItem();
      await taskService.complete(task.id);
      const copiedItem = getCreatedItem(mockChecklistRepository);
      expect(copiedItem.id).not.toBe(originalItem.id);
    });

    it("should copy checklist items with the new task id", async () => {
      const { task, taskService, mockTaskRepository, mockChecklistRepository } =
        setupRecurringTaskWithItem();
      await taskService.complete(task.id);
      const createdTask = getCreatedTask(mockTaskRepository);
      const copiedItem = getCreatedItem(mockChecklistRepository);
      expect(copiedItem.task_id).toBe(createdTask.id);
    });

    it("should copy checklist items with is_completed reset to false", async () => {
      const { task, taskService, mockChecklistRepository } =
        setupRecurringTaskWithItem({ is_completed: true });
      await taskService.complete(task.id);
      const copiedItem = getCreatedItem(mockChecklistRepository);
      expect(copiedItem.is_completed).toBe(false);
    });

    it("should copy checklist items with preserved name and sort_order", async () => {
      const { task, taskService, mockChecklistRepository } =
        setupRecurringTaskWithItem({ name: "Buy milk", sort_order: "a2" });
      await taskService.complete(task.id);
      const copiedItem = getCreatedItem(mockChecklistRepository);
      expect(copiedItem.name).toBe("Buy milk");
      expect(copiedItem.sort_order).toBe("a2");
    });

    it("should copy checklist items with needsSync true", async () => {
      const { task, taskService, mockChecklistRepository } =
        setupRecurringTaskWithItem();
      await taskService.complete(task.id);
      const copiedItem = getCreatedItem(mockChecklistRepository);
      expect(copiedItem.needsSync).toBe(true);
    });

    it("should NOT copy checklist items when repeat_rule is empty", async () => {
      const task = buildTask({ repeat_rule: "" });
      const item = buildChecklistItem({ task_id: task.id });
      const { taskService, mockChecklistRepository } = createTestContext(
        { getById: vi.fn().mockResolvedValue(task) },
        { getActiveByTaskId: vi.fn().mockResolvedValue([item]) },
      );
      await taskService.complete(task.id);
      expect(mockChecklistRepository.create).not.toHaveBeenCalled();
    });

    it("should call getActiveByTaskId when completing task with repeat_rule", async () => {
      const task = buildTask({ repeat_rule: DAILY_REPEAT_RULE });
      const { taskService, mockChecklistRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      await taskService.complete(task.id);
      expect(mockChecklistRepository.getActiveByTaskId).toHaveBeenCalledWith(
        task.id,
      );
    });
  });
});
