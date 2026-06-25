import type {
  AccentColor,
  Box,
  BoxFilter,
  ColorScheme,
  FilterBarPosition,
  Handedness,
  InterfaceScale,
  PanelSide,
} from "@/types/common";

export const ROUTES = {
  INBOX: "/inbox",
  TASKS: "/tasks",
  COMPLETED: "/completed",
  GOALS: "/goals",
  GOAL: "/goals/:id",
  IDEAS: "/ideas",
  CATEGORIES: "/categories",
  CATEGORY: "/categories/:id",
  CONTEXTS: "/contexts",
  CONTEXT: "/contexts/:id",
  MEMOS: "/memos",
  MEMO: "/memos/:slug",
  SEARCH: "/search",
  SETTINGS: "/settings",
  DELETED: "/deleted",
} as const;

export const BOX = {
  INBOX: "inbox",
  TODAY: "today",
  WEEK: "week",
  LATER: "later",
} as const satisfies Record<string, Box>;

export const BOX_ORDER: Box[] = ["inbox", "today", "week", "later"];

export const BOX_FILTER_ALL = "all" as const satisfies BoxFilter;

export const BOX_FILTER_I18N_KEYS: Record<BoxFilter, string> = {
  all: "box.all",
  inbox: "box.inbox",
  today: "box.today",
  week: "box.week",
  later: "box.later",
};

export const TASK_BOX_FILTER_ORDER: BoxFilter[] = [
  "today",
  "week",
  "later",
  "all",
];

export const FULL_BOX_FILTER_ORDER: BoxFilter[] = [
  "inbox",
  "today",
  "week",
  "later",
  "all",
];

export const DEFAULT_PANEL_SIDE: PanelSide = "right";

export const PANEL_SIDES: PanelSide[] = ["left", "right"];

export const DEFAULT_FILTER_BAR_POSITION: FilterBarPosition = "bottom";

export const FILTER_BAR_POSITIONS: FilterBarPosition[] = ["bottom", "top"];

export const DEFAULT_ACCENT_COLOR: AccentColor = "green";

export const COLOR_SCHEMES: ColorScheme[] = ["system", "light", "dark"];
export const DEFAULT_COLOR_SCHEME: ColorScheme = "system";

export const INTERFACE_SCALES: InterfaceScale[] = [
  "small",
  "normal",
  "large",
  "xLarge",
];
export const DEFAULT_INTERFACE_SCALE: InterfaceScale = "normal";

export const ACCENT_COLORS: AccentColor[] = [
  "coral",
  "orange",
  "yellow",
  "green",
  "blue",
  "indigo",
  "purple",
  "custom",
];

export const ACCENT_COLOR_VALUES: Record<AccentColor, string> = {
  coral: "#fb7185",
  orange: "#f57c00",
  yellow: "#f4c943",
  green: "#69b23e",
  blue: "#2563eb",
  indigo: "#4f46e5",
  purple: "#a855f7",
  custom: "#fcd34d",
};

export const ACCENT_COLOR_VALUES_DARK: Record<AccentColor, string> = {
  coral: "#e11d48",
  orange: "#c55a00",
  yellow: "#ca9a04",
  green: "#4d7c0f",
  blue: "#3b82f6",
  indigo: "#6366f1",
  purple: "#7c3aed",
  custom: "#14b8a6",
};

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

export const SYNC_INTERVAL_MS = 5 * 60 * 1000;
export const SYNC_DEBOUNCE_MS = 15 * 1000;
export const PING_INTERVAL_MS = 30 * 1000;
export const MAX_SILENT_REFRESH_ATTEMPTS = 3;
export const MAX_PING_ATTEMPTS = 20; // 10 minutes (20 × 30s)
export const PUSH_CHUNK_SIZE = 200;

export const BACKEND_CONNECTION_EVENT = "backend_connection_changed";
export const AUTH_REQUIRED_EVENT = "auth_required";
export const DAY_BOUNDARY_CHANGED_EVENT = "day_boundary_changed";

export const DB_NAME = "clear-progress";

export const SYNC_META_KEYS = {
  LAST_KNOWN_REVISION: "last_known_revision",
  LAST_KNOWN_PURGE_REVISION: "last_known_purge_revision",
} as const;

