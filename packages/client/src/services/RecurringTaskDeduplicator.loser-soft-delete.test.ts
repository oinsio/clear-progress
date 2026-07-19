// implements FR1, FR2, FR3, FR5 of dedup-recurring-after-pull
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { db } from "@/db/database";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildTask } from "@/test/factories/taskFactory";
import {
  createRecurringTaskDeduplicatorMergeSetup,
  ORIGINAL_ID_1,
  UUID_A,
  UUID_B,
} from "./RecurringTaskDeduplicator.test-setup";

describe("RecurringTaskDeduplicator", () => {
  const { getDeduplicator } = createRecurringTaskDeduplicatorMergeSetup();

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

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const loser = await db.tasks.get(UUID_B);
      expect(loser?.updated_at).toBe("2026-07-10T12:00:00.000Z");
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

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

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

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const item = await db.checklist_items.get(winnerItem.id);
      expect(item?.is_deleted).toBe(false);
      expect(item?.syncStatus).toBe("synced");
    });
  });
});
