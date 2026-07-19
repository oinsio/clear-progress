// implements FR3 of fix-stale-sync-overwrites
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { db } from "@/db/database";
import { buildTask } from "@/test/factories/taskFactory";
import {
  createRecurringTaskDeduplicatorMergeSetup,
  ORIGINAL_ID_1,
  UUID_FRESH_CONTENT_LOSER,
  UUID_SCHEDULE_WINNER,
} from "./RecurringTaskDeduplicator.test-setup";

// Second scenario: schedule winner is NOT the freshest-updated_at copy,
// used to prove the schedule triple (next_date + appear_date + is_hidden)
// stays coupled to the schedule winner's copy even though content merges
// from the other copy.
const UUID_HIDDEN_SCHEDULE_WINNER = "00000000-0000-4000-a000-000000000020";
const UUID_REVEALED_FRESH_CONTENT_LOSER =
  "00000000-0000-4000-a000-000000000021";
const ORIGINAL_ID_2 = "22222222-2222-4222-a222-222222222222";

// Third scenario: proves box + sort_order travel together as a pair from
// the freshest-updated_at copy.
const UUID_BOX_SCHEDULE_WINNER = "00000000-0000-4000-a000-000000000030";
const UUID_BOX_FRESH_CONTENT_LOSER = "00000000-0000-4000-a000-000000000031";
const ORIGINAL_ID_3 = "33333333-3333-4333-a333-333333333333";

describe("RecurringTaskDeduplicator — content merge from freshest updated_at", () => {
  const { getDeduplicator } = createRecurringTaskDeduplicatorMergeSetup();

  // FR3: next_date, appear_date and is_hidden always travel together as a
  // schedule triple from the earliest-next_date copy, even when that copy
  // is not the freshest-updated_at copy (content merges from the other one).
  describe("schedule triple (next_date, appear_date, is_hidden) stays coupled to the schedule winner", () => {
    it("should take appear_date and is_hidden from the SAME copy as next_date, not from the freshest-content copy", async () => {
      // Schedule winner: earliest next_date, but stale content and NOT the
      // freshest-updated_at copy. Its own appear_date/is_hidden must survive
      // the merge untouched by the other copy's schedule fields.
      const scheduleWinner = buildTask({
        id: UUID_SCHEDULE_WINNER,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-01",
        appear_date: "2026-06-28",
        is_hidden: false,
        name: "Stale name",
        description: "Stale description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-06-01T10:00:00.000Z",
      });
      // Freshest-content copy: later next_date/appear_date and a different
      // is_hidden value. Without a real schedule-triple merge, a naive
      // "take is_hidden/appear_date from the freshest copy" implementation
      // would leak this copy's schedule fields onto the winner.
      const freshContentLoser = buildTask({
        id: UUID_FRESH_CONTENT_LOSER,
        original_task_id: ORIGINAL_ID_1,
        next_date: "2026-07-10",
        appear_date: "2026-07-08",
        is_hidden: true,
        name: "Fresh name",
        description: "Fresh description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-07-09T10:00:00.000Z",
      });
      await db.tasks.bulkAdd([scheduleWinner, freshContentLoser]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const survivor = await db.tasks.get(UUID_SCHEDULE_WINNER);
      expect(survivor?.next_date).toBe("2026-07-01");
      expect(survivor?.appear_date).toBe("2026-06-28");
      expect(survivor?.is_hidden).toBe(false);
      // Content still merges from the freshest copy in the same pass.
      expect(survivor?.name).toBe("Fresh name");
      expect(survivor?.description).toBe("Fresh description");
    });

    // Spec scenario: "Hidden and revealed copies merge without breaking
    // reveal timing." Schedule winner is hidden with a future appear_date;
    // the freshest-content copy is already revealed. The merged winner must
    // stay hidden with the schedule the winner's appear_date — content merge
    // must never silently reveal the task.
    it("should keep the winner hidden with the schedule winner's appear_date when the freshest-content copy is revealed", async () => {
      const hiddenScheduleWinner = buildTask({
        id: UUID_HIDDEN_SCHEDULE_WINNER,
        original_task_id: ORIGINAL_ID_2,
        next_date: "2026-08-01",
        appear_date: "2026-07-30",
        is_hidden: true,
        name: "Stale hidden copy",
        description: "Stale description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-06-01T10:00:00.000Z",
      });
      const revealedFreshContentLoser = buildTask({
        id: UUID_REVEALED_FRESH_CONTENT_LOSER,
        original_task_id: ORIGINAL_ID_2,
        next_date: "2026-08-15",
        appear_date: "",
        is_hidden: false,
        name: "Fresh revealed copy",
        description: "Fresh description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-07-09T10:00:00.000Z",
      });
      await db.tasks.bulkAdd([hiddenScheduleWinner, revealedFreshContentLoser]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_2]);

      const survivor = await db.tasks.get(UUID_HIDDEN_SCHEDULE_WINNER);
      expect(survivor?.is_hidden).toBe(true);
      expect(survivor?.appear_date).toBe("2026-07-30");
      expect(survivor?.next_date).toBe("2026-08-01");
      // Content still merges from the freshest (revealed) copy.
      expect(survivor?.name).toBe("Fresh revealed copy");
      expect(survivor?.description).toBe("Fresh description");
    });
  });

  // FR3: box and sort_order are a per-box sort-key pair — they must travel
  // together from the freshest-updated_at copy, never mixed across copies,
  // even when that copy loses the schedule comparison.
  describe("box and sort_order merge from freshest updated_at copy as a pair", () => {
    it("should take box and sort_order together from the freshest-updated_at copy, not the schedule winner", async () => {
      const scheduleWinner = buildTask({
        id: UUID_BOX_SCHEDULE_WINNER,
        original_task_id: ORIGINAL_ID_3,
        next_date: "2026-07-01",
        box: "inbox",
        sort_order: "stale-sort-key",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-06-01T10:00:00.000Z",
      });
      const freshContentLoser = buildTask({
        id: UUID_BOX_FRESH_CONTENT_LOSER,
        original_task_id: ORIGINAL_ID_3,
        next_date: "2026-07-10",
        box: "later",
        sort_order: "fresh-sort-key",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-07-09T10:00:00.000Z",
      });
      await db.tasks.bulkAdd([scheduleWinner, freshContentLoser]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_3]);

      const survivor = await db.tasks.get(UUID_BOX_SCHEDULE_WINNER);
      expect(survivor?.box).toBe("later");
      expect(survivor?.sort_order).toBe("fresh-sort-key");
    });
  });
});
