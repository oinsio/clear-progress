// implements FR1, FR2, FR3, FR5 of dedup-recurring-after-pull
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { db } from "@/db/database";
import { buildTask } from "@/test/factories/taskFactory";
import {
  createRecurringTaskDeduplicatorMergeSetup,
  ORIGINAL_ID_1,
  UUID_A,
  UUID_B,
} from "./RecurringTaskDeduplicator.test-setup";

describe("RecurringTaskDeduplicator", () => {
  const { getDeduplicator } = createRecurringTaskDeduplicatorMergeSetup();

  // FR5: skip when list is empty
  describe("skip optimization", () => {
    it("should not modify any tasks when originalTaskIds is empty", async () => {
      const originalUpdatedAt = "2026-06-01T10:00:00.000Z";
      const taskA = buildTask({
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
        updated_at: originalUpdatedAt,
      });
      const taskB = buildTask({
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-05",
        is_completed: false,
        is_deleted: false,
        updated_at: originalUpdatedAt,
      });
      await db.tasks.bulkAdd([taskA, taskB]);

      await getDeduplicator().deduplicate([]);

      const resultA = await db.tasks.get(taskA.id);
      const resultB = await db.tasks.get(taskB.id);
      expect(resultA?.is_deleted).toBe(false);
      expect(resultB?.is_deleted).toBe(false);
      expect(resultA?.updated_at).toBe(originalUpdatedAt);
      expect(resultB?.updated_at).toBe(originalUpdatedAt);
    });

    it("should filter out empty strings from originalTaskIds", async () => {
      const taskA = buildTask({
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      const taskB = buildTask({
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-05",
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([taskA, taskB]);

      await getDeduplicator().deduplicate(["", ""]);

      const resultA = await db.tasks.get(taskA.id);
      const resultB = await db.tasks.get(taskB.id);
      expect(resultA?.is_deleted).toBe(false);
      expect(resultB?.is_deleted).toBe(false);
    });

    it("should process real ids but ignore empty strings in mixed list", async () => {
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
      // Non-recurring tasks that should never be touched by dedup
      const nonRecurringTaskA = buildTask({
        original_task_id: "",
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      const nonRecurringTaskB = buildTask({
        original_task_id: "",
        next_date: "2026-07-02",
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([
        winnerTask,
        loserTask,
        nonRecurringTaskA,
        nonRecurringTaskB,
      ]);

      await getDeduplicator().deduplicate(["", ORIGINAL_ID_1, ""]);

      // Duplicates should be deduped
      expect((await db.tasks.get(UUID_A))?.is_deleted).toBe(false);
      expect((await db.tasks.get(UUID_B))?.is_deleted).toBe(true);
      // Non-recurring tasks must not be touched
      const nonRecA = await db.tasks.get(nonRecurringTaskA.id);
      const nonRecB = await db.tasks.get(nonRecurringTaskB.id);
      expect(nonRecA?.is_deleted).toBe(false);
      expect(nonRecB?.is_deleted).toBe(false);
      expect(nonRecA?.syncStatus).toBe("synced");
      expect(nonRecB?.syncStatus).toBe("synced");
    });
  });
});
