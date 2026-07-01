// implements FR1, FR2, FR3, FR4, FR5, FR7 of repeating-task-rule-change

import type { RepeatRule } from "@clear-progress/contract";
import { type Clock, systemClock } from "@/lib/temporal";
import { calculateAppearDate, resolveNextFixedDate } from "./repeatRule";

/**
 * Returns true if the rule change requires recalculating next_date.
 * Compares: type, frequency, interval, weekdays, day_of_month, month_and_day.
 *
 * Implements FR1, FR2, FR3 of repeating-task-rule-change
 */
export function shouldRecalculateNextDate(
  oldRule: RepeatRule,
  newRule: RepeatRule,
): boolean {
  if (oldRule.type !== newRule.type) return true;
  if (oldRule.type === "after_completion") return false;

  // Both are "fixed" — compare scheduling fields
  type FixedRule = Extract<RepeatRule, { type: "fixed" }>;
  const oldFixed = oldRule as FixedRule;
  const newFixed = newRule as FixedRule;

  if (oldFixed.frequency !== newFixed.frequency) return true;
  if ((oldFixed.interval ?? 1) !== (newFixed.interval ?? 1)) return true;

  const oldWeekdays = [...(oldFixed.weekdays ?? [])].sort((a, b) => a - b);
  const newWeekdays = [...(newFixed.weekdays ?? [])].sort((a, b) => a - b);
  if (oldWeekdays.length !== newWeekdays.length) return true;
  if (oldWeekdays.some((day, index) => day !== newWeekdays[index])) return true;

  if (oldFixed.day_of_month !== newFixed.day_of_month) return true;

  const oldMonthAndDay = oldFixed.month_and_day;
  const newMonthAndDay = newFixed.month_and_day;
  if (oldMonthAndDay?.month !== newMonthAndDay?.month) return true;

  return oldMonthAndDay?.day !== newMonthAndDay?.day;
}

/**
 * Calculates the nearest future date matching the new rule, starting from dateOfChange.
 * Delegates to resolveNextFixedDate with mode="nearest-match".
 *
 * Implements FR1, FR2, FR3, FR7 of repeating-task-rule-change
 * implements FR3 of unify-next-date-calculation
 */
export function calculateNextDateOnRuleChange(
  newRule: RepeatRule,
  dateOfChange: string,
  clock: Clock = systemClock,
): string {
  if (newRule.type === "after_completion") return "";

  return resolveNextFixedDate(newRule, dateOfChange, "nearest-match", clock);
}

/**
 * Orchestrator that decides what to update when a repeat rule changes.
 *
 * Implements FR4, FR5 of repeating-task-rule-change
 */
export function computeRuleChangeUpdates(
  oldRule: RepeatRule,
  newRule: RepeatRule,
  currentNextDate: string,
  clock: Clock = systemClock,
): { next_date: string; appear_date: string } {
  if (shouldRecalculateNextDate(oldRule, newRule)) {
    const dateOfChange = clock.plainDateISO().toString();
    const nextDate = calculateNextDateOnRuleChange(
      newRule,
      dateOfChange,
      clock,
    );
    const appearDate = nextDate
      ? calculateAppearDate(nextDate, newRule.advance_days)
      : "";
    return { next_date: nextDate, appear_date: appearDate };
  }

  // No recalc needed — only advance_days or target_box changed
  const appearDate = currentNextDate
    ? calculateAppearDate(currentNextDate, newRule.advance_days)
    : "";
  return { next_date: currentNextDate, appear_date: appearDate };
}
