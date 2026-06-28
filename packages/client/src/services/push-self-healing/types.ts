// implements FR1 of fix-push-poison-pill

/** Entity types that can be validated and healed before push */
export type HealableEntityType =
  | "task"
  | "goal"
  | "idea"
  | "context"
  | "category"
  | "checklist_item"
  | "attachment"
  | "setting";

/** Outcome of validating and attempting to heal a record */
export type HealStatus = "valid" | "healed" | "rejected";

/** Alert to show the user when healing causes data loss */
export interface SyncAlert {
  messageKey: string;
  params?: Record<string, string>;
}

/** Result of running healRecord on a single record */
export interface HealResult {
  status: HealStatus;
  record: Record<string, unknown>;
  alerts: SyncAlert[];
}
