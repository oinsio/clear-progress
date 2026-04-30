export const API_ACTIONS = {
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

export const MAX_COVER_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_COVER_BATCH_SIZE = 10;