export const STORAGE_KEYS = {
  CONNECTION_CONFIG: "connection_config",
  LAST_SYNC: "last_sync",
  ACCENT_COLOR: "accent_color",
  CUSTOM_ACCENT_LIGHT: "custom_accent_light",
  CUSTOM_ACCENT_DARK: "custom_accent_dark",
  DEFAULT_BOX: "default_box",
  PANEL_SIDE: "panel_side",
  PANEL_OPEN: "panel_open",
  LANGUAGE: "language",
  PANEL_SPLIT: "panel_split",
  PANEL_ALWAYS_OPEN: "panel_always_open",
  FILTER_BAR_POSITION: "filter_bar_position",
  INTERFACE_SCALE: "interface_scale",
  MENU_ORDER: "menu_order",
  SECTION_COLLAPSE: "section_collapse",
  COLOR_SCHEME: "color_scheme",
  USER_PICTURE: "user_picture",
  ACCESS_TOKEN: "access_token",
  ACCESS_TOKEN_EXPIRES_AT: "access_token_expires_at",
  SHOW_HIDDEN_TASKS: "show_hidden_tasks",
  SETTINGS_UPDATED_AT: "settings_updated_at",
  FOCUS_MODE: "focus_mode",
  FOCUS_OPACITY: "focus_opacity",
  HANDEDNESS: "handedness",
  DAY_BOUNDARY: "day_boundary",
  ONBOARDING_SHOWN: "onboarding_shown",
  DETAIL_PANEL_PINNED: "detail_panel_pinned",
} as const;

export const DEFAULT_FOCUS_OPACITY = 30;
export const FOCUS_OPACITY_LEVELS = [50, 40, 30, 20, 10] as const;

export const SUPABASE_URL_SUFFIX = ".supabase.co";
export const SUPABASE_SETTINGS_ENDPOINT = "/auth/v1/settings";
export const SUPABASE_SETTINGS_TIMEOUT_MS = 5000;

// implements FR6 of supabase-email-auth
export const OTP_RESEND_COOLDOWN_MS = 60000;

export const PANEL_SPLIT_DEFAULT_RATIO = 0.5;
export const PANEL_SPLIT_MIN_RATIO = 0.2;
export const PANEL_SPLIT_MAX_RATIO = 0.8;

export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_SEARCH_THRESHOLD = 10;

// implements FR13 of localstorage-refactor — SETTING_KEYS removed; use STORAGE_KEYS instead

export const MAX_COVER_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_FILE_BATCH_SIZE = 10;
export const FILE_HASH_PREFIX_LENGTH = 12;
export const DEFAULT_FILE_EXTENSION = "jpg";
export const FALLBACK_FILE_MIME_TYPE = "image/jpeg";

/** Implements FR3 of add-file-attachments */
export { MAX_ATTACHMENT_SIZE_BYTES } from "@clear-progress/contract";

export const PUSH_RESULT_STATUS = {
  CREATED: "created",
  ACCEPTED: "accepted",
  CONFLICT: "conflict",
  REJECTED: "rejected",
} as const;

export const LG_BREAKPOINT_PX = 1024;

export const TOKEN_EXPIRY_BUFFER_S = 60;
export const API_AUTH_ERROR_NAME = "ApiAuthError";

export const SWIPE_COMPLETE_THRESHOLD_PERCENT = 0.4;
export const SWIPE_SNAP_BACK_DURATION_MS = 300;
// implements FR13 of swipeable-item — background opacity levels
export const SWIPE_BACKGROUND_OPACITY_REST = 0;
export const SWIPE_BACKGROUND_OPACITY_SWIPING = 0.7;
export const SWIPE_BACKGROUND_OPACITY_THRESHOLD = 1.0;
export const TASK_COMPLETE_ANIMATION_DELAY_MS = 300;
// implements FR4, FR6, FR7, FR8 of swipeable-item
export const SWIPE_VELOCITY_THRESHOLD_PX_PER_MS = 0.5;
export const SWIPE_DRAG_START_PX = 5;
export const SWIPE_RUBBER_BAND_FACTOR = 1.5;
export const SWIPE_VERTICAL_CANCEL_PX = 10;

export const LONG_PRESS_THRESHOLD_MS = 500;
export const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

export const GOAL_STATUS_SORT_ORDER: Record<
  import("@/types/common").GoalStatus,
  number
> = {
  in_progress: 0,
  planning: 1,
  paused: 2,
  completed: 3,
  cancelled: 4,
} as const;

export const DEFAULT_DAY_BOUNDARY = "00:00";

export const DEFAULT_HANDEDNESS: Handedness = "right";

export const HANDEDNESS_OPTIONS: Handedness[] = ["right", "left"];

export const COMMAND_BAR_CSS_VAR = "--command-bar-height";

export const COMMAND_BAR_STACKED_CLASS = "command-bar-stacked";

export const SORT_ORDER_REBALANCE_THRESHOLD = 10;

// implements FR1, FR8 of settings-page-reordering

export const SETTINGS_SECTION_IDS = {
  LOOK_AND_FEEL: "settings-accordion-look-and-feel",
  WORKSPACE: "settings-accordion-workspace",
  TASKS: "settings-accordion-tasks",
  ACCOUNT_SYNC: "settings-accordion-account-sync",
} as const;

export const SYNCED_SETTING_KEYS = new Set([
  "accent_color",
  "custom_accent_colors",
  "default_box",
  "day_boundary",
]);
