// implements FR2, FR6 of goals-filter
import {
  DEFAULT_GOAL_FILTER,
  GOAL_FILTER_OPTIONS,
  STORAGE_KEYS,
} from "@/constants";
import { usePreference } from "@/hooks/usePreference";
import type { GoalFilter } from "@/types/common";

export interface UseGoalFilterReturn {
  goalFilter: GoalFilter;
  setGoalFilter: (value: GoalFilter) => void;
}

/**
 * Implements FR2, FR6 of goals-filter.
 */
export function useGoalFilter(): UseGoalFilterReturn {
  const [goalFilter, setGoalFilter] = usePreference<GoalFilter>({
    type: "enum",
    key: STORAGE_KEYS.GOAL_FILTER,
    values: GOAL_FILTER_OPTIONS,
    defaultValue: DEFAULT_GOAL_FILTER,
  });

  return { goalFilter, setGoalFilter };
}
