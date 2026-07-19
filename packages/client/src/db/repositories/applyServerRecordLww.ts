import { Temporal } from "@/lib/temporal";

const PULL_CONFLICT_LOG_MESSAGE_TEMPLATE = (entityName: string): string =>
  `Sync conflict: pending local ${entityName} record overwritten by a newer server record`;

/**
 * Decides, per FR5 of fix-stale-sync-overwrites, whether a local `pending`
 * record must be overwritten by an incoming server record during
 * `applyServerRecords()`.
 *
 * A local `pending` record is overwritten iff the server record's
 * `updated_at` is strictly newer than the local record's `updated_at`
 * (compared via `Temporal.Instant.compare`, never string comparison).
 * Equal-or-newer local `updated_at` preserves the local record untouched.
 *
 * Local records with any other `syncStatus` (`synced`, `rejected`) or no
 * local record at all are always overwritten — callers should not consult
 * this helper for those cases at all, or may pass them through directly.
 *
 * When an overwrite of a `pending` record happens, logs a conflict warning
 * via `console.warn` with the entity type, record id, and both timestamps.
 *
 * Implements FR5 of fix-stale-sync-overwrites.
 */
export function shouldOverwritePendingLocalRecord(params: {
  entityName: string;
  id: string;
  localUpdatedAt: string;
  serverUpdatedAt: string;
}): boolean {
  const { entityName, id, localUpdatedAt, serverUpdatedAt } = params;

  const isServerStrictlyNewer =
    Temporal.Instant.compare(
      Temporal.Instant.from(serverUpdatedAt),
      Temporal.Instant.from(localUpdatedAt),
    ) > 0;

  if (!isServerStrictlyNewer) {
    return false;
  }

  console.warn(PULL_CONFLICT_LOG_MESSAGE_TEMPLATE(entityName), {
    id,
    localUpdatedAt,
    serverUpdatedAt,
  });

  return true;
}
