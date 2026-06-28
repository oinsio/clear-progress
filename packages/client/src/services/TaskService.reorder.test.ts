import { describe, expect, it, vi } from "vitest";
import { SORT_ORDER_REBALANCE_THRESHOLD } from "@/constants";
import { buildTask } from "@/test/factories/taskFactory";
import { createTestContext } from "./TaskService-test-utils";

describe("TaskService", () => {
  describe("reorderTasks", () => {
    it("should update task with new sort_order", async () => {
      const task = buildTask({ sort_order: "a0" });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });

      await taskService.reorderTasks(task.id, "a1");

      expect(mockTaskRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: task.id,
          sort_order: "a1",
          syncStatus: "pending" as const,
        }),
      );
    });

    it("should update updated_at when reordering", async () => {
      const task = buildTask({
        sort_order: "a0",
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });

      await taskService.reorderTasks(task.id, "a1");

      const updatedTask = (
        mockTaskRepository.update as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(updatedTask.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should throw when task not found", async () => {
      const { taskService } = createTestContext();
      await expect(
        taskService.reorderTasks("nonexistent", "a1"),
      ).rejects.toThrow("Task not found: nonexistent");
    });

    it("should not trigger rebalancing when key is short", async () => {
      const task = buildTask({ sort_order: "a0", box: "inbox" });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
      });

      await taskService.reorderTasks(task.id, "a1");

      expect(mockTaskRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should trigger rebalancing when key exceeds threshold", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const task = buildTask({ sort_order: "a0", box: "inbox" });
      const boxTasks = [
        buildTask({ sort_order: "a0", box: "inbox" }),
        buildTask({ sort_order: "a1", box: "inbox" }),
      ];
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
        getByBox: vi.fn().mockResolvedValue(boxTasks),
      });

      await taskService.reorderTasks(task.id, longKey);

      expect(mockTaskRepository.bulkUpsert).toHaveBeenCalled();
    });

    it("should rebalance all tasks in the box with fresh keys", async () => {
      const longKey = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
      const task = buildTask({ sort_order: "a0", box: "inbox" });
      const boxTasks = [
        buildTask({ sort_order: "b0", box: "inbox" }),
        buildTask({ sort_order: "a0", box: "inbox" }),
      ];
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
        getByBox: vi.fn().mockResolvedValue(boxTasks),
      });

      await taskService.reorderTasks(task.id, longKey);

      const rebalancedTasks = (
        mockTaskRepository.bulkUpsert as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(rebalancedTasks).toHaveLength(2);
      for (const rebalancedTask of rebalancedTasks) {
        expect(typeof rebalancedTask.sort_order).toBe("string");
        expect(rebalancedTask.syncStatus).toBe("pending");
      }
    });
  });
});
