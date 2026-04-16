import type { TFunction } from "i18next";
import type { RepeatRule } from "@/types/common";
import { Temporal, type Clock, systemClock } from "@/lib/temporal";
import {
  MIN_ISO_WEEKDAY,
  MAX_ISO_WEEKDAY,
  MIN_DAY_OF_MONTH,
  MAX_DAY_OF_MONTH,
  MIN_MONTH,
  MAX_MONTH,
} from "@/constants";

function isValidInteger(value: number): boolean {
  return Number.isInteger(value);
}

function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function validateRepeatRule(rule: RepeatRule): boolean {
  if (rule.weekdays !== undefined) {
    if (rule.weekdays.length === 0) return false;
    for (const day of rule.weekdays) {
      if (!isValidInteger(day) || !isInRange(day, MIN_ISO_WEEKDAY, MAX_ISO_WEEKDAY)) {
        return false;
      }
    }
  }

  if (rule.day_of_month !== undefined) {
    if (!isInRange(rule.day_of_month, MIN_DAY_OF_MONTH, MAX_DAY_OF_MONTH)) {
      return false;
    }
  }

  if (rule.month_and_day !== undefined) {
    if (!isInRange(rule.month_and_day.month, MIN_MONTH, MAX_MONTH)) {
      return false;
    }
    if (!isInRange(rule.month_and_day.day, MIN_DAY_OF_MONTH, MAX_DAY_OF_MONTH)) {
      return false;
    }
  }

  return true;
}

export function parseRepeatRule(json: string): RepeatRule | null {
  if (!json) return null;
  try {
    const rule = JSON.parse(json) as RepeatRule;
    if (!validateRepeatRule(rule)) return null;
    return rule;
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
  // Skip logic: если next_date оказался в прошлом (пользователь не открывал приложение
  // несколько дней), вычисляем ближайшую будущую дату вместо создания множества
  // пропущенных копий. Это сознательное архитектурное решение для GTD-приложения.
  // Подробнее: .claude/docs/architecture/recurring-tasks-skip-logic.md
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
  // weekdays: 1=Пн, 2=Вт, ..., 7=Вс (ISO 8601)
  const sortedWeekdays = [...weekdays].sort((a, b) => a - b);
  let current = startDate;

  for (let i = 0; i < 7 * interval; i++) {
    const isoDay = current.dayOfWeek; // 1=Mon ... 7=Sun

    if (sortedWeekdays.includes(isoDay)) {
      return current.toString();
    }

    current = current.add({ days: 1 });
  }

  throw new Error(
    `No matching weekday found in ${7 * interval} days for weekdays: [${weekdays}]`,
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
    // Первое создание: ближайший день из weekdays[], начиная с завтра
    const tomorrow = today.add({ days: 1 });
    return findNextWeekday(tomorrow, weekdays, interval);
  }

  const nextDay = Temporal.PlainDate.from(previousNextDate).add({ days: 1 });
  const candidate = findNextWeekday(nextDay, weekdays, interval);
  const candidateDate = Temporal.PlainDate.from(candidate);

  // Skip logic: если дата в прошлом, ищем от завтра
  // Это предотвращает создание множества пропущенных копий при длительной не активности
  if (Temporal.PlainDate.compare(candidateDate, today) < 0) {
    const tomorrow = today.add({ days: 1 });
    return findNextWeekday(tomorrow, weekdays, interval);
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
  let targetYearMonth = prev.toPlainYearMonth().add({ months: interval });

  // Skip logic: если целевой месяц в прошлом, перепрыгнуть к текущему/следующему
  // Это предотвращает создание множества пропущенных копий при длительной не активности
  const todayYearMonth = today.toPlainYearMonth();
  if (Temporal.PlainYearMonth.compare(targetYearMonth, todayYearMonth) < 0) {
    targetYearMonth = todayYearMonth;
    // Если день уже прошёл или сегодня в текущем месяце, перейти к следующему
    if (today.day >= dayOfMonth) {
      targetYearMonth = targetYearMonth.add({ months: 1 });
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

  // Skip logic: если целевой год в прошлом, перепрыгнуть к текущему/следующему
  // Это предотвращает создание множества пропущенных копий при длительной не активности
  if (targetYear < today.year) {
    targetYear = today.year;
  }

  // Создаём кандидата для текущего целевого года
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

  // Если дата уже прошла в текущем году, перейти к следующему году
  if (Temporal.PlainDate.compare(candidate, today) < 0) {
    const nextYear = targetYear + 1;
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
  const timeZone = clock.timeZoneId();
  const completedDate = completedInstant.toZonedDateTimeISO(timeZone).toPlainDate();
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
    return calculateNextDateAfterCompletion(rule.delay_days, completedAt, clock);
  }

  // type === 'fixed'
  if (!rule.frequency) throw new Error("frequency required for fixed");
  if (!previousNextDate) {
    // Первое создание: используем completedAt как базу
    const completedInstant = Temporal.Instant.from(completedAt);
    previousNextDate = completedInstant
      .toZonedDateTimeISO(clock.timeZoneId())
      .toPlainDate()
      .toString();
  }

  const interval = rule.interval ?? 1;

  switch (rule.frequency) {
    case "daily":
      return calculateNextDateDaily(interval, previousNextDate, clock);
    case "weekly":
      if (!rule.weekdays || rule.weekdays.length === 0) {
        throw new Error("weekdays required for weekly");
      }
      return calculateNextDateWeekly(interval, rule.weekdays, previousNextDate, clock);
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
  return Temporal.PlainDate.from(nextDate)
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
      return t("repeat.everyNMonths", { count: interval, day: rule.day_of_month });
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
