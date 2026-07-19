// implements FR3 of fix-stale-sync-overwrites
import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { db } from "@/db/database";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import {
  createRecurringTaskDeduplicatorMergeSetup,
  FRESH_CATEGORY_ID,
  FRESH_CONTEXT_ID,
  FRESH_GOAL_ID,
  ORIGINAL_ID_1,
  STALE_CATEGORY_ID,
  STALE_CONTEXT_ID,
  STALE_GOAL_ID,
  UUID_FRESH_CONTENT_LOSER,
  UUID_SCHEDULE_WINNER,
} from "./RecurringTaskDeduplicator.test-setup";

// Schedule winner carrying stale content: earliest next_date (wins the
// schedule comparison) but the oldest updated_at (loses the content merge).
// Per-test overrides supply the content fields under assertion.
function buildStaleContentScheduleWinner(overrides: Partial<Task> = {}) {
  return buildTask({
    id: UUID_SCHEDULE_WINNER,
    original_task_id: ORIGINAL_ID_1,
    next_date: "2026-07-01",
    name: "Stale name",
    description: "Stale description",
    is_completed: false,
    is_deleted: false,
    updated_at: "2026-06-01T10:00:00.000Z",
    ...overrides,
  });
}

// Loser by schedule (later next_date) but freshest updated_at, so its
// content fields must survive the content merge. Per-test overrides supply
// the content fields under assertion.
function buildFreshContentLoser(overrides: Partial<Task> = {}) {
  return buildTask({
    id: UUID_FRESH_CONTENT_LOSER,
    original_task_id: ORIGINAL_ID_1,
    next_date: "2026-07-10",
    name: "Fresh name",
    description: "Fresh description",
    is_completed: false,
    is_deleted: false,
    updated_at: "2026-07-09T10:00:00.000Z",
    ...overrides,
  });
}

// FR3: winner keeps schedule (earliest next_date) but content fields come
// from whichever copy has the freshest updated_at, even when that copy
// loses the schedule comparison.
describe("RecurringTaskDeduplicator — content merge from freshest updated_at", () => {
  const { getDeduplicator } = createRecurringTaskDeduplicatorMergeSetup();

  describe("name and description merge from freshest updated_at copy", () => {
    it("should take name and description from the freshest-updated_at copy, not the schedule winner", async () => {
      await db.tasks.bulkAdd([
        buildStaleContentScheduleWinner(),
        buildFreshContentLoser(),
      ]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const survivor = await db.tasks.get(UUID_SCHEDULE_WINNER);
      expect(survivor?.name).toBe("Fresh name");
      expect(survivor?.description).toBe("Fresh description");
    });

    // Guards the strict `>` comparison in findFreshestUpdatedAtCopy: when two
    // copies share the exact same updated_at, the first-encountered copy
    // (the schedule winner, since it appears first in allCopiesInGroup) must
    // stay "freshest" — a `>=` comparison would instead let the later copy
    // in iteration order win the tie, flipping which content survives.
    it("should keep the first copy's content as freshest when two copies share the exact same updated_at", async () => {
      const sameUpdatedAt = "2026-07-05T10:00:00.000Z";
      await db.tasks.bulkAdd([
        buildStaleContentScheduleWinner({
          name: "Schedule winner name",
          description: "Schedule winner description",
          updated_at: sameUpdatedAt,
        }),
        buildFreshContentLoser({
          name: "Tied loser name",
          description: "Tied loser description",
          updated_at: sameUpdatedAt,
        }),
      ]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const survivor = await db.tasks.get(UUID_SCHEDULE_WINNER);
      expect(survivor?.name).toBe("Schedule winner name");
      expect(survivor?.description).toBe("Schedule winner description");
    });

    it("should keep next_date from the schedule winner despite content coming from the freshest copy", async () => {
      await db.tasks.bulkAdd([
        buildStaleContentScheduleWinner(),
        buildFreshContentLoser(),
      ]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const survivor = await db.tasks.get(UUID_SCHEDULE_WINNER);
      expect(survivor?.next_date).toBe("2026-07-01");
    });
  });

  describe("goal_id, context_id and category_id merge from freshest updated_at copy", () => {
    it("should take goal_id, context_id and category_id from the freshest-updated_at copy, not the schedule winner", async () => {
      await db.tasks.bulkAdd([
        buildStaleContentScheduleWinner({
          goal_id: STALE_GOAL_ID,
          context_id: STALE_CONTEXT_ID,
          category_id: STALE_CATEGORY_ID,
        }),
        buildFreshContentLoser({
          goal_id: FRESH_GOAL_ID,
          context_id: FRESH_CONTEXT_ID,
          category_id: FRESH_CATEGORY_ID,
        }),
      ]);

      await getDeduplicator().deduplicate([ORIGINAL_ID_1]);

      const survivor = await db.tasks.get(UUID_SCHEDULE_WINNER);
      expect(survivor?.goal_id).toBe(FRESH_GOAL_ID);
      expect(survivor?.context_id).toBe(FRESH_CONTEXT_ID);
      expect(survivor?.category_id).toBe(FRESH_CATEGORY_ID);
    });
  });
});
