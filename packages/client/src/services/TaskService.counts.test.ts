import { describe, expect, it, vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { createTestContext } from "./TaskService-test-utils";

describe("TaskService", () => {
  describe("getCategoryTaskCounts", () => {
    it("should return empty object when no active incomplete tasks", async () => {
      const { taskService } = createTestContext();
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
      const { taskService } = createTestContext({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const counts = await taskService.getCategoryTaskCounts();
      expect(counts["cat-1"]).toBe(2);
      expect(counts["cat-2"]).toBe(1);
      expect(counts[""]).toBeUndefined();
    });
  });

  describe("getContextTaskCounts", () => {
    it("should return empty object when no active incomplete tasks", async () => {
      const { taskService } = createTestContext();
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
      const { taskService } = createTestContext({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const counts = await taskService.getContextTaskCounts();
      expect(counts["ctx-1"]).toBe(2);
      expect(counts["ctx-2"]).toBe(1);
      expect(counts[""]).toBeUndefined();
    });
  });

  describe("getGoalTaskCounts", () => {
    it("should return empty object when no active incomplete tasks", async () => {
      const { taskService } = createTestContext();
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
      const { taskService } = createTestContext({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const counts = await taskService.getGoalTaskCounts();
      expect(counts["goal-1"]).toBe(2);
      expect(counts["goal-2"]).toBe(1);
      expect(counts[""]).toBeUndefined();
    });

    it("should not include tasks with empty goal_id in counts", async () => {
      const tasks = [buildTask({ goal_id: "" }), buildTask({ goal_id: "" })];
      const { taskService } = createTestContext({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const counts = await taskService.getGoalTaskCounts();
      expect(Object.keys(counts)).toHaveLength(0);
    });
  });
});
