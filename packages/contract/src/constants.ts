export const API_ACTIONS = {
  PING: "ping",
  INIT: "init",
  PULL: "pull",
  PUSH: "push",
  UPLOAD_FILE: "upload_file",
  UPLOAD_FILES: "upload_files",
  DELETE_FILE: "delete_file",
  GET_FILE: "get_file",
  PURGE: "purge",
} as const;

export const PUSH_RESULT_STATUS = {
  CREATED: "created",
  ACCEPTED: "accepted",
  CONFLICT: "conflict",
  REJECTED: "rejected",
} as const;

export const SYNC_META_KEYS = {
  LAST_KNOWN_REVISION: "last_known_revision",
  LAST_KNOWN_PURGE_REVISION: "last_known_purge_revision",
} as const;

export const SETTINGS_KEYS = {
  DEFAULT_BOX: "default_box",
  ACCENT_COLOR: "accent_color",
  CUSTOM_ACCENT_LIGHT: "custom_accent_light",
  CUSTOM_ACCENT_DARK: "custom_accent_dark",
  FOCUSED_GOAL_1: "focused_goal_1",
  FOCUSED_GOAL_2: "focused_goal_2",
} as const;

export const MAX_FOCUSED_GOALS = 2;

const BYTES_PER_MEGABYTE = 1024 * 1024;

export const MAX_COVER_SIZE_BYTES = 2 * BYTES_PER_MEGABYTE;
export const MAX_FILE_BATCH_SIZE = 10;

// implements FR1, FR2, FR3 of add-file-attachments
export const ALLOWED_FILE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/pdf",
] as const;

// implements FR2 of add-file-attachments
export const FILE_MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  "image/gif": [[0x47, 0x49, 0x46, 0x38]], // GIF8
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  // text/plain has no magic bytes — validated by absence of null bytes
};

// implements FR2 of add-file-attachments
export const TEXT_PLAIN_NULL_CHECK_BYTES = 8192;

// implements FR3 of add-file-attachments
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * BYTES_PER_MEGABYTE;

export const SYNC_ERRORS = {
  LOCK_TIMEOUT: "SYNC_LOCK_TIMEOUT",
} as const;
