// implements FR7, FR8 of fix-push-poison-pill
import { RECORD_SYNC_STATUS } from "@/constants";

/**
 * Returns Tailwind border-color class based on the record's sync status.
 * - rejected: red left border
 * - pending: amber left border
 * - synced: transparent (no visible border)
 *
 * Implements FR7, FR8 of fix-push-poison-pill.
 */
export function getSyncStatusBorderClass(syncStatus: string): string {
  switch (syncStatus) {
    case RECORD_SYNC_STATUS.REJECTED:
      return "border-l-red-500";
    case RECORD_SYNC_STATUS.PENDING:
      return "border-l-amber-400";
    default:
      return "border-l-transparent";
  }
}

/**
 * Resolves the effective sync status for an entity that may have children
 * (checklist items, attachments) with their own sync status.
 * The "worst" status wins: rejected > pending > synced.
 *
 * Implements FR7, FR8 of fix-push-poison-pill.
 */
export function getEffectiveSyncStatus(
  entitySyncStatus: string,
  hasUnsyncedChildren: boolean,
): string {
  if (entitySyncStatus === RECORD_SYNC_STATUS.REJECTED) {
    return RECORD_SYNC_STATUS.REJECTED;
  }
  if (entitySyncStatus === RECORD_SYNC_STATUS.PENDING || hasUnsyncedChildren) {
    return RECORD_SYNC_STATUS.PENDING;
  }
  return RECORD_SYNC_STATUS.SYNCED;
}
