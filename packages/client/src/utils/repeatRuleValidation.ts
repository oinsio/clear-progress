import { isRepeatRuleInvalid } from "./repeatRule";

/**
 * Minimum shape needed from a task for post-pull repeat rule validation.
 * Uses a structural type so both client Task and server wire records match.
 */
interface PulledTaskRecord {
  name: string;
  repeat_rule: string;
  is_deleted: boolean;
  is_completed: boolean;
}

/**
 * Implements FR5, FR9 of detect-invalid-repeat-rule.
 * Filters pulled tasks to find active incomplete ones with invalid repeat rules.
 * Returns task names for the grouped alert.
 */
export function filterTaskNamesWithInvalidRepeatRules(
  tasks: PulledTaskRecord[],
): string[] {
  return tasks
    .filter(
      (task) =>
        !task.is_deleted && !task.is_completed && isRepeatRuleInvalid(task),
    )
    .map((task) => task.name);
}
