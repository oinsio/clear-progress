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

function calculateNextDateWeekly(
  interval: number,
  weekdays: number[],
  previousNextDate: string | undefined,
  completedAtDate: Temporal.PlainDate,
  clock: Clock = systemClock,
): string {
  const today = clock.plainDateISO();

  if (!previousNextDate) {
    // First creation: nearest day from weekdays[], starting from tomorrow
    const tomorrow = today.add({ days: 1 });
    return findNextWeekday(tomorrow, weekdays, interval);
  }

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

  // type === 'fixed'
  if (!rule.frequency) throw new Error("frequency required for fixed");
  if (!previousNextDate) {
    // First creation: use completedAt as the base
    previousNextDate = toPlainDate(completedAt, clock).toString();
  } else {
    previousNextDate = sanitizeDateOnly(previousNextDate) || previousNextDate;
  }

  const interval = rule.interval ?? 1;

  // Extract completedAt as a PlainDate for early-completion checks
  const completedAtDate = toPlainDate(completedAt, clock);

  switch (rule.frequency) {
    case "daily":
      return calculateNextDateDaily(interval, previousNextDate, clock);
    case "weekly":
      if (!rule.weekdays || rule.weekdays.length === 0) {
        throw new Error("weekdays required for weekly");
      }
      return calculateNextDateWeekly(
        interval,
        rule.weekdays,
        previousNextDate,
        completedAtDate,
        clock,
      );
    case "monthly":
      if (!rule.day_of_month)
        throw new Error("day_of_month required for monthly");
      return calculateNextDateMonthly(
        interval,
        rule.day_of_month,
        previousNextDate,
        completedAtDate,
        clock,
      );
    case "yearly":
      if (!rule.month_and_day)
        throw new Error("month_and_day required for yearly");
      return calculateNextDateYearly(
        interval,
        rule.month_and_day,
        previousNextDate,
        completedAtDate,
        clock,
      );
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
