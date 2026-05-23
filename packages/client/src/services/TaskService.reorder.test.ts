import { describe, expect, it, type vi } from "vitest";
import { Temporal } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { createTestContext } from "./TaskService-test-utils";

describe("TaskService", () => {
  describe("reorderTasks", () => {
    const getUpsertedTasks = (mockTaskRepository: {
      bulkUpsert: unknown;
    }): Task[] =>
      (mockTaskRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock
        .calls[0][0];

    it("should call bulkUpsert with tasks assigned sort_order by position", async () => {
      const taskA = buildTask({ sort_order: 2 });
      const taskB = buildTask({ sort_order: 0 });
      const taskC = buildTask({ sort_order: 1 });
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.reorderTasks([taskA, taskB, taskC]);
      const upserted = getUpsertedTasks(mockTaskRepository);
      expect(upserted[0].sort_order).toBe(0);
      expect(upserted[1].sort_order).toBe(1);
      expect(upserted[2].sort_order).toBe(2);
    });

    it("should update updated_at for each reordered task", async () => {
      const taskA = buildTask({
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
        ),
      });
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.reorderTasks([taskA]);
      const upserted = getUpsertedTasks(mockTaskRepository);
      expect(upserted[0].updated_at).not.toBe(
        toISOTimestamp(Temporal.Instant.from("2025-01-01T00:00:00.000Z")),
      );
    });

    it("should preserve task ids after reorder", async () => {
      const taskA = buildTask();
      const taskB = buildTask();
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.reorderTasks([taskA, taskB]);
      const upserted = getUpsertedTasks(mockTaskRepository);
      expect(upserted[0].id).toBe(taskA.id);
      expect(upserted[1].id).toBe(taskB.id);
    });

    it("should not call bulkUpsert when given empty array", async () => {
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.reorderTasks([]);
      expect(mockTaskRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should not call bulkUpsert when order has not changed", async () => {
      const taskA = buildTask({ sort_order: 0 });
      const taskB = buildTask({ sort_order: 1 });
      const taskC = buildTask({ sort_order: 2 });
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.reorderTasks([taskA, taskB, taskC]);
      expect(mockTaskRepository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should not update updated_at for tasks that did not change position", async () => {
      const oldTimestamp = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T00:00:00.000Z"),
      );
      const taskA = buildTask({ sort_order: 0, updated_at: oldTimestamp });
      const taskB = buildTask({ sort_order: 2, updated_at: oldTimestamp });
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.reorderTasks([taskA, taskB]);
      const upserted = getUpsertedTasks(mockTaskRepository);
      expect(upserted[0].updated_at).toBe(oldTimestamp);
      expect(upserted[1].updated_at).not.toBe(oldTimestamp);
    });

    // FR18: Reorder optimization — needsSync only for changed records
    it("should set needsSync to false for tasks that did not change position", async () => {
      const taskA = buildTask({ sort_order: 0, needsSync: true });
      const taskB = buildTask({ sort_order: 2, needsSync: true });
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.reorderTasks([taskA, taskB]);
      const upserted = getUpsertedTasks(mockTaskRepository);
      expect(upserted[0].needsSync).toBe(false);
      expect(upserted[1].needsSync).toBe(true);
    });

    it("should not call bulkUpsert when all tasks keep their positions", async () => {
      const taskA = buildTask({ sort_order: 0, needsSync: false });
      const taskB = buildTask({ sort_order: 1, needsSync: false });
      const taskC = buildTask({ sort_order: 2, needsSync: false });
      const { taskService, mockTaskRepository } = createTestContext();
      await taskService.reorderTasks([taskA, taskB, taskC]);
      expect(mockTaskRepository.bulkUpsert).not.toHaveBeenCalled();
    });
  });
});
