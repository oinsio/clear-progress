/**
 * Implements FR6 of detect-invalid-repeat-rule.
 *
 * Discriminated union for all application alert types.
 * - sync: data-loss alerts from sync operations
 * - repeat_rule_invalid: tasks with unparseable repeat rules
 */
export type AppAlert =
  | { type: "sync"; messageKey: string; params?: Record<string, string> }
  | { type: "repeat_rule_invalid"; taskNames: string[] };

/**
 * Implements FR7 of detect-invalid-repeat-rule.
 *
 * Alert ordering by priority (index 0 = highest).
 * Sync alerts appear first (higher priority — data loss risk),
 * then repeat rule alerts.
 */
export const ALERT_TYPE_PRIORITY: AppAlert["type"][] = [
  "sync",
  "repeat_rule_invalid",
] as const;
