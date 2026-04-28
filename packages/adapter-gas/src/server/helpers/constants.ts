import type { Box, GoalStatus } from "../types";

export const APP_NAME = "clear_progress";
export const API_VERSION = "1.0";

export const SHEET_NAMES = {
  TASKS: "Tasks",
  GOALS: "Goals",
  CONTEXTS: "Contexts",
  CATEGORIES: "Categories",
  CHECKLIST_ITEMS: "Checklist_Items",
  IDEAS: "Ideas",
  SETTINGS: "Settings",
  META: "Meta",
} as const;

export const META_KEYS = {
  NEXT_REVISION: "next_revision",
  PURGE_REVISION: "purge_revision",
} as const;

export const LOCK_TIMEOUT_MS = 30000;
export const META_INITIAL_REVISION = 1;
export const META_INITIAL_PURGE_REVISION = 0;

export const DRIVE_FOLDER_NAMES = {
  ROOT: "Clear_Progress",
  DATA_FILE: "Clear_Progress_Data",
  COVERS: "Covers",
} as const;

export const DRIVE_MIME_TYPES = {
  FOLDER: "application/vnd.google-apps.folder",
  SPREADSHEET: "application/vnd.google-apps.spreadsheet",
} as const;

export const PROPERTY_KEYS = {
  SPREADSHEET_ID: "SPREADSHEET_ID",
  FOLDER_ID: "FOLDER_ID",
  COVERS_FOLDER_ID: "COVERS_FOLDER_ID",
  OWNER_EMAIL: "OWNER_EMAIL",
} as const;

export const GOOGLE_TOKENINFO_URL =
  "https://www.googleapis.com/oauth2/v3/tokeninfo";

export const SHEET_HEADERS: Record<string, string[]> = {
  [SHEET_NAMES.TASKS]: [
    "id",
    "name",
    "description",
    "box",
    "goal_id",
    "context_id",
    "category_id",
    "is_completed",
    "completed_at",
    "repeat_rule",
    "is_hidden",
    "next_date",
    "appear_date",
    "original_task_id",
    "sort_order",
    "is_deleted",
    "created_at",
    "updated_at",
    "version",
    "revision",
  ],
  [SHEET_NAMES.GOALS]: [
    "id",
    "name",
    "description",
    "cover_file_id",
    "status",
    "sort_order",
    "is_deleted",
    "created_at",
    "updated_at",
    "version",
    "revision",
  ],
  [SHEET_NAMES.CONTEXTS]: [
    "id",
    "name",
    "sort_order",
    "is_deleted",
    "created_at",
    "updated_at",
    "version",
    "revision",
  ],
  [SHEET_NAMES.CATEGORIES]: [
    "id",
    "name",
    "sort_order",
    "is_deleted",
    "created_at",
    "updated_at",
    "version",
    "revision",
  ],
  [SHEET_NAMES.CHECKLIST_ITEMS]: [
    "id",
    "task_id",
    "name",
    "is_completed",
    "sort_order",
    "is_deleted",
    "created_at",
    "updated_at",
    "version",
    "revision",
  ],
  [SHEET_NAMES.IDEAS]: [
    "id",
    "name",
    "description",
    "sort_order",
    "is_deleted",
    "created_at",
    "updated_at",
    "version",
    "revision",
  ],
  [SHEET_NAMES.SETTINGS]: ["key", "value", "updated_at"],
};

export function colMap(sheetName: string): Record<string, number> {
  return Object.fromEntries(SHEET_HEADERS[sheetName].map((col, i) => [col, i]));
}

export const ACTIONS = {
  PING: "ping",
  INIT: "init",
  PULL: "pull",
  PUSH: "push",
  UPLOAD_COVER: "upload_cover",
  UPLOAD_COVERS: "upload_covers",
  DELETE_COVER: "delete_cover",
  GET_COVER: "get_cover",
  PURGE: "purge",
} as const;

export const DRIVE_PERMISSIONS = {
  ROLE_READER: "reader",
  TYPE_ANYONE: "anyone",
} as const;

export const DEFAULT_SETTINGS = {
  DEFAULT_BOX: { key: "default_box", value: "inbox" },
  ACCENT_COLOR: { key: "accent_color", value: "green" },
} as const;

