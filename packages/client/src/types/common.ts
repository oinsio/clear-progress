export type Box = "inbox" | "today" | "week" | "later";

export type GoalStatus =
  | "planning"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

export type AccentColor =
  | "coral"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "indigo"
  | "purple"
  | "custom";

export type SyncStatus =
  | "idle"
  | "syncing"
  | "error"
  | "offline"
  | "unauthorized";

export type FullSyncStep =
  | "idle"
  | "reupload_covers"
  | "upload_covers"
  | "push"
  | "pull"
  | "download_covers"
  | "done"
  | "error";

export type PushResultStatus = "created" | "accepted" | "conflict" | "rejected";

export type BoxFilter = Box | "all";

export type PanelSide = "left" | "right";

export type ColorScheme = "system" | "light" | "dark";

export type FilterBarPosition = "top" | "bottom";

export type InterfaceScale = "small" | "normal" | "large" | "xLarge";

export type {
  MenuItemConfig,
  MenuMode,
  RepeatRule,
} from "@clear-progress/contract";
