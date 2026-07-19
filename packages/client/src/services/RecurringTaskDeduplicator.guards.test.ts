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
  ORIGINAL_ID_2,
  UUID_A,
  UUID_B,
  UUID_C,
} from "./RecurringTaskDeduplicator.test-setup";

const FIXED_CLOCK_TIMESTAMP = "2026-07-10T12:00:00Z";

describe("RecurringTaskDeduplicator", () => {
  const { getDeduplicator } = createRecurringTaskDeduplicatorMergeSetup();

  // Mutants 1-2: early return guard when ids are empty
  describe("optimization guard — empty ids skip repository call", () => {
    it("should not call findDuplicateRecurringGroups when ids list is empty", async () => {
      const taskRepository = new TaskRepository();
      const checklistRepository = new ChecklistRepository();
      const clock = fakeClock(FIXED_CLOCK_TIMESTAMP);
      const findSpy = vi.spyOn(taskRepository, "findDuplicateRecurringGroups");
      const localDeduplicator = new RecurringTaskDeduplicator(
        taskRepository,
        checklistRepository,
        clock,
      );

      await localDeduplicator.deduplicate([]);

      expect(findSpy).not.toHaveBeenCalled();
    });

    it("should not call findDuplicateRecurringGroups when all ids are empty strings", async () => {
      const taskRepository = new TaskRepository();
      const checklistRepository = new ChecklistRepository();
      const clock = fakeClock(FIXED_CLOCK_TIMESTAMP);
      const findSpy = vi.spyOn(taskRepository, "findDuplicateRecurringGroups");
      const localDeduplicator = new RecurringTaskDeduplicator(
        taskRepository,
        checklistRepository,
        clock,
      );

      await localDeduplicator.deduplicate(["", ""]);

      expect(findSpy).not.toHaveBeenCalled();
    });
  });

  // Mutants 3-4: continue guard when group has single copy
  describe("optimization guard — single copy skips update", () => {
    it("should not call update when group has only one active copy", async () => {
      const taskRepository = new TaskRepository();
      const checklistRepository = new ChecklistRepository();
      const clock = fakeClock(FIXED_CLOCK_TIMESTAMP);
      const updateSpy = vi.spyOn(taskRepository, "update");
      const localDeduplicator = new RecurringTaskDeduplicator(
        taskRepository,
        checklistRepository,
        clock,
      );

      const singleTask = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.add(singleTask);

      await localDeduplicator.deduplicate([ORIGINAL_ID_1]);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    // Guards the `continue` statement directly: a group can only reach this
    // guard with activeCopies.length < MINIMUM_DUPLICATE_GROUP_SIZE (0 or 1)
    // since findDuplicateRecurringGroups never emits an empty group in
    // practice — so length-1 groups are a legitimate but observationally
    // equivalent case (merging a single copy against itself is a no-op
    // either way). Forcing an empty-array group via a mocked repository
    // makes the two mutants observable: without the `continue` (or with the
    // guard replaced by `if (false)`), the loop falls through to
    // `sortByWinnerPriority([])` and then destructures an undefined
    // scheduleWinner, which throws when merging — proving `continue` really
    // skips groups below the minimum size rather than merely coinciding with
    // a no-op merge.
    it("should not throw when a mocked group is empty, proving continue actually skips it", async () => {
      const taskRepository = new TaskRepository();
      const checklistRepository = new ChecklistRepository();
      const clock = fakeClock(FIXED_CLOCK_TIMESTAMP);
      vi.spyOn(
        taskRepository,
        "findDuplicateRecurringGroups",
      ).mockResolvedValue(new Map([[ORIGINAL_ID_1, []]]));
      const localDeduplicator = new RecurringTaskDeduplicator(
        taskRepository,
        checklistRepository,
        clock,
      );

      await expect(
        localDeduplicator.deduplicate([ORIGINAL_ID_1]),
      ).resolves.toBeUndefined();
    });

    // Guards the `continue` statement itself (not just the guarded call):
    // replacing `continue` with an empty block would still skip the update
    // for the singleton group (since the guard body has no other statements)
    // but would fall through to loop code the real implementation intends to
    // skip, rather than jumping to the next group. Processing a singleton
    // group FIRST and a real duplicate group SECOND in the same call proves
    // the loop actually advances past the singleton to still dedupe group 2 —
    // an `if (...) {}` mutant that fails to skip to the next iteration would
    // still coincidentally pass this too, but combined with the single-copy
    // assertions above, it locks down that iteration order is unaffected.
    it("should still deduplicate a later group after an earlier singleton group in the same call", async () => {
      const singleTask = buildTask({
        id: UUID_A,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        is_completed: false,
        is_deleted: false,
      });
      const groupTwoWinner = buildTask({
        id: UUID_B,
        original_task_id: ORIGINAL_ID_2,
        next_date: "2026-07-02",
        is_completed: false,
        is_deleted: false,
      });
      const groupTwoLoser = buildTask({
        id: UUID_C,
        original_task_id: ORIGINAL_ID_2,
        next_date: "2026-07-08",
        is_completed: false,
        is_deleted: false,
      });
      await db.tasks.bulkAdd([singleTask, groupTwoWinner, groupTwoLoser]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1, ORIGINAL_ID_2]);

      expect((await db.tasks.get(UUID_A))?.syncStatus).toBe("synced");
      expect((await db.tasks.get(UUID_B))?.is_deleted).toBe(false);
      expect((await db.tasks.get(UUID_C))?.is_deleted).toBe(true);
    });
  });
});
