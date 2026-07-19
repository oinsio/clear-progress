import { describe, expect, it, vi } from "vitest";
import { SORT_ORDER_REBALANCE_THRESHOLD } from "@/constants";
import { fakeClock } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { createTestContext } from "./TaskService-test-utils";

const REBALANCE_LONG_KEY = "a".repeat(SORT_ORDER_REBALANCE_THRESHOLD + 1);
const SHORT_SORT_KEY = "a1";

/**
 * Arrange for reorder tests that operate on a single task: builds a task from
 * the given overrides and a TaskService whose repository resolves it via
 * getById. Used by the short-key tests that never hit rebalancing.
 */
function setupSingleTask(overrides: Parameters<typeof buildTask>[0] = {}) {
  const task = buildTask(overrides);
  const { taskService, mockTaskRepository } = createTestContext({
    getById: vi.fn().mockResolvedValue(task),
  });
  return { task, taskService, mockTaskRepository };
}

/**
 * Shared arrange for rebalance-during-reorder tests: a dragged task and one
 * other box task, both carrying the same stale updated_at, wired into a
 * TaskService whose repository resolves them via getById / getByBox.
 */
function setupRebalanceScenario() {
  const staleTimestamp = toISOTimestamp(fakeClock("2025-01-01T00:00:00.000Z"));
  const draggedTask = buildTask({
    sort_order: "a0",
    box: "inbox",
    updated_at: staleTimestamp,
  });
  const otherBoxTask = buildTask({
    sort_order: "b0",
    box: "inbox",
    updated_at: staleTimestamp,
  });
  const { taskService, mockTaskRepository } = createTestContext({
    getById: vi.fn().mockResolvedValue(draggedTask),
    getByBox: vi.fn().mockResolvedValue([draggedTask, otherBoxTask]),
  });
  return {
    staleTimestamp,
    draggedTask,
    otherBoxTask,
    taskService,
    mockTaskRepository,
  };
}

