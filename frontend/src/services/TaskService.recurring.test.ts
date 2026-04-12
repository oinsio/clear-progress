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
  mockChecklistRepository.getByTaskId = vi
    .fn()
    .mockResolvedValue(checklistItems);
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
      mockChecklistRepository.getByTaskId = vi
        .fn()
        .mockResolvedValue([]);

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
});
