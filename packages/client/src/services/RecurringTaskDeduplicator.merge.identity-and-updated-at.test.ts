// implements FR3 of fix-stale-sync-overwrites
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { RECORD_SYNC_STATUS } from "@/constants";
import { db } from "@/db/database";
import { buildTask } from "@/test/factories/taskFactory";
import {
  createRecurringTaskDeduplicatorMergeSetup,
  FIXED_CLOCK_TIMESTAMP,
} from "./RecurringTaskDeduplicator.test-setup";

// Third scenario reused here: proves identity/bookkeeping fields (id,
// created_at, revision) always stay the winner's own regardless of which
// copy is freshest.
const UUID_BOX_SCHEDULE_WINNER = "00000000-0000-4000-a000-000000000030";
const UUID_BOX_FRESH_CONTENT_LOSER = "00000000-0000-4000-a000-000000000031";
const ORIGINAL_ID_3 = "33333333-3333-4333-a333-333333333333";

// Fourth scenario: proves the merged winner's updated_at is taken verbatim
// from the freshest copy — never refreshed to the clock's "now".
const UUID_UPDATED_AT_SCHEDULE_WINNER = "00000000-0000-4000-a000-000000000040";
const UUID_UPDATED_AT_FRESH_CONTENT_LOSER =
  "00000000-0000-4000-a000-000000000041";
const ORIGINAL_ID_4 = "44444444-4444-4444-a444-444444444444";

describe("RecurringTaskDeduplicator — content merge from freshest updated_at", () => {
  const { getDeduplicator } = createRecurringTaskDeduplicatorMergeSetup();

  // FR3: id, created_at and revision are identity/bookkeeping fields that
  // always stay the schedule winner's own, regardless of which copy is
  // freshest by updated_at or which has different content. The winner
  // record survives (only the loser is soft-deleted), so these fields are
  // never overwritten by the merge.
  describe("identity fields stay the winner's own regardless of merge", () => {
    it("should keep id, created_at and revision as the schedule winner's own values", async () => {
      const scheduleWinner = buildTask({
        id: UUID_BOX_SCHEDULE_WINNER,
        original_task_id: ORIGINAL_ID_3,
        next_date: "2026-07-01",
        created_at: "2026-01-01T00:00:00.000Z",
        revision: 5,
        name: "Stale name",
        description: "Stale description",
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
        created_at: "2026-02-02T00:00:00.000Z",
        revision: 9,
        name: "Fresh name",
        description: "Fresh description",
        box: "later",
        sort_order: "fresh-sort-key",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-07-09T10:00:00.000Z",
      });
      await db.tasks.bulkAdd([scheduleWinner, freshContentLoser]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_3]);

      const survivor = await db.tasks.get(UUID_BOX_SCHEDULE_WINNER);
      expect(survivor?.id).toBe(UUID_BOX_SCHEDULE_WINNER);
      expect(survivor?.created_at).toBe("2026-01-01T00:00:00.000Z");
      expect(survivor?.revision).toBe(5);
    });
  });

  // FR3: the merged winner's updated_at must equal the freshest copy's
  // updated_at verbatim, never refreshed to the current clock time — unlike
  // a loser's soft-delete updated_at, which the implementation does set to
  // now. FIXED_CLOCK_TIMESTAMP here is a third distinct timestamp from both
  // copies' updated_at, so a bug that clobbers the winner's updated_at with
  // "now" is caught.
  // Verifies M2 of fix-stale-sync-overwrites
  describe("winner's updated_at takes the freshest copy's value, never refreshed to now", () => {
    it("should set the merged winner's updated_at to the freshest copy's updated_at, not the current clock time", async () => {
      const scheduleWinner = buildTask({
        id: UUID_UPDATED_AT_SCHEDULE_WINNER,
        original_task_id: ORIGINAL_ID_4,
        next_date: "2026-07-01",
        name: "Stale name",
        description: "Stale description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-06-01T10:00:00.000Z",
      });
      const freshContentLoser = buildTask({
        id: UUID_UPDATED_AT_FRESH_CONTENT_LOSER,
        original_task_id: ORIGINAL_ID_4,
        next_date: "2026-07-10",
        name: "Fresh name",
        description: "Fresh description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-07-09T10:00:00.000Z",
      });
      await db.tasks.bulkAdd([scheduleWinner, freshContentLoser]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_4]);

      const survivor = await db.tasks.get(UUID_UPDATED_AT_SCHEDULE_WINNER);
      expect(survivor?.updated_at).toBe("2026-07-09T10:00:00.000Z");
      expect(survivor?.updated_at).not.toBe(FIXED_CLOCK_TIMESTAMP);
      expect(survivor?.syncStatus).toBe(RECORD_SYNC_STATUS.PENDING);
    });
  });
});
