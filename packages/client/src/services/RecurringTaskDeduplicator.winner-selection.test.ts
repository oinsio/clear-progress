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
  UUID_C,
  UUID_Z,
} from "./RecurringTaskDeduplicator.test-setup";

describe("RecurringTaskDeduplicator", () => {
  const { getDeduplicator } = createRecurringTaskDeduplicatorMergeSetup();

  // FR1 + FR2: detect duplicates and pick winner
  describe("winner selection", () => {
    it("should keep the copy with earliest next_date", async () => {
      const earlyTask = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      const lateTask = buildTask({
        id: UUID_B,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-10",
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([earlyTask, lateTask]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const winner = await db.tasks.get(UUID_A);
      const loser = await db.tasks.get(UUID_B);
      expect(winner?.is_deleted).toBe(false);
      expect(loser?.is_deleted).toBe(true);
      expect(loser?.syncStatus).toBe("pending");
    });

    it("should tiebreak by lexicographically smallest id when next_date is same", async () => {
      // Insert UUID_Z first so stable sort without tiebreak would keep it as winner
      const taskZ = buildTask({
        id: UUID_Z,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      const taskA = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([taskZ, taskA]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const winner = await db.tasks.get(UUID_A);
      const loser = await db.tasks.get(UUID_Z);
      expect(winner?.is_deleted).toBe(false);
      expect(loser?.is_deleted).toBe(true);
      expect(loser?.syncStatus).toBe("pending");
    });

    it("should not modify a single copy (no duplicates)", async () => {
      const originalUpdatedAt = "2026-06-01T10:00:00.000Z";
      const singleTask = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
        updated_at: originalUpdatedAt,
      });
      await db.tasks.add(singleTask);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const result = await db.tasks.get(UUID_A);
      expect(result?.is_deleted).toBe(false);
      expect(result?.syncStatus).toBe("synced");
      expect(result?.updated_at).toBe(originalUpdatedAt);
    });
  });

  // FR1: ignore completed and deleted tasks
  describe("filtering", () => {
    it("should ignore completed copies when detecting duplicates", async () => {
      const activeTask = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-05",
        is_completed: false,
        is_deleted: false,
      });
      const completedTask = buildTask({
        id: UUID_B,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: true,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([activeTask, completedTask]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const active = await db.tasks.get(UUID_A);
      const completed = await db.tasks.get(UUID_B);
      expect(active?.is_deleted).toBe(false);
      expect(completed?.is_deleted).toBe(false);
    });

    it("should ignore already-deleted copies when detecting duplicates", async () => {
      const activeTask = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-05",
        is_completed: false,
        is_deleted: false,
      });
      const deletedTask = buildTask({
        id: UUID_B,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: true,
      });
      await db.tasks.bulkAdd([activeTask, deletedTask]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const active = await db.tasks.get(UUID_A);
      expect(active?.is_deleted).toBe(false);
    });

    // FR1: a completed copy sharing original_task_id with two active
    // duplicates must not be pulled into the dup group — the group is
    // formed only from the two non-completed, non-deleted copies, so the
    // winner is chosen among those two and the completed copy is untouched.
    it("should form the duplicate group only from active copies when a completed copy shares the original_task_id with two active duplicates", async () => {
      const earlyActiveTask = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      const lateActiveTask = buildTask({
        id: UUID_B,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-05",
        is_completed: false,
        is_deleted: false,
      });
      const completedTask = buildTask({
        id: UUID_C,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-06-20",
        is_completed: true,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([earlyActiveTask, lateActiveTask, completedTask]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const earlyActiveResult = await db.tasks.get(UUID_A);
      const lateActiveResult = await db.tasks.get(UUID_B);
      const completedResult = await db.tasks.get(UUID_C);
      expect(earlyActiveResult?.is_deleted).toBe(false);
      expect(lateActiveResult?.is_deleted).toBe(true);
      expect(lateActiveResult?.syncStatus).toBe("pending");
      expect(completedResult?.is_deleted).toBe(false);
      expect(completedResult?.syncStatus).toBe("synced");
    });
  });
});
