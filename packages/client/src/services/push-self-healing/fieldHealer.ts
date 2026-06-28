// implements FR1 of fix-push-poison-pill

import type { Clock } from "@/lib/temporal";
import {
  healBoolean,
  healChecklistItemTaskId,
  healFileSize,
  healForeignKey,
  healMissingName,
  healOptionalDate,
  healOptionalTimestamp,
  healRepeatRule,
  healSortOrder,
  healTimestamp,
  isValidISODateOrEmpty,
  isValidISOTimestamp,
  isValidISOTimestampOrEmpty,
  isValidUUID,
  isValidUUIDOrEmpty,
} from "./healingRules";
import type { HealableEntityType, SyncAlert } from "./types";

/** Nil UUID used as placeholder when healing checklist item task_id */
const NIL_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * Attempts to heal a single field that failed Zod validation.
 * Mutates healedRecord in place. Returns true if healed successfully.
 */
export function tryHealField(
  fieldName: string,
  healedRecord: Record<string, unknown>,
  entityType: HealableEntityType,
  alerts: SyncAlert[],
  clock: Clock,
): boolean {
  const currentValue = healedRecord[fieldName];

  // Timestamp fields (created_at, updated_at)
  if (fieldName === "created_at" || fieldName === "updated_at") {
    if (!isValidISOTimestamp(currentValue)) {
      healedRecord[fieldName] = healTimestamp(clock);
      return true;
    }
  }

  // FK fields (goal_id, context_id, category_id, original_task_id)
  if (
    fieldName === "goal_id" ||
    fieldName === "context_id" ||
    fieldName === "category_id" ||
    fieldName === "original_task_id"
  ) {
    if (!isValidUUIDOrEmpty(currentValue)) {
      healedRecord[fieldName] = healForeignKey();
      return true;
    }
  }

  // Checklist item task_id — special case: mark as deleted + fix task_id
  if (fieldName === "task_id" && entityType === "checklist_item") {
    if (!isValidUUID(currentValue)) {
      const healResult = healChecklistItemTaskId();
      healedRecord.is_deleted = healResult.isDeleted;
      healedRecord.task_id = NIL_UUID;
      alerts.push(healResult.alert);
      return true;
    }
  }

  // Boolean fields
  if (
    fieldName === "is_completed" ||
    fieldName === "is_hidden" ||
    fieldName === "is_deleted"
  ) {
    if (typeof currentValue !== "boolean") {
      healedRecord[fieldName] = healBoolean();
      return true;
    }
  }

  // Optional timestamp fields (completed_at)
  if (fieldName === "completed_at") {
    if (!isValidISOTimestampOrEmpty(currentValue)) {
      healedRecord[fieldName] = healOptionalTimestamp();
      return true;
    }
  }

  // Optional date fields (next_date, appear_date)
  if (fieldName === "next_date" || fieldName === "appear_date") {
    if (!isValidISODateOrEmpty(currentValue)) {
      healedRecord[fieldName] = healOptionalDate();
      return true;
    }
  }

  // repeat_rule — must be string
  if (fieldName === "repeat_rule") {
    if (typeof currentValue !== "string") {
      const healResult = healRepeatRule();
      healedRecord[fieldName] = healResult.value;
      alerts.push(healResult.alert);
      return true;
    }
  }

  // name — must be non-empty string (non-type Zod errors, e.g. not a string)
  if (fieldName === "name") {
    if (!currentValue || typeof currentValue !== "string") {
      const healResult = healMissingName();
      healedRecord[fieldName] = healResult.value;
      alerts.push(healResult.alert);
      return true;
    }
  }

  // sort_order — must be non-empty string
  if (fieldName === "sort_order") {
    if (!currentValue || currentValue === "") {
      healedRecord[fieldName] = healSortOrder();
      return true;
    }
  }

  // file_size — must be number
  if (fieldName === "file_size") {
    if (typeof currentValue !== "number") {
      healedRecord[fieldName] = healFileSize();
      return true;
    }
  }

  // Unknown field error — cannot heal
  return false;
}
