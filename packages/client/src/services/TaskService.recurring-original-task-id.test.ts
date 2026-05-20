import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskRepository } from "@/test/mocks/taskRepositoryMock";
import { toISODate, toISOTimestamp } from "@/utils/dateHelpers";
import { TaskService } from "./TaskService";
import {
  setupCreateTaskCapture,
  setupUpdateTaskCapture,
} from "./TaskService.recurring-test-helpers";

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
        next_date: toISODate("2026-04-13"),
        appear_date: toISODate("2026-04-13"),
      });

      const completedTask = buildTask({
        ...existingTask,
        is_completed: true,
        completed_at: toISOTimestamp(),
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
      expect(createdTask?.original_task_id).toBe("task-1");
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
        next_date: toISODate("2026-04-14"),
        appear_date: toISODate("2026-04-14"),
      });

      const completedCopy = buildTask({
        ...hiddenCopy,
        is_completed: true,
        completed_at: toISOTimestamp(),
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
      expect(createdTask?.original_task_id).toBe("task-1");
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
        next_date: toISODate("2026-04-13"),
        appear_date: toISODate("2026-04-13"),
      });

      const existingHiddenCopy = buildTask({
        id: "task-2",
        name: "Old name",
        description: "Old description",
        repeat_rule: JSON.stringify(repeatRule),
        original_task_id: "task-1",
        is_hidden: true,
        next_date: toISODate("2026-04-14"),
        appear_date: toISODate("2026-04-14"),
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
      expect(updatedCopyTask?.name).toBe("Daily review");
      expect(updatedCopyTask?.description).toBe("Old description");
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
        next_date: toISODate("2026-04-13"),
        appear_date: toISODate("2026-04-13"),
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
        next_date: toISODate("2026-04-14"),
        appear_date: toISODate("2026-04-14"),
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
      expect(updatedCopyTask?.name).toBe("Updated name");
      expect(updatedCopyTask?.description).toBe("Updated description");
      expect(updatedCopyTask?.goal_id).toBe("goal-1");
      expect(updatedCopyTask?.context_id).toBe("context-1");
      expect(updatedCopyTask?.category_id).toBe("category-1");
    });
  });
});
