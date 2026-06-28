// implements FR1, FR2, FR3, FR5 of dedup-recurring-after-pull
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { RecurringTaskDeduplicator } from "./RecurringTaskDeduplicator";

const FIXED_CLOCK_TIMESTAMP = "2026-07-10T12:00:00Z";

// Deterministic UUIDs for predictable tiebreak ordering
const UUID_A = "00000000-0000-4000-a000-000000000001";
const UUID_B = "00000000-0000-4000-a000-000000000002";
const UUID_C = "00000000-0000-4000-a000-000000000003";
const UUID_Z = "ffffffff-ffff-4fff-afff-ffffffffffff";
const ORIGINAL_ID_1 = "11111111-1111-4111-a111-111111111111";
const ORIGINAL_ID_2 = "22222222-2222-4222-a222-222222222222";

describe("RecurringTaskDeduplicator", () => {
  let deduplicator: RecurringTaskDeduplicator;

  beforeEach(async () => {
    await db.tasks.clear();
    await db.checklist_items.clear();
    const clock = fakeClock(FIXED_CLOCK_TIMESTAMP);
    deduplicator = new RecurringTaskDeduplicator(
      new TaskRepository(),
      new ChecklistRepository(),
      clock,
    );
  });

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

      await deduplicator.deduplicate([]);

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

      await deduplicator.deduplicate(["", ""]);

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

      await deduplicator.deduplicate(["", ORIGINAL_ID_1, ""]);

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

      await deduplicator.deduplicate([ORIGINAL_ID_1]);

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

      await deduplicator.deduplicate([ORIGINAL_ID_1]);

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

      await deduplicator.deduplicate([ORIGINAL_ID_1]);

      const result = await db.tasks.get(UUID_A);
      expect(result?.is_deleted).toBe(false);
      expect(result?.syncStatus).toBe("synced");
      expect(result?.updated_at).toBe(originalUpdatedAt);
    });
  });

  // FR2: loser soft-delete fields
  describe("loser soft-delete", () => {
    it("should set updated_at on loser to current clock timestamp", async () => {
      const taskA = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      const taskB = buildTask({
        id: UUID_B,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-05",
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([taskA, taskB]);

      await deduplicator.deduplicate([ORIGINAL_ID_1]);

      const loser = await db.tasks.get(UUID_B);
      expect(loser?.updated_at).toBe("2026-07-10T12:00:00.000Z");
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

      await deduplicator.deduplicate([ORIGINAL_ID_1]);

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

      await deduplicator.deduplicate([ORIGINAL_ID_1]);

      const active = await db.tasks.get(UUID_A);
      expect(active?.is_deleted).toBe(false);
    });
  });

  // FR3: cascade to checklist items
  describe("checklist cascade", () => {
    it("should soft-delete checklist items of loser task", async () => {
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
        next_date: "2026-07-10",
        is_completed: false,
        is_deleted: false,
      });
      const checklistItem = buildChecklistItem({
        task_id: UUID_B,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([winnerTask, loserTask]);
      await db.checklist_items.add(checklistItem);

      await deduplicator.deduplicate([ORIGINAL_ID_1]);

      const item = await db.checklist_items.get(checklistItem.id);
      expect(item?.is_deleted).toBe(true);
      expect(item?.syncStatus).toBe("pending");
      expect(item?.updated_at).toBe("2026-07-10T12:00:00.000Z");
    });

    it("should not modify checklist items of winner task", async () => {
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
        next_date: "2026-07-10",
        is_completed: false,
        is_deleted: false,
      });
      const winnerItem = buildChecklistItem({
        task_id: UUID_A,
        is_deleted: false,
        syncStatus: "synced",
      });
      await db.tasks.bulkAdd([winnerTask, loserTask]);
      await db.checklist_items.add(winnerItem);

      await deduplicator.deduplicate([ORIGINAL_ID_1]);

      const item = await db.checklist_items.get(winnerItem.id);
      expect(item?.is_deleted).toBe(false);
      expect(item?.syncStatus).toBe("synced");
    });
  });

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

      await deduplicator.deduplicate([ORIGINAL_ID_1, ORIGINAL_ID_2]);

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

      await deduplicator.deduplicate([
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

      await deduplicator.deduplicate([ORIGINAL_ID_1]);

      expect((await db.tasks.get(UUID_B))?.is_deleted).toBe(false);
      expect((await db.tasks.get(UUID_A))?.is_deleted).toBe(true);
      expect((await db.tasks.get(UUID_C))?.is_deleted).toBe(true);
    });
  });
});
