/**
 * Calculates N upcoming dates for a fixed repeat rule by sequential chaining.
 *
 * Implements FR8 of show-upcoming-recurrences
 */

import type { RepeatRule } from "@clear-progress/contract";

import { type Clock, Temporal } from "@/lib/temporal";

import { resolveNextFixedDate } from "./repeatRule";

export const UPCOMING_DATES_COUNT = 5;

export function calculateUpcomingDates(
  rule: RepeatRule,
  startDate: string,
  count: number,
  clock: Clock,
): string[] {
  if (rule.type === "after_completion") {
    return [];
  }

  const dates: string[] = [startDate];

  for (let i = 1; i < count; i++) {
    const previousDate = dates[i - 1];
    const nextDate = resolveNextFixedDate(
      rule,
      previousDate,
      "from-schedule",
      clock,
      Temporal.PlainDate.from(previousDate),
    );
    dates.push(nextDate);
  }

  return dates;
}
