import { describe, expect, it, vi } from "vitest";
import { Temporal } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { createTestContext } from "./TaskService-test-utils";

describe("TaskService", () => {
  describe("getCompleted", () => {
    it("should return empty array when no completed tasks exist", async () => {
      const { taskService } = createTestContext();
      const tasks = await taskService.getCompleted();
      expect(tasks).toEqual([]);
    });

    it("should sort completed tasks by completed_at descending", async () => {
      const timestamp1 = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
      );
      const timestamp2 = toISOTimestamp(
        Temporal.Instant.from("2025-01-02T10:00:00.000Z"),
      );
      const timestamp3 = toISOTimestamp(
        Temporal.Instant.from("2025-01-03T10:00:00.000Z"),
      );
      const completedTasks = [
        buildTask({ is_completed: true, completed_at: timestamp1 }),
        buildTask({ is_completed: true, completed_at: timestamp3 }),
        buildTask({ is_completed: true, completed_at: timestamp2 }),
      ];
      const { taskService } = createTestContext({
        getCompleted: vi.fn().mockResolvedValue(completedTasks),
      });
      const tasks = await taskService.getCompleted();
      expect(tasks[0].completed_at).toBe(timestamp3);
      expect(tasks[1].completed_at).toBe(timestamp2);
      expect(tasks[2].completed_at).toBe(timestamp1);
    });

    it("should sort by sort_order descending when completed_at is empty", async () => {
      const completedTasks = [
        buildTask({ is_completed: true, completed_at: "", sort_order: "a0" }),
        buildTask({ is_completed: true, completed_at: "", sort_order: "a2" }),
        buildTask({ is_completed: true, completed_at: "", sort_order: "a1" }),
      ];
      const { taskService } = createTestContext({
        getCompleted: vi.fn().mockResolvedValue(completedTasks),
      });
      const tasks = await taskService.getCompleted();
      expect(String(tasks[0].sort_order) > String(tasks[1].sort_order)).toBe(
        true,
      );
      expect(String(tasks[1].sort_order) > String(tasks[2].sort_order)).toBe(
        true,
      );
    });

    it("should sort by sort_order when only one task has completed_at", async () => {
      const taskWithDate = buildTask({
        is_completed: true,
        completed_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
        ),
        sort_order: "a0",
      });
      const taskWithoutDate = buildTask({
        is_completed: true,
        completed_at: "",
        sort_order: "a5",
      });
      const { taskService } = createTestContext({
        getCompleted: vi
          .fn()
          .mockResolvedValue([taskWithDate, taskWithoutDate]),
      });
      const tasks = await taskService.getCompleted();
      expect(String(tasks[0].sort_order) > String(tasks[1].sort_order)).toBe(
        true,
      );
    });
  });
});
