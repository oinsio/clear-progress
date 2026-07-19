// implements FR1, FR2, FR3, FR5 of dedup-recurring-after-pull
import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import { RecurringTaskDeduplicator } from "./RecurringTaskDeduplicator";
import {
  createRecurringTaskDeduplicatorMergeSetup,
  ORIGINAL_ID_1,
  UUID_A,
  UUID_Z,
} from "./RecurringTaskDeduplicator.test-setup";

const FIXED_CLOCK_TIMESTAMP = "2026-07-10T12:00:00Z";

describe("RecurringTaskDeduplicator", () => {
  createRecurringTaskDeduplicatorMergeSetup();

  // Mutant 5: id tiebreak when next_date is equal
  describe("tiebreak by id — independent of repository order", () => {
    it("should pick lexicographically smallest id even when repository returns reverse order", async () => {
      const taskRepository = new TaskRepository();
      const checklistRepository = new ChecklistRepository();
      const clock = fakeClock(FIXED_CLOCK_TIMESTAMP);

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

      // Mock repository to return tasks in reverse order (UUID_Z first)
      // so stable sort without id tiebreak would keep UUID_Z as winner
      const reversedGroups = new Map([[ORIGINAL_ID_1, [taskZ, taskA]]]);
      vi.spyOn(
        taskRepository,
        "findDuplicateRecurringGroups",
      ).mockResolvedValue(reversedGroups);

      const localDeduplicator = new RecurringTaskDeduplicator(
        taskRepository,
        checklistRepository,
        clock,
      );

      await localDeduplicator.deduplicate([ORIGINAL_ID_1]);

      const winner = await db.tasks.get(UUID_A);
      const loser = await db.tasks.get(UUID_Z);
      expect(winner?.is_deleted).toBe(false);
      expect(loser?.is_deleted).toBe(true);
    });
  });
});
