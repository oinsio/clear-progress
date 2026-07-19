// implements FR3 of fix-stale-sync-overwrites
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RECORD_SYNC_STATUS } from "@/constants";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { buildTask } from "@/test/factories/taskFactory";
import { RecurringTaskDeduplicator } from "./RecurringTaskDeduplicator";
import { FIXED_CLOCK_TIMESTAMP } from "./RecurringTaskDeduplicator.test-setup";

// Sixth scenario: proves the winner is written with syncStatus "pending"
// ONLY when the merge actually changed its stored record, per FR3's last
// sentence. Two subcases below use the same original_task_id family but
// distinct task ids so each test starts from a clean, independent group.
const UUID_CHANGED_WINNER = "00000000-0000-4000-a000-000000000060";
const UUID_CHANGED_LOSER = "00000000-0000-4000-a000-000000000061";
const ORIGINAL_ID_6 = "66666666-6666-4666-a666-666666666666";

const UUID_OPTIMAL_WINNER = "00000000-0000-4000-a000-000000000070";
const UUID_OPTIMAL_LOSER = "00000000-0000-4000-a000-000000000071";
const ORIGINAL_ID_7 = "77777777-7777-4777-a777-777777777777";

// FR3 (last sentence): the winner SHALL be written with syncStatus
// "pending" only when the merge actually changed the stored record. This
// requires the deduplicator to call taskRepository.update() for the
// winner whenever content/schedule/box fields differ from what the
// winner already had on disk — something the current implementation
// never does (it only calls update() for losers' soft-deletes), so this
// first test is expected to FAIL until the merge-and-conditionally-write
// behavior is implemented.
//
// This file constructs its own TaskRepository/ChecklistRepository/clock
// (rather than using the shared test-setup factory) because each test
// spies on taskRepository.update() directly.
describe("RecurringTaskDeduplicator — content merge from freshest updated_at", () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.checklist_items.clear();
  });

  describe("winner syncStatus is pending only when the merge actually changed it", () => {
    it("should write the winner with syncStatus pending and call update when the merge changes its stored content", async () => {
      const taskRepository = new TaskRepository();
      const checklistRepository = new ChecklistRepository();
      const clock = fakeClock(FIXED_CLOCK_TIMESTAMP);
      const updateSpy = vi.spyOn(taskRepository, "update");
      const localDeduplicator = new RecurringTaskDeduplicator(
        taskRepository,
        checklistRepository,
        clock,
      );

      const scheduleWinner = buildTask({
        id: UUID_CHANGED_WINNER,
        original_task_id: ORIGINAL_ID_6,
        next_date: "2026-07-01",
        name: "Stale name",
        description: "Stale description",
        box: "inbox",
        sort_order: "stale-sort-key",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-06-01T10:00:00.000Z",
        syncStatus: "synced",
      });
      const freshContentLoser = buildTask({
        id: UUID_CHANGED_LOSER,
        original_task_id: ORIGINAL_ID_6,
        next_date: "2026-07-10",
        name: "Fresh name",
        description: "Fresh description",
        box: "later",
        sort_order: "fresh-sort-key",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-07-09T10:00:00.000Z",
      });
      await db.tasks.bulkAdd([scheduleWinner, freshContentLoser]);

      await localDeduplicator.deduplicate([ORIGINAL_ID_6]);

      const survivor = await db.tasks.get(UUID_CHANGED_WINNER);
      expect(survivor?.name).toBe("Fresh name");
      expect(survivor?.syncStatus).toBe(RECORD_SYNC_STATUS.PENDING);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: UUID_CHANGED_WINNER }),
      );
    });

    // Spec scenario: "Already-optimal winner is not rewritten." The winner
    // already carries both the earliest schedule triple AND the freshest
    // content/box/sort_order — merging is a no-op. This may already pass
    // today, since the current implementation never calls update() for the
    // schedule winner at all, so its syncStatus naturally stays whatever it
    // started as. Kept here as a characterization/regression guard so a
    // future merge implementation cannot start unconditionally rewriting
    // the winner.
    it("should not rewrite the winner when it is already optimal, keeping syncStatus synced", async () => {
      const taskRepository = new TaskRepository();
      const checklistRepository = new ChecklistRepository();
      const clock = fakeClock(FIXED_CLOCK_TIMESTAMP);
      const updateSpy = vi.spyOn(taskRepository, "update");
      const localDeduplicator = new RecurringTaskDeduplicator(
        taskRepository,
        checklistRepository,
        clock,
      );

      const optimalWinner = buildTask({
        id: UUID_OPTIMAL_WINNER,
        original_task_id: ORIGINAL_ID_7,
        next_date: "2026-07-01",
        appear_date: "2026-06-28",
        is_hidden: false,
        name: "Freshest name",
        description: "Freshest description",
        box: "inbox",
        sort_order: "optimal-sort-key",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-07-09T10:00:00.000Z",
        syncStatus: "synced",
      });
      const staleLoser = buildTask({
        id: UUID_OPTIMAL_LOSER,
        original_task_id: ORIGINAL_ID_7,
        next_date: "2026-07-10",
        appear_date: "2026-07-08",
        is_hidden: true,
        name: "Stale name",
        description: "Stale description",
        box: "later",
        sort_order: "stale-sort-key",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-06-01T10:00:00.000Z",
      });
      await db.tasks.bulkAdd([optimalWinner, staleLoser]);

      await localDeduplicator.deduplicate([ORIGINAL_ID_7]);

      const survivor = await db.tasks.get(UUID_OPTIMAL_WINNER);
      expect(survivor?.syncStatus).toBe("synced");
      expect(updateSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ id: UUID_OPTIMAL_WINNER }),
      );
    });
  });
});
