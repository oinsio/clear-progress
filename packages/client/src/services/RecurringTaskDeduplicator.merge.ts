import type { Task } from "@/types/entities";

/**
 * Merges a duplicate recurring-task group into a single winner record.
 * Implements FR3 of fix-stale-sync-overwrites.
 */

const SCHEDULE_TRIPLE_FIELDS = [
  "next_date",
  "appear_date",
  "is_hidden",
] as const;
const CONTENT_FIELDS = [
  "name",
  "description",
  "goal_id",
  "context_id",
  "category_id",
] as const;
const BOX_PAIR_FIELDS = ["box", "sort_order"] as const;
const MERGE_RELEVANT_FIELDS = [
  ...SCHEDULE_TRIPLE_FIELDS,
  ...CONTENT_FIELDS,
  ...BOX_PAIR_FIELDS,
  "repeat_rule",
  "updated_at",
] as const;

/**
 * Finds the copy with the freshest `updated_at` among all copies in a
 * duplicate group (schedule winner included, per FR3: the winner itself
 * may already be the freshest).
 */
function findFreshestUpdatedAtCopy(copies: Task[]): Task {
  return copies.reduce((freshest, candidate) =>
    candidate.updated_at.localeCompare(freshest.updated_at) > 0
      ? candidate
      : freshest,
  );
}

/**
 * Computes the merged winner record per FR3 / Decision D3:
 * - schedule triple (next_date, appear_date, is_hidden) from the schedule winner
 * - content fields + box/sort_order pair from the freshest-updated_at copy
 * - identity fields (id, created_at, revision) stay the schedule winner's own
 * - updated_at is the freshest copy's own value, never refreshed to now
 * - if repeat_rule differs between the schedule winner and the freshest
 *   copy, the freshest copy wins wholesale (all fields, dates included)
 *
 * @param scheduleWinner - the copy with the earliest next_date (tiebreak by id)
 * @param allCopiesInGroup - every active copy in the duplicate group, winner included
 */
export function mergeWinner(
  scheduleWinner: Task,
  allCopiesInGroup: Task[],
): Task {
  const freshestCopy = findFreshestUpdatedAtCopy(allCopiesInGroup);

  if (freshestCopy.repeat_rule !== scheduleWinner.repeat_rule) {
    return {
      ...freshestCopy,
      id: scheduleWinner.id,
      created_at: scheduleWinner.created_at,
      revision: scheduleWinner.revision,
      syncStatus: scheduleWinner.syncStatus,
    };
  }

  return {
    ...scheduleWinner,
    name: freshestCopy.name,
    description: freshestCopy.description,
    goal_id: freshestCopy.goal_id,
    context_id: freshestCopy.context_id,
    category_id: freshestCopy.category_id,
    box: freshestCopy.box,
    sort_order: freshestCopy.sort_order,
    updated_at: freshestCopy.updated_at,
  };
}

/**
 * Compares the merged winner to the schedule winner's originally stored
 * values on the merge-relevant fields only (identity/bookkeeping fields
 * are excluded — they never change). Used to decide whether the merge
 * actually changed anything and thus whether to persist an update.
 */
export function hasMergeChangedWinner(
  mergedWinner: Task,
  originalScheduleWinner: Task,
): boolean {
  return MERGE_RELEVANT_FIELDS.some(
    (field) => mergedWinner[field] !== originalScheduleWinner[field],
  );
}
