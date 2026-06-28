// implements FR1 of fix-push-poison-pill

import { BOX } from "@/constants";
import type { Clock } from "@/lib/temporal";
import { toISOTimestamp } from "@/utils/dateHelpers";
import type { SyncAlert } from "./types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const UNTITLED_NAME = "(untitled)";
const DEFAULT_SORT_ORDER = "0";
const DEFAULT_FILE_SIZE = 0;

/** Checks if value is a valid UUID v4 string */
export function isValidUUID(value: unknown): boolean {
  return typeof value === "string" && UUID_REGEX.test(value);
}

/** Checks if value is a valid ISO timestamp */
export function isValidISOTimestamp(value: unknown): boolean {
  return typeof value === "string" && ISO_TIMESTAMP_REGEX.test(value);
}

/** Checks if value is a valid ISO date or empty string */
export function isValidISODateOrEmpty(value: unknown): boolean {
  if (value === "") return true;
  return typeof value === "string" && ISO_DATE_REGEX.test(value);
}

/** Checks if value is a valid ISO timestamp or empty string */
export function isValidISOTimestampOrEmpty(value: unknown): boolean {
  if (value === "") return true;
  return isValidISOTimestamp(value);
}

/** Checks if value is a valid UUID or empty string */
export function isValidUUIDOrEmpty(value: unknown): boolean {
  if (value === "") return true;
  return isValidUUID(value);
}

/** Heal a required ISO timestamp field by replacing with now() */
export function healTimestamp(clock: Clock): string {
  return toISOTimestamp(clock);
}

/** Heal FK field (UUID or empty) by setting to empty string */
export function healForeignKey(): string {
  return "";
}

/** Heal a boolean field by setting to false */
export function healBoolean(): boolean {
  return false;
}

/** Heal optional ISO timestamp (or empty) by setting to empty string */
export function healOptionalTimestamp(): string {
  return "";
}

/** Heal optional ISO date (or empty) by setting to empty string */
export function healOptionalDate(): string {
  return "";
}

/** Heal repeat_rule by setting to empty string, with alert */
export function healRepeatRule(): { value: string; alert: SyncAlert } {
  return {
    value: "",
    alert: { messageKey: "sync.alert.repeat_rule_reset" },
  };
}

/** Heal missing/empty name by setting to "(untitled)", with alert */
export function healMissingName(): { value: string; alert: SyncAlert } {
  return {
    value: UNTITLED_NAME,
    alert: { messageKey: "sync.alert.name_set_untitled" },
  };
}

/** Heal missing/empty sort_order by setting to "0" */
export function healSortOrder(): string {
  return DEFAULT_SORT_ORDER;
}

/** Heal missing/empty box by setting to inbox */
export function healMissingBox(): string {
  return BOX.INBOX;
}

/** Heal invalid file_size by setting to 0 */
export function healFileSize(): number {
  return DEFAULT_FILE_SIZE;
}

/**
 * Heal checklist item with invalid task_id by marking as deleted.
 * Returns alert about deletion.
 */
export function healChecklistItemTaskId(): {
  isDeleted: boolean;
  alert: SyncAlert;
} {
  return {
    isDeleted: true,
    alert: { messageKey: "sync.alert.checklist_item_deleted" },
  };
}
