import { describe, expect, it, vi } from "vitest";
import { BOX } from "@/constants";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import { createTestContext } from "./TaskService-test-utils";

function expectSortedAscendingByOrder(tasks: Task[]) {
  expect(tasks[0].sort_order).toBe(1);
  expect(tasks[1].sort_order).toBe(2);
  expect(tasks[2].sort_order).toBe(3);
}

describe("TaskService", () => {
  describe("getByBox", () => {
    it("should return empty array when box has no tasks", async () => {
      const { taskService } = createTestContext();
      const tasks = await taskService.getByBox(BOX.TODAY);
      expect(tasks).toEqual([]);
    });

    it("should return tasks sorted by sort_order ascending", async () => {
      const unsortedTasks = [
        buildTask({ box: "today", sort_order: 3 }),
        buildTask({ box: "today", sort_order: 1 }),
        buildTask({ box: "today", sort_order: 2 }),
      ];
      const { taskService } = createTestContext({
        getByBox: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const tasks = await taskService.getByBox(BOX.TODAY);
      expectSortedAscendingByOrder(tasks);
    });
  });

  describe("getById", () => {
    it("should return task when found", async () => {
      const task = buildTask();
      const { taskService } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });
      const result = await taskService.getById(task.id);
      expect(result).toEqual(task);
    });

    it("should return undefined when task not found", async () => {
      const { taskService } = createTestContext();
      const result = await taskService.getById("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("getByGoalId", () => {
    it("should return empty array when goal has no tasks", async () => {
      const { taskService } = createTestContext();
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
      const { taskService } = createTestContext({
        getByGoalId: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const tasks = await taskService.getByGoalId(goalId);
      expectSortedAscendingByOrder(tasks);
    });

    it("should call repository.getByGoalId with the goalId", async () => {
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.getByGoalId("goal-abc");
      expect(mockTaskRepository.getByGoalId).toHaveBeenCalledWith(
        "goal-abc",
        undefined,
      );
    });
  });

  describe("getByCategoryId", () => {
    it("should return empty array when no tasks for category", async () => {
      const { taskService } = createTestContext();
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
      const { taskService } = createTestContext({
        getByCategoryId: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const tasks = await taskService.getByCategoryId(categoryId);
      expectSortedAscendingByOrder(tasks);
    });

    it("should call repository.getByCategoryId with the categoryId", async () => {
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.getByCategoryId("cat-abc");
      expect(mockTaskRepository.getByCategoryId).toHaveBeenCalledWith(
        "cat-abc",
      );
    });
  });

  describe("getByContextId", () => {
    it("should return empty array when no tasks for context", async () => {
      const { taskService } = createTestContext();
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
      const { taskService } = createTestContext({
        getByContextId: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const tasks = await taskService.getByContextId(contextId);
      expectSortedAscendingByOrder(tasks);
    });

    it("should call repository.getByContextId with the contextId", async () => {
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.getByContextId("ctx-abc");
      expect(mockTaskRepository.getByContextId).toHaveBeenCalledWith("ctx-abc");
    });
  });
});
