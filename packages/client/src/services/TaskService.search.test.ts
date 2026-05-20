import { describe, expect, it, vi } from "vitest";
import { Temporal } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { createTestContext } from "./TaskService-test-utils";

describe("TaskService", () => {
  describe("searchByName", () => {
    const setupSearchTest = async (
      tasks: Task[],
      query: string,
    ): Promise<Task[]> => {
      const { taskService } = createTestContext({
        getActive: vi.fn().mockResolvedValue(tasks),
      });
      return await taskService.searchByName(query);
    };

    it("should return empty array when no tasks match", async () => {
      const tasks = [buildTask({ name: "Buy groceries" })];
      const results = await setupSearchTest(tasks, "nonexistent");
      expect(results).toEqual([]);
    });

    it("should return matching tasks case-insensitively", async () => {
      const tasks = [
        buildTask({ name: "Buy groceries" }),
        buildTask({ name: "Call dentist" }),
        buildTask({ name: "Buy medicine" }),
      ];
      const results = await setupSearchTest(tasks, "buy");
      expect(results).toHaveLength(2);
    });

    it("should return tasks whose description contain the query", async () => {
      const matchingTask = buildTask({
        name: "Project meeting",
        description: "Discuss budget allocation",
      });
      const nonMatchingTask = buildTask({
        name: "Shopping",
        description: "Buy groceries",
      });
      const results = await setupSearchTest(
        [matchingTask, nonMatchingTask],
        "budget",
      );
      expect(results).toEqual([matchingTask]);
    });

    it("should return tasks matching in either name or description", async () => {
      const matchInName = buildTask({
        name: "Budget review",
        description: "Quarterly report",
      });
      const matchInDescription = buildTask({
        name: "Team meeting",
        description: "Review budget proposals",
      });
      const noMatch = buildTask({ name: "Lunch", description: "Restaurant" });
      const results = await setupSearchTest(
        [matchInName, matchInDescription, noMatch],
        "budget",
      );
      expect(results).toHaveLength(2);
      expect(results).toContain(matchInName);
      expect(results).toContain(matchInDescription);
    });

    it("should match case-insensitively in description", async () => {
      const task = buildTask({
        name: "Meeting",
        description: "Discuss Budget",
      });
      const results = await setupSearchTest([task], "budget");
      expect(results).toHaveLength(1);
    });

    it.each([
      { isCompleted: false, label: "incomplete" },
      { isCompleted: true, label: "completed" },
    ])("should sort $label tasks by updated_at descending", async ({
      isCompleted,
    }) => {
      const timestamp1 = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
      );
      const timestamp2 = toISOTimestamp(
        Temporal.Instant.from("2025-01-02T10:00:00.000Z"),
      );
      const timestamp3 = toISOTimestamp(
        Temporal.Instant.from("2025-01-03T10:00:00.000Z"),
      );
      const tasks = [
        buildTask({
          name: "Task A",
          is_completed: isCompleted,
          updated_at: timestamp1,
        }),
        buildTask({
          name: "Task B",
          is_completed: isCompleted,
          updated_at: timestamp3,
        }),
        buildTask({
          name: "Task C",
          is_completed: isCompleted,
          updated_at: timestamp2,
        }),
      ];
      const results = await setupSearchTest(tasks, "task");
      expect(results[0].updated_at).toBe(timestamp3);
      expect(results[1].updated_at).toBe(timestamp2);
      expect(results[2].updated_at).toBe(timestamp1);
    });

    it("should place incomplete tasks before completed tasks", async () => {
      const completedTask = buildTask({
        name: "Task A",
        is_completed: true,
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-03T10:00:00.000Z"),
        ),
      });
      const incompleteTask = buildTask({
        name: "Task B",
        is_completed: false,
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
        ),
      });
      const results = await setupSearchTest(
        [completedTask, incompleteTask],
        "task",
      );
      expect(results[0].is_completed).toBe(false);
      expect(results[1].is_completed).toBe(true);
    });
  });
});
