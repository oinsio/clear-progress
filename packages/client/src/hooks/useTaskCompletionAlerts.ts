import { useCallback } from "react";
import { useAlerts } from "@/app/providers/AlertProvider";
import type { RecurringResult } from "@/services/TaskService";

export interface UseTaskCompletionAlertsReturn {
  raiseCompletionAlerts: (
    recurringResult: RecurringResult,
    taskName: string,
  ) => void;
}

/**
 * Implements FR5, FR6 of fix-recurring-completion-error-masking.
 *
 * Raises a repeat_rule_invalid alert when completing a task reveals
 * an unparseable repeat rule, so the failure surfaces to the user
 * instead of being silently swallowed. Shared by all completion call
 * sites (useTasks, useInboxTasks, useTaskMutations, SearchPage).
 */
export function useTaskCompletionAlerts(): UseTaskCompletionAlertsReturn {
  const { addAlerts } = useAlerts();

  const raiseCompletionAlerts = useCallback(
    (recurringResult: RecurringResult, taskName: string) => {
      if (recurringResult.status === "skipped_invalid_rule") {
        addAlerts([{ type: "repeat_rule_invalid", taskNames: [taskName] }]);
      }
    },
    [addAlerts],
  );

  return { raiseCompletionAlerts };
}
