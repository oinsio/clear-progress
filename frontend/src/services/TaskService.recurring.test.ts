import { describe, it, expect, beforeEach, vi } from "vitest";
import { TaskService } from "./TaskService";
import type { ChecklistItem } from "@/types/entities";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { buildTask } from "@/test/factories/taskFactory";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { createMockTaskRepository } from "@/test/mocks/taskRepositoryMock";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";

const setupCompletionMocks = (
  mockTaskRepository: TaskRepository,
  mockChecklistRepository: ChecklistRepository,
  existingTask: ReturnType<typeof buildTask>,
  completedTask: ReturnType<typeof buildTask>,
  recurringTask: ReturnType<typeof buildTask> | null,
  checklistItems: ChecklistItem[] = [],
) => {
  mockTaskRepository.getById = vi.fn().mockResolvedValue(existingTask);
  mockTaskRepository.update = vi.fn().mockResolvedValue(completedTask);
  mockTaskRepository.create = vi.fn().mockResolvedValue(recurringTask);
  mockTaskRepository.findHiddenRecurringTask = vi
    .fn()
    .mockResolvedValue(undefined);
  mockChecklistRepository.getByTaskId = vi
    .fn()
    .mockResolvedValue(checklistItems);
};

const setupCreateTaskCapture = (
  mockTaskRepository: TaskRepository,
  existingTask: ReturnType<typeof buildTask>,
  completedTask: ReturnType<typeof buildTask>,
  mockChecklistRepository: ChecklistRepository,
) => {
  let createdTask: ReturnType<typeof buildTask> | null = null;
  mockTaskRepository.getById = vi.fn().mockResolvedValue(existingTask);
  mockTaskRepository.update = vi.fn().mockResolvedValue(completedTask);
  mockTaskRepository.create = vi.fn().mockImplementation(async (task) => {
    createdTask = task;
    return task;
  });
  mockTaskRepository.findHiddenRecurringTask = vi
    .fn()
    .mockResolvedValue(undefined);
  mockChecklistRepository.getByTaskId = vi.fn().mockResolvedValue([]);
  return () => createdTask;
};

const setupUpdateTaskCapture = (
  mockTaskRepository: TaskRepository,
  tasksById: Record<string, ReturnType<typeof buildTask>>,
  mockChecklistRepository: ChecklistRepository,
  existingHiddenCopy?: ReturnType<typeof buildTask>,
) => {
  let updatedCopyTask: ReturnType<typeof buildTask> | null = null;
  mockTaskRepository.getById = vi
    .fn()
    .mockImplementation(async (id) => tasksById[id]);
  mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
    if (task.id === existingHiddenCopy?.id) {
      updatedCopyTask = task;
    }
    return task;
  });
  mockTaskRepository.create = vi.fn();
  mockTaskRepository.findHiddenRecurringTask = vi
    .fn()
    .mockResolvedValue(existingHiddenCopy);
  mockChecklistRepository.getByTaskId = vi.fn().mockResolvedValue([]);
  return () => updatedCopyTask;
};

