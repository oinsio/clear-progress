// implements FR1, FR2, FR3, FR5 of dedup-recurring-after-pull
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { db } from "@/db/database";
import { buildTask } from "@/test/factories/taskFactory";
import {
  createRecurringTaskDeduplicatorMergeSetup,
  ORIGINAL_ID_1,
  ORIGINAL_ID_2,
  UUID_A,
  UUID_B,
  UUID_C,
} from "./RecurringTaskDeduplicator.test-setup";

describe("RecurringTaskDeduplicator", () => {
  const { getDeduplicator } = createRecurringTaskDeduplicatorMergeSetup();

  // Multiple original_task_ids
  describe("multiple groups", () => {
    it("should deduplicate multiple original_task_id groups independently", async () => {
      const groupAWinner = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      const groupALoser = buildTask({
        id: UUID_B,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-05",
        is_completed: false,
        is_deleted: false,
      });
      const groupBWinner = buildTask({
        original_task_id: ORIGINAL_ID_2,
        next_date: "2026-07-02",
        is_completed: false,
        is_deleted: false,
      });
      const groupBLoser = buildTask({
        original_task_id: ORIGINAL_ID_2,
        next_date: "2026-07-08",
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([
        groupAWinner,
        groupALoser,
        groupBWinner,
        groupBLoser,
      ]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1, ORIGINAL_ID_2]);

      expect((await db.tasks.get(UUID_A))?.is_deleted).toBe(false);
      expect((await db.tasks.get(UUID_B))?.is_deleted).toBe(true);
      // Group B: winner has earlier next_date
      const groupBTasks = await db.tasks
        .where("original_task_id")
        .equals(ORIGINAL_ID_2)
        .toArray();
      const groupBWinnerResult = groupBTasks.find(
        (task) => task.next_date === "2026-07-02",
      );
      const groupBLoserResult = groupBTasks.find(
        (task) => task.next_date === "2026-07-08",
      );
      expect(groupBWinnerResult?.is_deleted).toBe(false);
      expect(groupBLoserResult?.is_deleted).toBe(true);
    });

    it("should deduplicate unique ids only (no double processing)", async () => {
      const winnerTask = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      const loserTask = buildTask({
        id: UUID_B,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-05",
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([winnerTask, loserTask]);

      await getDeduplicator().deduplicate([
        ORIGINAL_ID_1,
        ORIGINAL_ID_1,
        ORIGINAL_ID_1,
      ]);

      expect((await db.tasks.get(UUID_A))?.is_deleted).toBe(false);
      expect((await db.tasks.get(UUID_B))?.is_deleted).toBe(true);
    });
  });

  // Three or more duplicates
  describe("three or more duplicates", () => {
    it("should keep only the winner among three duplicates", async () => {
      const taskA = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-03",
        is_completed: false,
        is_deleted: false,
      });
      const taskB = buildTask({
        id: UUID_B,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      const taskC = buildTask({
        id: UUID_C,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-05",
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([taskA, taskB, taskC]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      expect((await db.tasks.get(UUID_B))?.is_deleted).toBe(false);
      expect((await db.tasks.get(UUID_A))?.is_deleted).toBe(true);
      expect((await db.tasks.get(UUID_C))?.is_deleted).toBe(true);
    });
  });
});
