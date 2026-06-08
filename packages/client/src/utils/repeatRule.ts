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

function calculateNextDateDaily(
  interval: number,
  previousNextDate: string,
  clock: Clock = systemClock,
): string {
  const prev = Temporal.PlainDate.from(previousNextDate);
  let next = prev.add({ days: interval });

  const today = clock.plainDateISO();
  // Skip logic: if next_date ended up in the past (user did not open the app
  // for several days), compute the nearest future date instead of creating multiple
  // missed copies. This is an intentional architectural decision for the app.
  // Details: .claude/docs/architecture/recurring-tasks-skip-logic.md
  if (Temporal.PlainDate.compare(next, today) < 0) {
    const totalDays = prev.until(today, { largestUnit: "days" }).days;
    const periodsToSkip = Math.ceil(totalDays / interval);
    next = prev.add({ days: periodsToSkip * interval });
  }

  return next.toString();
}

function findNextWeekday(
  startDate: Temporal.PlainDate,
  weekdays: number[],
  interval: number,
): string {
  // weekdays: 1=Mon, 2=Tue, ..., 7=Sun (ISO 8601)
  const sortedWeekdays = [...weekdays].sort((a, b) => a - b);
  // Skip (interval - 1) full weeks before starting the search
  let current = startDate.add({ days: 7 * (interval - 1) });

  for (let i = 0; i < 7; i++) {
    const isoDay = current.dayOfWeek; // 1=Mon ... 7=Sun

    if (sortedWeekdays.includes(isoDay)) {
      return current.toString();
    }

    current = current.add({ days: 1 });
  }

  throw new Error(
    `No matching weekday found in 7 days for weekdays: [${weekdays}]`,
  );
}

function calculateNextDateWeekly(
  interval: number,
  weekdays: number[],
  previousNextDate: string | undefined,
  clock: Clock = systemClock,
): string {
  const today = clock.plainDateISO();

  if (!previousNextDate) {
    // First creation: nearest day from weekdays[], starting from tomorrow
    const tomorrow = today.add({ days: 1 });
    return findNextWeekday(tomorrow, weekdays, interval);
  }

  const prev = Temporal.PlainDate.from(previousNextDate);
  const nextDay = prev.add({ days: 1 });
  const candidate = findNextWeekday(nextDay, weekdays, interval);
  const candidateDate = Temporal.PlainDate.from(candidate);

  // Skip logic: if the date is in the past, jump to the nearest
  // period aligned to the interval (analogous to daily/monthly/yearly skip logic).
  // This prevents creating multiple missed copies during prolonged inactivity.
  if (Temporal.PlainDate.compare(candidateDate, today) < 0) {
    const periodDays = 7 * interval;
    const daysElapsed = nextDay.until(today, { largestUnit: "days" }).days;
    const periodsToSkip = Math.floor(daysElapsed / periodDays);
    const alignedStart = nextDay.add({ days: periodsToSkip * periodDays });
    const alignedCandidate = findNextWeekday(alignedStart, weekdays, interval);
    const alignedCandidateDate = Temporal.PlainDate.from(alignedCandidate);

    // If the aligned candidate is also in the past, advance to the next period
    if (Temporal.PlainDate.compare(alignedCandidateDate, today) <= 0) {
      return findNextWeekday(
        alignedStart.add({ days: periodDays }),
        weekdays,
        interval,
      );
    }
    return alignedCandidate;
  }

  return candidate;
}

function calculateNextDateMonthly(
  interval: number,
  dayOfMonth: number,
  previousNextDate: string,
  clock: Clock = systemClock,
): string {
  const prev = Temporal.PlainDate.from(previousNextDate);
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
  clock: Clock = systemClock,
): string {
  const prev = Temporal.PlainDate.from(previousNextDate);
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
  if (Temporal.PlainDate.compare(candidate, today) < 0) {
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
  const completedInstant = Temporal.Instant.from(completedAt);
  let timeZone: string;
  try {
    timeZone = clock.timeZoneId();
  } catch (error) {
    console.error("Invalid timezone from system, falling back to UTC:", error);
    timeZone = "UTC";
  }
  const completedDate = completedInstant
    .toZonedDateTimeISO(timeZone)
    .toPlainDate();
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
    const completedInstant = Temporal.Instant.from(completedAt);
    let timeZone: string;
    try {
      timeZone = clock.timeZoneId();
    } catch (error) {
      console.error(
        "Invalid timezone from system, falling back to UTC:",
        error,
      );
      timeZone = "UTC";
    }
    previousNextDate = completedInstant
      .toZonedDateTimeISO(timeZone)
      .toPlainDate()
      .toString();
  } else {
    previousNextDate = sanitizeDateOnly(previousNextDate) || previousNextDate;
  }

  const interval = rule.interval ?? 1;

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
        clock,
      );
    case "monthly":
      if (!rule.day_of_month)
        throw new Error("day_of_month required for monthly");
      return calculateNextDateMonthly(
        interval,
        rule.day_of_month,
        previousNextDate,
        clock,
      );
    case "yearly":
      if (!rule.month_and_day)
        throw new Error("month_and_day required for yearly");
      return calculateNextDateYearly(
        interval,
        rule.month_and_day,
        previousNextDate,
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
