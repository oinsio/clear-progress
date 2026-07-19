// implements FR3 of fix-stale-sync-overwrites
import { beforeEach, expect } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import type { Task } from "@/types/entities";
import { RecurringTaskDeduplicator } from "./RecurringTaskDeduplicator";

// This must remain a THIRD distinct timestamp from every copy's updated_at
// used across the merge test files, so tests can prove the winner's
// updated_at is taken from the freshest copy verbatim — never refreshed to
// "now" the way a loser's soft-delete updated_at is.
export const FIXED_CLOCK_TIMESTAMP = "2026-07-10T12:00:00Z";

/**
 * Shared beforeEach for RecurringTaskDeduplicator merge test files: clears
 * the tasks/checklist_items tables and constructs a deduplicator wired to a
 * fake clock fixed at FIXED_CLOCK_TIMESTAMP.
 */
export function createRecurringTaskDeduplicatorMergeSetup(): {
  getDeduplicator: () => RecurringTaskDeduplicator;
} {
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

  return {
    getDeduplicator: () => deduplicator,
  };
}

// The freshest-updated_at copy across the merge scenarios always carries
// this name/description, so the merged survivor's content must match it.
export const FRESH_CONTENT_NAME = "Fresh name";
export const FRESH_CONTENT_DESCRIPTION = "Fresh description";

/**
 * Asserts the FR3 merge invariant shared by the schedule-and-box and
 * wholesale-repeat-rule scenarios: the schedule triple (next_date +
 * appear_date + is_hidden) stays coupled to the schedule winner's own copy,
 * while name/description merge from the freshest-updated_at copy.
 * Implements FR3 of fix-stale-sync-overwrites.
 */
export function expectScheduleTripleWithFreshContent(
  survivor: Task | undefined,
  scheduleTriple: { nextDate: string; appearDate: string; isHidden: boolean },
): void {
  expect(survivor?.next_date).toBe(scheduleTriple.nextDate);
  expect(survivor?.appear_date).toBe(scheduleTriple.appearDate);
  expect(survivor?.is_hidden).toBe(scheduleTriple.isHidden);
  expect(survivor?.name).toBe(FRESH_CONTENT_NAME);
  expect(survivor?.description).toBe(FRESH_CONTENT_DESCRIPTION);
}

// Deterministic UUIDs for predictable winner-by-schedule ordering, shared
// across the merge test files that use scenario 1 (content fields).
export const UUID_SCHEDULE_WINNER = "00000000-0000-4000-a000-000000000010";
export const UUID_FRESH_CONTENT_LOSER = "00000000-0000-4000-a000-000000000011";
export const ORIGINAL_ID_1 = "11111111-1111-4111-a111-111111111111";
export const STALE_GOAL_ID = "aaaaaaaa-0000-4000-a000-000000000001";
export const STALE_CONTEXT_ID = "aaaaaaaa-0000-4000-a000-000000000002";
export const STALE_CATEGORY_ID = "aaaaaaaa-0000-4000-a000-000000000003";
export const FRESH_GOAL_ID = "bbbbbbbb-0000-4000-a000-000000000001";
export const FRESH_CONTEXT_ID = "bbbbbbbb-0000-4000-a000-000000000002";
export const FRESH_CATEGORY_ID = "bbbbbbbb-0000-4000-a000-000000000003";

// Deterministic UUIDs for predictable tiebreak ordering, shared across the
// characterization test files (winner selection, loser soft-delete,
// multiple groups, skip optimization, guards).
export const UUID_A = "00000000-0000-4000-a000-000000000001";
export const UUID_B = "00000000-0000-4000-a000-000000000002";
export const UUID_C = "00000000-0000-4000-a000-000000000003";
export const UUID_Z = "ffffffff-ffff-4fff-afff-ffffffffffff";
export const ORIGINAL_ID_2 = "22222222-2222-4222-a222-222222222222";
