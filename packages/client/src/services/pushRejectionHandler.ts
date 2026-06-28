// implements FR5 of fix-push-poison-pill

import { RECORD_SYNC_STATUS } from "@/constants";

/** Reason prefixes from server rejection responses */
const FK_VIOLATION_PREFIX = "fk_violation:";
const CHECK_VIOLATION_PREFIX = "check_violation:";
const UNIQUE_VIOLATION = "unique_violation";

/** FK fields that can be healed by clearing the reference */
const CLEARABLE_FK_FIELDS = new Set(["goal_id", "context_id", "category_id"]);

/** FK fields where the record should be soft-deleted */
const DELETE_FK_FIELDS = new Set(["task_id"]);

export interface ServerRejectionResult {
  isHealable: boolean;
  healedFields?: Record<string, unknown>;
  syncStatus: string;
}

/**
 * Determines how to handle a server-rejected record based on the reason.
 *
 * Implements FR5 of fix-push-poison-pill
 *
 * @param reason - Structured reason from server (e.g., "fk_violation:goal_id")
 * @returns Result indicating whether the rejection is healable and what fields to fix
 */
export function handleServerRejection(
  reason: string | undefined,
): ServerRejectionResult {
  if (!reason) {
    return { isHealable: false, syncStatus: RECORD_SYNC_STATUS.REJECTED };
  }

  if (reason.startsWith(FK_VIOLATION_PREFIX)) {
    const fieldName = reason.slice(FK_VIOLATION_PREFIX.length);

    if (CLEARABLE_FK_FIELDS.has(fieldName)) {
      return {
        isHealable: true,
        healedFields: { [fieldName]: "" },
        syncStatus: RECORD_SYNC_STATUS.PENDING,
      };
    }

    if (DELETE_FK_FIELDS.has(fieldName)) {
      return {
        isHealable: true,
        healedFields: { is_deleted: true },
        syncStatus: RECORD_SYNC_STATUS.PENDING,
      };
    }

    // Unknown FK field — unhealable
    return { isHealable: false, syncStatus: RECORD_SYNC_STATUS.REJECTED };
  }

  if (
    reason.startsWith(CHECK_VIOLATION_PREFIX) ||
    reason === UNIQUE_VIOLATION
  ) {
    return { isHealable: false, syncStatus: RECORD_SYNC_STATUS.REJECTED };
  }

  // Unknown reason — unhealable
  return { isHealable: false, syncStatus: RECORD_SYNC_STATUS.REJECTED };
}
