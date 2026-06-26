import type { Box } from "@clear-progress/contract";

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
  | "unauthorized"
  | "project_paused";

export type FullSyncStep =
  | "idle"
  | "reupload_files"
  | "upload_files"
  | "push"
  | "pull"
  | "download_files"
  | "done"
  | "error";

export type BoxFilter = Box | "all";

export type PanelSide = "left" | "right";

export type ColorScheme = "system" | "light" | "dark";

export type FilterBarPosition = "top" | "bottom";

export type InterfaceScale = "small" | "normal" | "large" | "xLarge";

export type Handedness = "right" | "left";

export type SidebarMode = "expanded" | "collapsed" | "expand-on-hover";

export type SidebarEffectiveState = "expanded" | "collapsed" | "hover-ready";

export type {
  Box,
  GoalStatus,
  MenuItemConfig,
  MenuMode,
  PushResultStatus,
  RepeatRule,
} from "@clear-progress/contract";