export const VALID_BOXES = ["inbox", "today", "week", "later"];
export const VALID_GOAL_STATUSES = [
  "planning",
  "in_progress",
  "paused",
  "completed",
  "cancelled",
];

export const CONFLICT_RESOLUTION = {
  ACCEPT: "accept",
  CONFLICT: "conflict",
} as const;

export const PUSH_STATUSES = {
  CREATED: "created",
  ACCEPTED: "accepted",
  CONFLICT: "conflict",
  REJECTED: "rejected",
} as const;

export const DRIVE_QUERY_FIELDS = {
  COVER_FILES: "files(id,description)",
  FILE_EXISTS: "id,trashed",
} as const;

export const COVER_HASH_PREFIX_LENGTH = 12;
export const MAX_COVER_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_COVER_BATCH_SIZE = 10;
export const DEFAULT_COVER_EXTENSION = "jpg";

export const DEFAULT_TASK_BOX = "inbox";
export const DEFAULT_GOAL_STATUS = "planning";

export const SHEET_BOOL_TRUE = "TRUE";

export function coerceSheetBool(value: unknown): boolean {
  return value === true || value === SHEET_BOOL_TRUE;
}

export function coerceSheetBox(value: unknown): Box {
  const str = String(value ?? DEFAULT_TASK_BOX);
  return VALID_BOXES.includes(str) ? (str as Box) : (DEFAULT_TASK_BOX as Box);
}

export function coerceSheetGoalStatus(value: unknown): GoalStatus {
  const str = String(value ?? DEFAULT_GOAL_STATUS);
  return VALID_GOAL_STATUSES.includes(str)
    ? (str as GoalStatus)
    : (DEFAULT_GOAL_STATUS as GoalStatus);
}

export function buildFolderQuery(folderId: string): string {
  return `'${folderId}' in parents and trashed = false`;
}

export const AUTH_FAILURE_REASONS = {
  NETWORK_ERROR: "NETWORK_ERROR",
  GAS_PERMISSION_ERROR: "GAS_PERMISSION_ERROR",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  WRONG_ACCOUNT: "WRONG_ACCOUNT",
} as const;

export type AuthFailureReason =
  (typeof AUTH_FAILURE_REASONS)[keyof typeof AUTH_FAILURE_REASONS];

export const ERROR_MESSAGES = {
  UNKNOWN_ACTION: "Unknown action",
  TOKEN_REQUIRED: "access_token is required",
  AUTH_NETWORK_ERROR: "Token verification failed: network error",
  AUTH_GAS_PERMISSION_ERROR:
    "GAS script is not authorized to make external requests — re-authorize the script in the Apps Script editor",
  AUTH_INVALID_RESPONSE: "Token is invalid or expired",
  AUTH_EMAIL_NOT_VERIFIED: "Google account email is not verified",
  AUTH_WRONG_ACCOUNT: "Token belongs to a different account",
  INVALID_JSON: "Request body must be valid JSON",
  COVER_TOO_LARGE: "Cover image must be 2 MB or less",
  FILE_ID_REQUIRED: "file_id is required",
  FILE_NOT_FOUND: "File not found",
  SHEET_NOT_FOUND: "Sheet not found",
  INIT_REQUIRED: "Call init before using the API",
  PURGE_CONFIRM_REQUIRED: "confirm must be true to purge deleted records",
  FILE_IDS_REQUIRED: "file_ids must be a non-empty array",
  FILE_IDS_TOO_MANY: `file_ids must contain at most ${MAX_COVER_BATCH_SIZE} items`,
  COVERS_REQUIRED: "covers must be a non-empty array",
  COVERS_TOO_MANY: `covers must contain at most ${MAX_COVER_BATCH_SIZE} items`,
  DATA_REQUIRED: "data field is required",
  COVER_INVALID_MIME: "mime_type must be an image type (image/*)",
  BLANK_NAME: "name must not be blank",
  INVALID_ID: "id must be a valid UUID v4",
  INVALID_OPTIONAL_FK: "foreign key must be empty or a valid UUID v4",
  INVALID_REQUIRED_FK: "task_id is required and must be a valid UUID v4",
  INVALID_BOX: "box must be one of: inbox, today, week, later",
} as const;

