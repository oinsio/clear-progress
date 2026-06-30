import { type RepeatRule, RepeatRuleSchema } from "@clear-progress/contract";
import type { TFunction } from "i18next";
import { type Clock, systemClock, Temporal } from "@/lib/temporal";
import { sanitizeDateOnly } from "@/utils/dateHelpers";

export function parseRepeatRule(json: string): RepeatRule | null {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    const result = RepeatRuleSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function serializeRepeatRule(rule: RepeatRule): string {
  return JSON.stringify(rule);
}

function resolveTimeZone(clock: Clock): string {
  try {
    return clock.timeZoneId();
  } catch (error) {
    console.error("Invalid timezone from system, falling back to UTC:", error);
    return "UTC";
  }
}

function toPlainDate(isoInstant: string, clock: Clock): Temporal.PlainDate {
  const instant = Temporal.Instant.from(isoInstant);
  const timeZone = resolveTimeZone(clock);
  return instant.toZonedDateTimeISO(timeZone).toPlainDate();
}

function calculateNextDateDaily(
  interval: number,
  _previousNextDate: string,
  clock: Clock = systemClock,
): string {
  return clock.plainDateISO().add({ days: interval }).toString();
}

// implements FR2 of fix-date-and-weekly-bugs
function findNextWeekday(
  startDate: Temporal.PlainDate,
  weekdays: number[],
  interval: number,
): string {
  // weekdays: 1=Mon, 2=Tue, ..., 7=Sun (ISO 8601)
  const sortedWeekdays = [...weekdays].sort((a, b) => a - b);
  const startDow = startDate.dayOfWeek;

  // Step 1: Check remaining weekdays in the current ISO week of startDate
  for (const dow of sortedWeekdays) {
    if (dow >= startDow) {
      return startDate.add({ days: dow - startDow }).toString();
    }
  }

  // Step 2: No remaining weekdays this week → advance to next active week
  const daysUntilNextMonday = 8 - startDow;
  const activeMonday = startDate.add({
    days: daysUntilNextMonday + 7 * (interval - 1),
  });
  return activeMonday.add({ days: sortedWeekdays[0] - 1 }).toString();
}

// implements FR4 of unify-next-date-calculation — removed dead !previousNextDate branch
function calculateNextDateWeekly(
  interval: number,
  weekdays: number[],
  previousNextDate: string,
  completedAtDate: Temporal.PlainDate,
  clock: Clock = systemClock,
): string {
  const today = clock.plainDateISO();
  const prev = Temporal.PlainDate.from(previousNextDate);

  // Early completion: if completed before the scheduled date, preserve it
  if (Temporal.PlainDate.compare(completedAtDate, prev) < 0) {
    return prev.toString();
  }

  const nextDay = prev.add({ days: 1 });
  const candidate = findNextWeekday(nextDay, weekdays, interval);
  const candidateDate = Temporal.PlainDate.from(candidate);

  if (Temporal.PlainDate.compare(candidateDate, today) < 0) {
    // Align to Monday boundaries for correct multi-weekday skip logic
    // implements FR3 of fix-date-and-weekly-bugs
    const prevMonday = prev.subtract({ days: prev.dayOfWeek - 1 });
    const todayMonday = today.subtract({ days: today.dayOfWeek - 1 });
    const weeksBetween = prevMonday.until(todayMonday, {
      largestUnit: "weeks",
    }).weeks;

    // Find the active week >= today's week
    const periodsToSkip = Math.ceil(weeksBetween / interval);
    let alignedMonday = prevMonday.add({ weeks: periodsToSkip * interval });

    const sortedWeekdays = [...weekdays].sort((a, b) => a - b);
    const lastWeekdayInAlignedWeek = alignedMonday.add({
      days: sortedWeekdays[sortedWeekdays.length - 1] - 1,
    });

    // If all weekdays in the aligned week are before today, advance one more period
    if (Temporal.PlainDate.compare(lastWeekdayInAlignedWeek, today) < 0) {
      alignedMonday = alignedMonday.add({ weeks: interval });
    }

    // Find the first weekday >= today in the aligned active week
    for (const dow of sortedWeekdays) {
      const dayInWeek = alignedMonday.add({ days: dow - 1 });
      if (Temporal.PlainDate.compare(dayInWeek, today) >= 0) {
        return dayInWeek.toString();
      }
    }

    // Fallback: next active week, first weekday
    const nextActiveMonday = alignedMonday.add({ weeks: interval });
    return nextActiveMonday.add({ days: sortedWeekdays[0] - 1 }).toString();
  }

  return candidate;
}

function calculateNextDateMonthly(
  interval: number,
  dayOfMonth: number,
  previousNextDate: string,
  completedAtDate: Temporal.PlainDate,
  clock: Clock = systemClock,
): string {
  const prev = Temporal.PlainDate.from(previousNextDate);

  // Early completion: if completed before the scheduled date, preserve it
  if (Temporal.PlainDate.compare(completedAtDate, prev) < 0) {
    return prev.toString();
  }

  const today = clock.plainDateISO();
  const prevYearMonth = prev.toPlainYearMonth();
  let targetYearMonth = prevYearMonth.add({ months: interval });

  // Skip logic: if the target month is in the past, jump to the nearest
  // month aligned to the interval (analogous to daily skip logic).
  // This prevents creating multiple missed copies during prolonged inactivity.
  const todayYearMonth = today.toPlainYearMonth();
  if (Temporal.PlainYearMonth.compare(targetYearMonth, todayYearMonth) < 0) {
    const monthsElapsed = prevYearMonth.until(todayYearMonth, {
      largestUnit: "months",
    }).months;
    const periodsToSkip = Math.ceil(monthsElapsed / interval);
    targetYearMonth = prevYearMonth.add({ months: periodsToSkip * interval });

    // If the date has already passed or falls today in the target month, add interval
    const actualDay = Math.min(dayOfMonth, targetYearMonth.daysInMonth);
    if (
      Temporal.PlainDate.compare(
        targetYearMonth.toPlainDate({ day: actualDay }),
        today,
      ) <= 0
    ) {
      targetYearMonth = targetYearMonth.add({ months: interval });
    }
  }

  const actualDay = Math.min(dayOfMonth, targetYearMonth.daysInMonth);
  return targetYearMonth.toPlainDate({ day: actualDay }).toString();
}

function calculateNextDateYearly(
  interval: number,
  monthAndDay: { month: number; day: number },
  previousNextDate: string,
  completedAtDate: Temporal.PlainDate,
  clock: Clock = systemClock,
): string {
  const prev = Temporal.PlainDate.from(previousNextDate);

  // Early completion: if completed before the scheduled date, preserve it
  if (Temporal.PlainDate.compare(completedAtDate, prev) < 0) {
    return prev.toString();
  }

  const today = clock.plainDateISO();
  let targetYear = prev.year + interval;

  // Skip logic: if the target year is in the past, jump to the nearest
  // year aligned to the interval (analogous to daily skip logic).
  // This prevents creating multiple missed copies during prolonged inactivity.
  if (targetYear < today.year) {
    const yearsElapsed = today.year - prev.year;
    const periodsToSkip = Math.ceil(yearsElapsed / interval);
    targetYear = prev.year + periodsToSkip * interval;
  }

  // Build the candidate date for the current target year
  const targetYearMonth = Temporal.PlainYearMonth.from({
    year: targetYear,
    month: monthAndDay.month,
  });
  const actualDay = Math.min(monthAndDay.day, targetYearMonth.daysInMonth);
  const candidate = Temporal.PlainDate.from({
    year: targetYear,
    month: monthAndDay.month,
    day: actualDay,
  });

  // If the date has already passed in the target year, advance to the next aligned year
  if (Temporal.PlainDate.compare(candidate, today) <= 0) {
    const nextYear = targetYear + interval;
    const nextYearMonth = Temporal.PlainYearMonth.from({
      year: nextYear,
      month: monthAndDay.month,
    });
    const nextActualDay = Math.min(monthAndDay.day, nextYearMonth.daysInMonth);
    return Temporal.PlainDate.from({
      year: nextYear,
      month: monthAndDay.month,
      day: nextActualDay,
    }).toString();
  }

  return candidate.toString();
}

function calculateNextDateAfterCompletion(
  delayDays: number,
  completedAt: string,
  clock: Clock = systemClock,
): string {
  const completedDate = toPlainDate(completedAt, clock);
  return completedDate.add({ days: delayDays }).toString();
}

export function calculateNextDate(
  rule: RepeatRule,
  completedAt: string,
  previousNextDate?: string,
  clock: Clock = systemClock,
): string {
  if (rule.type === "after_completion") {
    if (!rule.delay_days)
      throw new Error("delay_days required for after_completion");
    return calculateNextDateAfterCompletion(
      rule.delay_days,
      completedAt,
      clock,
    );
  }

  // type === 'fixed' — implements FR2 of unify-next-date-calculation
  if (!rule.frequency) throw new Error("frequency required for fixed");

  if (!previousNextDate) {
    // First creation: nearest future date matching the rule
    return resolveNextFixedDate(rule, "", "nearest-match", clock);
  }

  // Subsequent completion: advance from the previous scheduled date
  const sanitizedPreviousNextDate =
    sanitizeDateOnly(previousNextDate) || previousNextDate;
  const completedAtDate = toPlainDate(completedAt, clock);
  return resolveNextFixedDate(
    rule,
    sanitizedPreviousNextDate,
    "from-schedule",
    clock,
    completedAtDate,
  );
}

// implements FR1 of unify-next-date-calculation
type ResolveMode = "nearest-match" | "from-schedule";
type FixedRule = Extract<RepeatRule, { type: "fixed" }>;

/**
 * Unified dispatcher for calculating next_date for fixed repeat rules.
 *
 * - nearest-match: find the nearest future date matching the rule (used on rule creation/change)
 * - from-schedule: advance from anchor by schedule interval (used on task completion)
 *
 * Implements FR1, FR2, FR5 of unify-next-date-calculation
 */
export function resolveNextFixedDate(
  rule: RepeatRule,
  anchor: string,
  mode: ResolveMode,
  clock: Clock,
  completedAtDate?: Temporal.PlainDate,
): string {
  if (rule.type !== "fixed") {
    throw new Error("resolveNextFixedDate only supports fixed rules");
  }

  const interval = rule.interval ?? 1;

  if (mode === "nearest-match") {
    return resolveNearestMatch(rule, clock, interval);
  }

  // from-schedule: delegate to existing frequency calculators
  const effectiveCompletedAtDate =
    completedAtDate ?? Temporal.PlainDate.from(anchor);
  return resolveFromSchedule(
    rule,
    anchor,
    effectiveCompletedAtDate,
    interval,
    clock,
  );
}

function resolveNearestMatch(
  rule: FixedRule,
  clock: Clock,
  interval: number,
): string {
  const today = clock.plainDateISO();

  switch (rule.frequency) {
    case "daily":
      return today.add({ days: interval }).toString();

    case "weekly": {
      const weekdays = rule.weekdays ?? [];
      const tomorrow = today.add({ days: 1 });
      // nearest-match always uses interval=1 to find the closest matching day
      const NEAREST_INTERVAL = 1;
      return findNextWeekday(tomorrow, weekdays, NEAREST_INTERVAL);
    }

    case "monthly": {
      const dayOfMonth = rule.day_of_month ?? 1;
      const currentMonth = today.toPlainYearMonth();
      const actualDay = Math.min(dayOfMonth, currentMonth.daysInMonth);
      const candidate = currentMonth.toPlainDate({ day: actualDay });
      if (Temporal.PlainDate.compare(candidate, today) > 0) {
        return candidate.toString();
      }
      const nextMonth = currentMonth.add({ months: 1 });
      const nextActualDay = Math.min(dayOfMonth, nextMonth.daysInMonth);
      return nextMonth.toPlainDate({ day: nextActualDay }).toString();
    }

    case "yearly": {
      const { month, day } = rule.month_and_day ?? { month: 1, day: 1 };
      const thisYearMonth = Temporal.PlainYearMonth.from({
        year: today.year,
        month,
      });
      const actualDay = Math.min(day, thisYearMonth.daysInMonth);
      const candidate = Temporal.PlainDate.from({
        year: today.year,
        month,
        day: actualDay,
      });
      if (Temporal.PlainDate.compare(candidate, today) > 0) {
        return candidate.toString();
      }
      const nextYear = today.year + 1;
      const nextYearMonth = Temporal.PlainYearMonth.from({
        year: nextYear,
        month,
      });
      const nextActualDay = Math.min(day, nextYearMonth.daysInMonth);
      return Temporal.PlainDate.from({
        year: nextYear,
        month,
        day: nextActualDay,
      }).toString();
    }

    default:
      throw new Error(`Unknown frequency: ${rule.frequency}`);
  }
}

function resolveFromSchedule(
  rule: FixedRule,
  previousNextDate: string,
  completedAtDate: Temporal.PlainDate,
  interval: number,
  clock: Clock,
): string {
  switch (rule.frequency) {
    case "daily":
      return calculateNextDateDaily(interval, previousNextDate, clock);
    case "weekly": {
      const weekdays = rule.weekdays ?? [];
      return calculateNextDateWeekly(
        interval,
        weekdays,
        previousNextDate,
        completedAtDate,
        clock,
      );
    }
    case "monthly": {
      const dayOfMonth = rule.day_of_month ?? 1;
      return calculateNextDateMonthly(
        interval,
        dayOfMonth,
        previousNextDate,
        completedAtDate,
        clock,
      );
    }
    case "yearly": {
      const monthAndDay = rule.month_and_day ?? { month: 1, day: 1 };
      return calculateNextDateYearly(
        interval,
        monthAndDay,
        previousNextDate,
        completedAtDate,
        clock,
      );
    }
    default:
      throw new Error(`Unknown frequency: ${rule.frequency}`);
  }
}

export function calculateAppearDate(
  nextDate: string,
  advanceDays: number,
): string {
  const sanitized = sanitizeDateOnly(nextDate) || nextDate;
  return Temporal.PlainDate.from(sanitized)
    .subtract({ days: advanceDays })
    .toString();
}

export function formatRepeatRuleLabel(rule: RepeatRule, t: TFunction): string {
  if (rule.type === "after_completion") {
    return t("repeat.afterCompletion", { count: rule.delay_days ?? 1 });
  }

  // type === 'fixed'
  const interval = rule.interval ?? 1;
  switch (rule.frequency) {
    case "daily":
      return t("repeat.everyNDays", { count: interval });
    case "weekly": {
      if (rule.weekdays && rule.weekdays.length > 0) {
        const dayLabels = rule.weekdays
          .map((day) => t(`repeat.weekday${day}`))
          .join(", ");
        return t("repeat.everyNWeeks", { count: interval, days: dayLabels });
      }
      return t("repeat.weekly");
    }
    case "monthly":
      return t("repeat.everyNMonths", {
        count: interval,
        day: rule.day_of_month,
      });
    case "yearly": {
      if (!rule.month_and_day) return t("repeat.none");

      const monthName = t(`repeat.monthGenitive${rule.month_and_day.month}`);
      const formattedDate = t("repeat.yearlyDate", {
        count: rule.month_and_day.day,
        month: monthName,
        ordinal: true,
      });

      return t("repeat.everyNYears", {
        count: interval,
        date: formattedDate,
      });
    }
    default:
      return t("repeat.none");
  }
}

export {
  calculateNextDateOnRuleChange,
  computeRuleChangeUpdates,
  shouldRecalculateNextDate,
} from "./repeatRuleChange";
