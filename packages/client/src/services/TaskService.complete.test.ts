import { describe, expect, it, vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { createTestContext, getCreatedTask } from "./TaskService-test-utils";

const DAILY_REPEAT_RULE = JSON.stringify({
  type: "fixed",
  frequency: "daily",
  interval: 1,
  target_box: "today",
  advance_days: 0,
});

describe("TaskService", () => {
  describe("complete", () => {
    it("should set is_completed to true", async () => {
      const task = buildTask({ is_completed: false });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const { completed } = await taskService.complete(task.id);
      expect(completed.is_completed).toBe(true);
    });

    it("should set completed_at to a non-empty ISO string", async () => {
      const task = buildTask({ completed_at: "" });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const { completed } = await taskService.complete(task.id);
      expect(completed.completed_at).not.toBe("");
    });

    it("should return not_recurring status when repeat_rule is empty", async () => {
      const task = buildTask({ repeat_rule: "" });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const { recurringResult } = await taskService.complete(task.id);
      expect(recurringResult.status).toBe("not_recurring");
    });

    it("should return skipped_invalid_rule status when repeat_rule is invalid JSON", async () => {
      const task = buildTask({ repeat_rule: "invalid json" });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const { recurringResult } = await taskService.complete(task.id);
      expect(recurringResult.status).toBe("skipped_invalid_rule");
    });

    it("should return skipped_invalid_rule status when parseRepeatRule returns null", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({ invalid: "rule" }),
      });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const { recurringResult } = await taskService.complete(task.id);
      expect(recurringResult.status).toBe("skipped_invalid_rule");
    });

    it("should return created status with the new task when repeat_rule is valid", async () => {
      const task = buildTask({ repeat_rule: DAILY_REPEAT_RULE });
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const { recurringResult } = await taskService.complete(task.id);
      expect(recurringResult.status).toBe("created");
      if (recurringResult.status === "created") {
        expect(recurringResult.task.id).not.toBe(task.id);
      }
    });

    it("should NOT create a recurring copy when repeat_rule is empty", async () => {
      const task = buildTask({ repeat_rule: "" });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      await taskService.complete(task.id);
      expect(mockTaskRepository.create).not.toHaveBeenCalled();
    });

    it("should not call findHiddenRecurringTask when repeat_rule is empty", async () => {
      const task = buildTask({ repeat_rule: "" });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      await taskService.complete(task.id);
      expect(mockTaskRepository.findHiddenRecurringTask).not.toHaveBeenCalled();
    });

    it("should create a recurring copy when repeat_rule is set", async () => {
      const task = buildTask({ repeat_rule: DAILY_REPEAT_RULE });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      await taskService.complete(task.id);
      expect(mockTaskRepository.create).toHaveBeenCalledOnce();
    });

    it("should create recurring copy with same name and box", async () => {
      const task = buildTask({
        name: "Daily standup",
        box: "today",
        repeat_rule: DAILY_REPEAT_RULE,
      });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      await taskService.complete(task.id);
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.name).toBe("Daily standup");
      expect(createdTask.box).toBe("today");
    });

    it("should use task.id as searchId when original_task_id is empty", async () => {
      const task = buildTask({
        id: "task-1",
        original_task_id: "",
        repeat_rule: DAILY_REPEAT_RULE,
      });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
        findHiddenRecurringTask: vi.fn().mockResolvedValue(undefined),
      });
      await taskService.complete(task.id);
      expect(mockTaskRepository.findHiddenRecurringTask).toHaveBeenCalledWith(
        "task-1",
      );
    });

    it("should use original_task_id as searchId when it is set", async () => {
      const task = buildTask({
        id: "task-2",
        original_task_id: "task-1",
        repeat_rule: DAILY_REPEAT_RULE,
      });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
        findHiddenRecurringTask: vi.fn().mockResolvedValue(undefined),
      });
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
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      await taskService.complete(task.id);
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.is_completed).toBe(false);
      expect(createdTask.completed_at).toBe("");
    });

    it("should create recurring copy with a new unique id", async () => {
      const task = buildTask({ repeat_rule: DAILY_REPEAT_RULE });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      await taskService.complete(task.id);
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.id).not.toBe(task.id);
    });

    it("should not call repository.update when task not found", async () => {
      const task = buildTask();
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(task),
      });
      await expect(taskService.complete("nonexistent")).rejects.toThrow();
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
    });

    it("should preserve repeat_rule in the recurring copy", async () => {
      const task = buildTask({ repeat_rule: DAILY_REPEAT_RULE });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      await taskService.complete(task.id);
      const createdTask = getCreatedTask(mockTaskRepository);
      expect(createdTask.repeat_rule).toBe(DAILY_REPEAT_RULE);
    });
  });
});