describe("TaskService - Recurring Tasks Integration", () => {
  let taskService: TaskService;
  let mockTaskRepository: TaskRepository;
  let mockChecklistRepository: ChecklistRepository;

  beforeEach(() => {
    mockTaskRepository = createMockTaskRepository();
    mockChecklistRepository = createMockChecklistRepository();
    taskService = new TaskService(mockTaskRepository, mockChecklistRepository);
    vi.clearAllMocks();
  });

  describe("Creating recurring task", () => {
    it("should create task with repeat_rule", async () => {
      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 0,
      };

      const taskData = {
        name: "Daily review",
        description: "",
        box: "today" as const,
        repeat_rule: JSON.stringify(repeatRule),
      };

      const createdTask = buildTask({
        ...taskData,
        is_hidden: false,
        next_date: "",
        appear_date: "",
      });

      mockTaskRepository.create = vi.fn().mockResolvedValue(createdTask);

      const task = await taskService.create(taskData);

      expect(task).toBeDefined();
      expect(task.repeat_rule).toBe(JSON.stringify(repeatRule));
    });
  });

  describe("Completing recurring task", () => {
    it("should create hidden clone when completing task with repeat_rule", async () => {
      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 0,
      };

      const existingTask = buildTask({
        id: "task-1",
        name: "Daily review",
        repeat_rule: JSON.stringify(repeatRule),
        is_hidden: false,
        next_date: "2026-04-13",
        appear_date: "2026-04-13",
      });

      const completedTask = buildTask({
        ...existingTask,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      const recurringTask = buildTask({
        name: "Daily review",
        repeat_rule: JSON.stringify(repeatRule),
        is_hidden: true,
        next_date: "2026-04-14",
        appear_date: "2026-04-14",
        box: "today",
      });

      setupCompletionMocks(
        mockTaskRepository,
        mockChecklistRepository,
        existingTask,
        completedTask,
        recurringTask,
      );

      const result = await taskService.complete("task-1");

      expect(result.completed).toBeDefined();
      expect(result.completed.is_completed).toBe(true);
      expect(result.recurring).toBeDefined();
      expect(result.recurring?.is_hidden).toBe(true);
      expect(result.recurring?.next_date).toBeTruthy();
      expect(result.recurring?.appear_date).toBeTruthy();
    });

    it("should not create clone when completing task without repeat_rule", async () => {
      const existingTask = buildTask({
        id: "task-1",
        name: "One-time task",
        repeat_rule: "",
        is_hidden: false,
        next_date: "",
        appear_date: "",
      });

      const completedTask = buildTask({
        ...existingTask,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      mockTaskRepository.getById = vi.fn().mockResolvedValue(existingTask);
      mockTaskRepository.update = vi.fn().mockResolvedValue(completedTask);

      const result = await taskService.complete("task-1");

      expect(result.completed).toBeDefined();
      expect(result.completed.is_completed).toBe(true);
      expect(result.recurring).toBeNull();
    });

    it("should handle after_completion type repeat_rule", async () => {
      const repeatRule = {
        type: "after_completion" as const,
        delay_days: 7,
        target_box: "week" as const,
        advance_days: 2,
      };

      const existingTask = buildTask({
        id: "task-1",
        name: "Water plants",
        repeat_rule: JSON.stringify(repeatRule),
        is_hidden: false,
        next_date: "",
        appear_date: "",
      });

      const completedTask = buildTask({
        ...existingTask,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      const recurringTask = buildTask({
        name: "Water plants",
        repeat_rule: JSON.stringify(repeatRule),
        is_hidden: true,
        box: "week",
      });

      setupCompletionMocks(
        mockTaskRepository,
        mockChecklistRepository,
        existingTask,
        completedTask,
        recurringTask,
      );

      const result = await taskService.complete("task-1");

      expect(result.recurring).toBeDefined();
      expect(result.recurring?.is_hidden).toBe(true);
      expect(result.recurring?.box).toBe("week");
    });

    it("should not fail completion if recurring copy creation fails", async () => {
      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 0,
      };

      const existingTask = buildTask({
        id: "task-1",
        name: "Daily review",
        repeat_rule: JSON.stringify(repeatRule),
        is_hidden: false,
        next_date: "2026-04-13",
        appear_date: "2026-04-13",
      });

      const completedTask = buildTask({
        ...existingTask,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      mockTaskRepository.getById = vi.fn().mockResolvedValue(existingTask);
      mockTaskRepository.update = vi.fn().mockResolvedValue(completedTask);
      mockTaskRepository.create = vi
        .fn()
        .mockRejectedValue(new Error("DB error"));
      mockChecklistRepository.getByTaskId = vi.fn().mockResolvedValue([]);

      const result = await taskService.complete("task-1");

      // Completion should succeed even if clone creation fails
      expect(result.completed).toBeDefined();
      expect(result.completed.is_completed).toBe(true);
      expect(result.recurring).toBeNull();
    });
  });

  describe("Completing hidden clone", () => {
    it("should create new hidden clone when completing a hidden task", async () => {
      const repeatRule = {
        type: "fixed" as const,
        frequency: "weekly" as const,
        interval: 1,
        weekdays: [1, 3, 5],
        target_box: "today" as const,
        advance_days: 0,
      };

      const hiddenTask = buildTask({
        id: "task-2",
        name: "Weekly review",
        repeat_rule: JSON.stringify(repeatRule),
        is_hidden: true,
        next_date: "2026-04-14",
        appear_date: "2026-04-14",
      });

      const completedTask = buildTask({
        ...hiddenTask,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      const newRecurringTask = buildTask({
        name: "Weekly review",
        repeat_rule: JSON.stringify(repeatRule),
        is_hidden: true,
      });

      setupCompletionMocks(
        mockTaskRepository,
        mockChecklistRepository,
        hiddenTask,
        completedTask,
        newRecurringTask,
      );

      const result = await taskService.complete("task-2");

      expect(result.completed).toBeDefined();
      expect(result.completed.is_completed).toBe(true);
      expect(result.recurring).toBeDefined();
      expect(result.recurring?.is_hidden).toBe(true);
    });
  });

  describe("Checklist items copying", () => {
    it("should copy checklist items to recurring clone", async () => {
      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 0,
      };

      const existingTask = buildTask({
        id: "task-1",
        name: "Daily review",
        repeat_rule: JSON.stringify(repeatRule),
        is_hidden: false,
        next_date: "2026-04-13",
        appear_date: "2026-04-13",
      });

      const checklistItems = [
        buildChecklistItem({
          id: "item-1",
          task_id: "task-1",
          name: "Check email",
          is_completed: false,
        }),
      ];

      const completedTask = buildTask({
        ...existingTask,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      const recurringTask = buildTask({
        id: "task-2",
        name: "Daily review",
        repeat_rule: JSON.stringify(repeatRule),
        is_hidden: true,
      });

      setupCompletionMocks(
        mockTaskRepository,
        mockChecklistRepository,
        existingTask,
        completedTask,
        recurringTask,
        checklistItems,
      );
      mockChecklistRepository.create = vi.fn().mockResolvedValue(
        buildChecklistItem({
          id: "item-2",
          task_id: "task-2",
          name: "Check email",
        }),
      );

      const result = await taskService.complete("task-1");

      expect(result.recurring).toBeDefined();
      expect(mockChecklistRepository.create).toHaveBeenCalled();
    });
  });

  describe("original_task_id handling", () => {
    it("should set original_task_id when creating recurring copy", async () => {
      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 0,
      };

      const existingTask = buildTask({
        id: "task-1",
        name: "Daily review",
        repeat_rule: JSON.stringify(repeatRule),
        original_task_id: "",
        is_hidden: false,
        next_date: "2026-04-13",
        appear_date: "2026-04-13",
      });

      const completedTask = buildTask({
        ...existingTask,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      const getCreatedTask = setupCreateTaskCapture(
        mockTaskRepository,
        existingTask,
        completedTask,
        mockChecklistRepository,
      );

      await taskService.complete("task-1");

      const createdTask = getCreatedTask();
      expect(createdTask).toBeDefined();
      expect(createdTask!.original_task_id).toBe("task-1");
    });

    it("should preserve original_task_id when completing a copy", async () => {
      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 0,
      };

      const hiddenCopy = buildTask({
        id: "task-2",
        name: "Daily review",
        repeat_rule: JSON.stringify(repeatRule),
        original_task_id: "task-1",
        is_hidden: false,
        next_date: "2026-04-14",
        appear_date: "2026-04-14",
      });

      const completedCopy = buildTask({
        ...hiddenCopy,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

      const getCreatedTask = setupCreateTaskCapture(
        mockTaskRepository,
        hiddenCopy,
        completedCopy,
        mockChecklistRepository,
      );

      await taskService.complete("task-2");

      const createdTask = getCreatedTask();
      expect(createdTask).toBeDefined();
      expect(createdTask!.original_task_id).toBe("task-1");
    });

    it("should not create duplicate when hidden copy already exists", async () => {
      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 0,
      };

      const existingTask = buildTask({
        id: "task-1",
        name: "Daily review",
        description: "Old description",
        repeat_rule: JSON.stringify(repeatRule),
        original_task_id: "",
        is_hidden: false,
        next_date: "2026-04-13",
        appear_date: "2026-04-13",
      });

      const existingHiddenCopy = buildTask({
        id: "task-2",
        name: "Old name",
        description: "Old description",
        repeat_rule: JSON.stringify(repeatRule),
        original_task_id: "task-1",
        is_hidden: true,
        next_date: "2026-04-14",
        appear_date: "2026-04-14",
      });

      const getUpdatedCopyTask = setupUpdateTaskCapture(
        mockTaskRepository,
        { "task-1": existingTask, "task-2": existingHiddenCopy },
        mockChecklistRepository,
        existingHiddenCopy,
      );

      await taskService.complete("task-1");

      expect(mockTaskRepository.create).not.toHaveBeenCalled();
      const updatedCopyTask = getUpdatedCopyTask();
      expect(updatedCopyTask).toBeDefined();
      expect(updatedCopyTask!.name).toBe("Daily review");
      expect(updatedCopyTask!.description).toBe("Old description");
    });

    it("should update all fields in existing hidden copy", async () => {
      const repeatRule = {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 0,
      };

      const existingTask = buildTask({
        id: "task-1",
        name: "Updated name",
        description: "Updated description",
        goal_id: "goal-1",
        context_id: "context-1",
        category_id: "category-1",
        repeat_rule: JSON.stringify(repeatRule),
        original_task_id: "",
        is_hidden: false,
        next_date: "2026-04-13",
        appear_date: "2026-04-13",
      });

      const existingHiddenCopy = buildTask({
        id: "task-2",
        name: "Old name",
        description: "Old description",
        goal_id: "",
        context_id: "",
        category_id: "",
        repeat_rule: JSON.stringify(repeatRule),
        original_task_id: "task-1",
        is_hidden: true,
        next_date: "2026-04-14",
        appear_date: "2026-04-14",
      });

      const getUpdatedCopyTask = setupUpdateTaskCapture(
        mockTaskRepository,
        { "task-1": existingTask, "task-2": existingHiddenCopy },
        mockChecklistRepository,
        existingHiddenCopy,
      );

      await taskService.complete("task-1");

      const updatedCopyTask = getUpdatedCopyTask();
      expect(updatedCopyTask).toBeDefined();
      expect(updatedCopyTask!.name).toBe("Updated name");
      expect(updatedCopyTask!.description).toBe("Updated description");
      expect(updatedCopyTask!.goal_id).toBe("goal-1");
      expect(updatedCopyTask!.context_id).toBe("context-1");
      expect(updatedCopyTask!.category_id).toBe("category-1");
    });
  });

  describe("softDelete with original_task_id", () => {
    it("should reassign copies when deleting original task", async () => {
      const originalTask = buildTask({
        id: "task-1",
        name: "Original",
        original_task_id: "",
      });

      const copy1 = buildTask({
        id: "task-2",
        name: "Copy 1",
        original_task_id: "task-1",
        is_deleted: false,
      });

      const copy2 = buildTask({
        id: "task-3",
        name: "Copy 2",
        original_task_id: "task-1",
        is_deleted: false,
      });

      const updates: Record<string, ReturnType<typeof buildTask>> = {};

      mockTaskRepository.getById = vi.fn().mockImplementation(async (id) => {
        if (id === "task-1") return originalTask;
        if (id === "task-2") return copy1;
        if (id === "task-3") return copy2;
        return undefined;
      });
      mockTaskRepository.findByOriginalTaskId = vi
        .fn()
        .mockResolvedValue([copy1, copy2]);
      mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
        updates[task.id] = task;
        return task;
      });

      await taskService.softDelete("task-1");

      expect(mockTaskRepository.findByOriginalTaskId).toHaveBeenCalledWith(
        "task-1",
      );
      expect(updates["task-2"].original_task_id).toBe("");
      expect(updates["task-3"].original_task_id).toBe("task-2");
      expect(updates["task-1"].is_deleted).toBe(true);
    });

    it("should handle deletion when no copies exist", async () => {
      const originalTask = buildTask({
        id: "task-1",
        name: "Original",
        original_task_id: "",
      });

      let deletedTask: ReturnType<typeof buildTask> | null = null;
      mockTaskRepository.getById = vi.fn().mockResolvedValue(originalTask);
      mockTaskRepository.findByOriginalTaskId = vi.fn().mockResolvedValue([]);
      mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
        deletedTask = task;
        return task;
      });

      await taskService.softDelete("task-1");

      expect(deletedTask).toBeDefined();
      expect(deletedTask!.is_deleted).toBe(true);
    });

    it("should skip deleted copies when reassigning", async () => {
      const originalTask = buildTask({
        id: "task-1",
        name: "Original",
        original_task_id: "",
      });

      const deletedCopy = buildTask({
        id: "task-2",
        name: "Deleted Copy",
        original_task_id: "task-1",
        is_deleted: true,
      });

      const activeCopy = buildTask({
        id: "task-3",
        name: "Active Copy",
        original_task_id: "task-1",
        is_deleted: false,
      });

      const updates: Record<string, ReturnType<typeof buildTask>> = {};

      mockTaskRepository.getById = vi.fn().mockImplementation(async (id) => {
        if (id === "task-1") return originalTask;
        if (id === "task-2") return deletedCopy;
        if (id === "task-3") return activeCopy;
        return undefined;
      });
      mockTaskRepository.findByOriginalTaskId = vi
        .fn()
        .mockResolvedValue([deletedCopy, activeCopy]);
      mockTaskRepository.update = vi.fn().mockImplementation(async (task) => {
        updates[task.id] = task;
        return task;
      });

      await taskService.softDelete("task-1");

      expect(updates["task-3"].original_task_id).toBe("");
      expect(updates["task-2"].original_task_id).toBe("task-3");
    });
  });
});