function getBulkUpsertedTasks(
  mockTaskRepository: ReturnType<
    typeof createTestContext
  >["mockTaskRepository"],
): Task[] {
  return (mockTaskRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock
    .calls[0][0];
}

function findRebalancedTaskById(
  rebalancedTasks: Task[],
  taskId: string,
): Task | undefined {
  return rebalancedTasks.find((rebalancedTask) => rebalancedTask.id === taskId);
}

/**
 * Arrange for a plain rebalance-during-reorder trigger: a dragged task plus a
 * two-task box, wired into a TaskService whose repository resolves them via
 * getById / getByBox. Used by the tests that only assert on rebalance being
 * triggered and on the fresh keys, without stale-timestamp bookkeeping.
 */
function setupBoxWithTasks(boxTasks: ReturnType<typeof buildTask>[]) {
  const task = buildTask({ sort_order: "a0", box: "inbox" });
  const { taskService, mockTaskRepository } = createTestContext({
    getById: vi.fn().mockResolvedValue(task),
    getByBox: vi.fn().mockResolvedValue(boxTasks),
  });
  return { task, taskService, mockTaskRepository };
}

describe("TaskService", () => {
  describe("reorderTasks", () => {
    it("should update task with new sort_order", async () => {
      const { task, taskService, mockTaskRepository } = setupSingleTask({
        sort_order: "a0",
      });

      await taskService.reorderTasks(task.id, SHORT_SORT_KEY);

      expect(mockTaskRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: task.id,
          sort_order: SHORT_SORT_KEY,
          syncStatus: "pending" as const,
        }),
      );
    });

    it("should update updated_at when reordering", async () => {
      const originalTimestamp = "2025-01-01T00:00:00.000Z";
      const { task, taskService, mockTaskRepository } = setupSingleTask({
        sort_order: "a0",
        updated_at: originalTimestamp,
      });

      await taskService.reorderTasks(task.id, SHORT_SORT_KEY);

      const updatedTask = (
        mockTaskRepository.update as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(updatedTask.updated_at).not.toBe(originalTimestamp);
    });

    it("should throw when task not found", async () => {
      const { taskService } = createTestContext();
      await expect(
        taskService.reorderTasks("nonexistent", SHORT_SORT_KEY),
      ).rejects.toThrow("Task not found: nonexistent");
    });

    it("should not trigger rebalancing when key is short", async () => {
      const { task, taskService, mockTaskRepository } = setupSingleTask({
        sort_order: "a0",
        box: "inbox",
      });

      await taskService.reorderTasks(task.id, SHORT_SORT_KEY);

      expect(mockTaskRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should trigger rebalancing when key exceeds threshold", async () => {
      const { task, taskService, mockTaskRepository } = setupBoxWithTasks([
        buildTask({ sort_order: "a0", box: "inbox" }),
        buildTask({ sort_order: "a1", box: "inbox" }),
      ]);

      await taskService.reorderTasks(task.id, REBALANCE_LONG_KEY);

      expect(mockTaskRepository.bulkUpsert).toHaveBeenCalled();
    });

    it("should rebalance all tasks in the box with fresh keys", async () => {
      const { task, taskService, mockTaskRepository } = setupBoxWithTasks([
        buildTask({ sort_order: "b0", box: "inbox" }),
        buildTask({ sort_order: "a0", box: "inbox" }),
      ]);

      await taskService.reorderTasks(task.id, REBALANCE_LONG_KEY);

      const rebalancedTasks = getBulkUpsertedTasks(mockTaskRepository);
      expect(rebalancedTasks).toHaveLength(2);
      for (const rebalancedTask of rebalancedTasks) {
        expect(typeof rebalancedTask.sort_order).toBe("string");
        expect(rebalancedTask.syncStatus).toBe("pending");
      }
    });

    // FR4: rebalanceBox preserves updated_at — system-initiated rebalancing
    // must not masquerade as a user edit (fix-stale-sync-overwrites).
    // Verifies M2 of fix-stale-sync-overwrites
    it("should keep original updated_at for rebalanced tasks", async () => {
      const {
        staleTimestamp,
        draggedTask,
        otherBoxTask,
        taskService,
        mockTaskRepository,
      } = setupRebalanceScenario();

      await taskService.reorderTasks(draggedTask.id, REBALANCE_LONG_KEY);

      const rebalancedTasks = getBulkUpsertedTasks(mockTaskRepository);
      expect(rebalancedTasks).toHaveLength(2);
      const otherTaskAfterRebalance = findRebalancedTaskById(
        rebalancedTasks,
        otherBoxTask.id,
      );
      expect(otherTaskAfterRebalance?.updated_at).toBe(staleTimestamp);
    });

    // FR4: reorderTasks must keep refreshing updated_at for the dragged
    // task even when the same operation triggers rebalancing of the rest
    // of the box (regression guard for fix-stale-sync-overwrites).
    it("should still refresh updated_at for the dragged task when rebalancing is triggered", async () => {
      const {
        staleTimestamp,
        draggedTask,
        otherBoxTask,
        taskService,
        mockTaskRepository,
      } = setupRebalanceScenario();

      await taskService.reorderTasks(draggedTask.id, REBALANCE_LONG_KEY);

      const rebalancedTasks = getBulkUpsertedTasks(mockTaskRepository);
      const draggedTaskAfterRebalance = findRebalancedTaskById(
        rebalancedTasks,
        draggedTask.id,
      );
      const otherTaskAfterRebalance = findRebalancedTaskById(
        rebalancedTasks,
        otherBoxTask.id,
      );

      expect(draggedTaskAfterRebalance?.updated_at).not.toBe(staleTimestamp);
      expect(otherTaskAfterRebalance?.updated_at).toBe(staleTimestamp);
    });

    // FR4: rebalanceBox assigns syncStatus "pending" to propagate the new
    // sort_order without pretending it is a user edit.
    it("should set syncStatus to pending for rebalanced tasks", async () => {
      const task = buildTask({
        sort_order: "a0",
        box: "inbox",
        syncStatus: "synced" as const,
      });
      const otherBoxTask = buildTask({
        sort_order: "b0",
        box: "inbox",
        syncStatus: "synced" as const,
      });
      const { taskService, mockTaskRepository } = createTestContext({
        getById: vi.fn().mockResolvedValue(task),
        getByBox: vi.fn().mockResolvedValue([task, otherBoxTask]),
      });

      await taskService.reorderTasks(task.id, REBALANCE_LONG_KEY);

      const rebalancedTasks = getBulkUpsertedTasks(mockTaskRepository);
      expect(rebalancedTasks).toHaveLength(2);
      for (const rebalancedTask of rebalancedTasks) {
        expect(rebalancedTask.syncStatus).toBe("pending");
      }
    });
  });
});
