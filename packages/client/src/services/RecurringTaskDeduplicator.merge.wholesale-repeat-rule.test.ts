// implements FR3 of fix-stale-sync-overwrites
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { db } from "@/db/database";
import { buildTask } from "@/test/factories/taskFactory";
import {
  createRecurringTaskDeduplicatorMergeSetup,
  expectScheduleTripleWithFreshContent,
} from "./RecurringTaskDeduplicator.test-setup";

// Fifth scenario: proves a repeat_rule mismatch makes the freshest copy win
// wholesale, including next_date/appear_date, overriding the normal
// schedule-triple rule.
const UUID_RULE_MISMATCH_SCHEDULE_WINNER =
  "00000000-0000-4000-a000-000000000050";
const UUID_RULE_MISMATCH_FRESH_LOSER = "00000000-0000-4000-a000-000000000051";
const ORIGINAL_ID_5 = "55555555-5555-4555-a555-555555555555";

// Eighth scenario: 3-copy edge case. The schedule winner and the
// freshest-content copy SHARE the same repeat_rule, while a third, stale
// loser carries a DIFFERENT repeat_rule. Only scheduleWinner.repeat_rule vs
// freshestCopy.repeat_rule is ever compared to decide wholesale-vs-normal
// merge, so the stale loser's mismatching repeat_rule must be irrelevant —
// normal merge applies (schedule triple from the winner + content from the
// freshest copy), never wholesale.
const UUID_TRIPLE_SCHEDULE_WINNER = "00000000-0000-4000-a000-000000000080";
const UUID_TRIPLE_FRESH_CONTENT_LOSER = "00000000-0000-4000-a000-000000000081";
const UUID_TRIPLE_STALE_RULE_MISMATCH_LOSER =
  "00000000-0000-4000-a000-000000000082";
const ORIGINAL_ID_8 = "88888888-8888-4888-a888-888888888888";

describe("RecurringTaskDeduplicator — content merge from freshest updated_at", () => {
  const { getDeduplicator } = createRecurringTaskDeduplicatorMergeSetup();

  // FR3: when repeat_rule differs between copies, the freshest-updated_at
  // copy wins wholesale — all its fields, including next_date and
  // appear_date, override the normal schedule-triple-from-earliest-next_date
  // rule. A rule change recomputes dates under the new rule, so mixing old
  // schedule fields with a new repeat_rule would be incoherent.
  describe("differing repeat_rule — freshest copy wins wholesale", () => {
    it("should take all fields, including next_date and appear_date, from the freshest copy when repeat_rule differs", async () => {
      const scheduleWinner = buildTask({
        id: UUID_RULE_MISMATCH_SCHEDULE_WINNER,
        original_task_id: ORIGINAL_ID_5,
        repeat_rule: "daily-1",
        next_date: "2026-07-01",
        appear_date: "2026-06-30",
        is_hidden: false,
        name: "Stale name",
        description: "Stale description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-06-01T10:00:00.000Z",
      });
      const freshRuleChangedLoser = buildTask({
        id: UUID_RULE_MISMATCH_FRESH_LOSER,
        original_task_id: ORIGINAL_ID_5,
        repeat_rule: "weekly-Mon",
        next_date: "2026-07-06",
        appear_date: "2026-07-04",
        is_hidden: true,
        name: "Fresh name",
        description: "Fresh description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-07-09T10:00:00.000Z",
      });
      await db.tasks.bulkAdd([scheduleWinner, freshRuleChangedLoser]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_5]);

      const survivor = await db.tasks.get(UUID_RULE_MISMATCH_SCHEDULE_WINNER);
      expect(survivor?.repeat_rule).toBe("weekly-Mon");
      expect(survivor?.next_date).toBe("2026-07-06");
      expect(survivor?.appear_date).toBe("2026-07-04");
      expect(survivor?.is_hidden).toBe(true);
      expect(survivor?.name).toBe("Fresh name");
      expect(survivor?.description).toBe("Fresh description");
      expect(survivor?.updated_at).toBe("2026-07-09T10:00:00.000Z");
    });

    // Pinning test for the 3-copy edge (task 7.9): the schedule winner and
    // the freshest-content copy SHARE the same repeat_rule; only a third,
    // stale loser carries a different one. mergeWinner only ever compares
    // scheduleWinner.repeat_rule vs freshestCopy.repeat_rule — it never scans
    // every copy in the group — so this third copy's mismatching repeat_rule
    // must be irrelevant to the wholesale-vs-normal decision. Normal merge
    // applies: schedule triple from the winner, content from the freshest
    // copy, and the winner's own repeat_rule is left untouched. Locks in
    // this behavior so a future "fix" that scans ALL copies for a
    // repeat_rule mismatch would be caught by this test going red.
    it("should apply normal merge, not wholesale, when only a non-freshest third copy's repeat_rule differs from the schedule winner and freshest copy", async () => {
      const scheduleWinner = buildTask({
        id: UUID_TRIPLE_SCHEDULE_WINNER,
        original_task_id: ORIGINAL_ID_8,
        repeat_rule: "daily-1",
        next_date: "2026-07-01",
        appear_date: "2026-06-28",
        is_hidden: false,
        name: "Stale name",
        description: "Stale description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-06-01T10:00:00.000Z",
      });
      const freshContentLoser = buildTask({
        id: UUID_TRIPLE_FRESH_CONTENT_LOSER,
        original_task_id: ORIGINAL_ID_8,
        repeat_rule: "daily-1",
        next_date: "2026-07-10",
        appear_date: "2026-07-08",
        is_hidden: true,
        name: "Fresh name",
        description: "Fresh description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-07-09T10:00:00.000Z",
      });
      const staleRuleMismatchLoser = buildTask({
        id: UUID_TRIPLE_STALE_RULE_MISMATCH_LOSER,
        original_task_id: ORIGINAL_ID_8,
        repeat_rule: "weekly-Mon",
        next_date: "2026-07-05",
        appear_date: "2026-07-03",
        is_hidden: true,
        name: "Stale mismatch name",
        description: "Stale mismatch description",
        is_completed: false,
        is_deleted: false,
        updated_at: "2026-05-01T10:00:00.000Z",
      });
      await db.tasks.bulkAdd([
        scheduleWinner,
        freshContentLoser,
        staleRuleMismatchLoser,
      ]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_8]);

      const survivor = await db.tasks.get(UUID_TRIPLE_SCHEDULE_WINNER);
      // Schedule triple stays the schedule winner's own — wholesale was NOT
      // triggered — while content still merges normally from the freshest copy.
      expectScheduleTripleWithFreshContent(survivor, {
        nextDate: "2026-07-01",
        appearDate: "2026-06-28",
        isHidden: false,
      });
      // repeat_rule stays the schedule winner's own, proving the stale
      // loser's differing rule was never consulted.
      expect(survivor?.repeat_rule).toBe("daily-1");
      // The stale loser is soft-deleted as usual.
      expect(
        (await db.tasks.get(UUID_TRIPLE_STALE_RULE_MISMATCH_LOSER))?.is_deleted,
      ).toBe(true);
    });
  });
});