/**
 * Safely converts a Google Sheets cell value to an ISO 8601 string.
 * Google Sheets getValues() returns Date objects for date/time cells;
 * String(date) produces "Sun Apr 19 2026 19:00:00 GMT+0000 (...)" which
 * Temporal API cannot parse. This helper calls .toISOString() on Date objects.
 *
 * For timestamp strings, normalizes to always have exactly 3 fractional digits (.000Z)
 * so that string comparison between Temporal (.toString() → no ms) and Date (.toISOString() → .000Z)
 * is consistent.
 */
export function toISOStringValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const str = String(value ?? "");
  if (!str) return str;
  // Normalize fractional seconds to exactly 3 digits:
  // "...T19:00:00Z"     → "...T19:00:00.000Z"  (no fraction)
  // "...T19:00:00.1Z"   → "...T19:00:00.100Z"  (1 digit)
  // "...T19:00:00.12Z"  → "...T19:00:00.120Z"  (2 digits)
  // "...T19:00:00.123Z" → unchanged             (already 3 digits)
  return str.replace(
    /(\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/,
    (_, time: string, frac?: string) =>
      `${time}.${(frac ?? "").padEnd(3, "0")}Z`,
  );
}

/**
 * Safely converts a Google Sheets cell value to an ISO 8601 date-only string (YYYY-MM-DD).
 * Google Sheets getValues() returns Date objects for date cells;
 * Date.toISOString() produces "2026-04-19T19:00:00.000Z" but date-only fields
 * (next_date, appear_date) must be stored as "2026-04-19".
 */
export function toISODateValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString().substring(0, 10);
  const str = String(value ?? "");
  if (!str) return str;
  // Remove leading apostrophe if present (from toSheetDateValue)
  const cleaned = str.startsWith("'") ? str.substring(1) : str;
  // If already ISO date (YYYY-MM-DD), return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  // If ISO timestamp, extract date part
  if (cleaned.includes("T")) return cleaned.substring(0, 10);
  // Fallback: try parsing as Date
  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime()))
    return parsed.toISOString().substring(0, 10);
  return "";
}

/**
 * Converts an ISO 8601 date-only string to a format that Google Sheets will store as text.
 * Adds a leading apostrophe to prevent Google Sheets from auto-converting to Date object.
 * This prevents timezone-related date shifts when reading/writing date-only fields.
 *
 * @param value - ISO 8601 date string (YYYY-MM-DD)
 * @returns String with leading apostrophe for Google Sheets text storage
 */
export function toSheetDateValue(value: string): string {
  if (!value) return "";
  // Prefix with apostrophe to force Google Sheets to store as text, not Date
  return `'${value}`;
}

export function isBlankString(value: string): boolean {
  return value.trim().length === 0;
}

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

/**
 * Configuration: which columns in which sheets are date-only fields (YYYY-MM-DD).
 * Date-only fields must be stored as text in Google Sheets to prevent timezone shifts.
 */
export const DATE_ONLY_COLUMNS: Record<string, string[]> = {
  [SHEET_NAMES.TASKS]: ["next_date", "appear_date"],
};

/**
 * Checks if a column in a sheet is a date-only field.
 */
export function isDateOnlyColumn(
  sheetName: string,
  columnName: string,
): boolean {
  const columns = DATE_ONLY_COLUMNS[sheetName];
  return columns ? columns.includes(columnName) : false;
}

/**
 * Universal converter for writing date-only values to Google Sheets.
 * Accepts any type (Date, string with/without apostrophe, ISO timestamp, empty, undefined, null).
 * Returns a string with leading apostrophe to force text storage in Google Sheets.
 *
 * @param value - Any date-like value or empty/null/undefined
 * @returns String with leading apostrophe for Google Sheets text storage, or empty string
 */
export function normalizeToSheetDate(value: unknown): string {
  // Handle empty values
  if (value === null || value === undefined || value === "") {
    return "";
  }

  // Handle Date objects
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `'${value.toISOString().substring(0, 10)}`;
  }

  const str = String(value);

  // Already prefixed — return as-is
  if (str.startsWith("'")) {
    return str;
  }

  // ISO date format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `'${str}`;
  }

  // ISO timestamp — extract date part
  if (str.includes("T")) {
    return `'${str.substring(0, 10)}`;
  }

  // Try parsing as Date
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return `'${parsed.toISOString().substring(0, 10)}`;
  }

  // Unparseable — return empty
  return "";
}
