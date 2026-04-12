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
  | "teal"
  | "blue"
  | "indigo"
  | "purple";

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

export type MenuMode =
  | "inbox"
  | "contexts"
  | "categories"
  | "goals"
  | "ideas"
  | "tasks"
  | "completed"
  | "deleted";

export interface MenuItemConfig {
  mode: MenuMode;
  visible: boolean;
}

export interface RepeatRule {
  type: "fixed" | "after_completion";
  // Для fixed
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number; // >= 1
  weekdays?: number[]; // для weekly: 1=Пн ... 7=Вс
  day_of_month?: number; // для monthly: 1-31
  month_and_day?: {
    // для yearly
    month: number; // 1-12
    day: number; // 1-31
  };
  // Для after_completion
  delay_days?: number; // >= 1
  // Общее
  target_box: "today" | "week" | "later";
  advance_days: number; // >= 0
}
