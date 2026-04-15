import type { TFunction } from "i18next";
import type { RepeatRule } from "@/types/common";

export function parseRepeatRule(json: string): RepeatRule | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as RepeatRule;
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
): string {
  const prev = new Date(previousNextDate);
  const next = new Date(prev);
  next.setUTCDate(prev.getUTCDate() + interval);

  // Если previousNextDate в прошлом, вычислить ближайшую будущую дату
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (next < today) {
    const daysSincePrev = Math.floor(
      (today.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    const periodsToSkip = Math.ceil(daysSincePrev / interval);
    next.setUTCDate(prev.getUTCDate() + periodsToSkip * interval);
  }

  return next.toISOString().split("T")[0]; // YYYY-MM-DD
}

function findNextWeekday(
  startDate: Date,
  weekdays: number[],
  interval: number,
): string {
  // weekdays: 1=Пн, 2=Вт, ..., 7=Вс
  // startDate.getUTCDay(): 0=Вс, 1=Пн, ..., 6=Сб
  const sortedWeekdays = [...weekdays].sort((a, b) => a - b);
  const current = new Date(startDate);

  for (let i = 0; i < 7 * interval; i++) {
    const jsDay = current.getUTCDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;

    if (sortedWeekdays.includes(isoDay)) {
      return current.toISOString().split("T")[0];
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return current.toISOString().split("T")[0];
}

function calculateNextDateWeekly(
  interval: number,
  weekdays: number[],
  previousNextDate?: string,
): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!previousNextDate) {
    // Первое создание: ближайший день из weekdays[], начиная с завтра
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return findNextWeekday(tomorrow, weekdays, interval);
  }

  const prev = new Date(previousNextDate);
  const nextDay = new Date(prev);
  nextDay.setDate(prev.getDate() + 1);

  return findNextWeekday(nextDay, weekdays, interval);
}

function calculateNextDateMonthly(
  interval: number,
  dayOfMonth: number,
  previousNextDate: string,
): string {
  const prev = new Date(previousNextDate);
  let year = prev.getFullYear();
  let month = prev.getMonth() + interval; // 0-based

  // Нормализация месяца и года
  while (month > 11) {
    month -= 12;
    year++;
  }

  // Обработка месяцев с разным количеством дней
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(dayOfMonth, daysInMonth);

  const next = new Date(Date.UTC(year, month, actualDay));
  return next.toISOString().split("T")[0];
}

function calculateNextDateYearly(
  interval: number,
  monthAndDay: { month: number; day: number },
  previousNextDate: string,
): string {
  const prev = new Date(previousNextDate);
  const year = prev.getFullYear() + interval;
  const month = monthAndDay.month - 1; // 0-based

  // Обработка 29 февраля в невисокосный год
  let day = monthAndDay.day;
  if (month === 1 && day === 29) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (!isLeapYear) {
      day = 28;
    }
  }

  const next = new Date(Date.UTC(year, month, day));
  return next.toISOString().split("T")[0];
}

function calculateNextDateAfterCompletion(
  delayDays: number,
  completedAt: string,
): string {
  const completed = new Date(completedAt);
  const next = new Date(completed);
  next.setUTCDate(completed.getUTCDate() + delayDays);
  return next.toISOString().split("T")[0];
}

export function calculateNextDate(
  rule: RepeatRule,
  completedAt: string,
  previousNextDate?: string,
): string {
  if (rule.type === "after_completion") {
    if (!rule.delay_days)
      throw new Error("delay_days required for after_completion");
    return calculateNextDateAfterCompletion(rule.delay_days, completedAt);
  }

  // type === 'fixed'
  if (!rule.frequency) throw new Error("frequency required for fixed");
  if (!previousNextDate) {
    // Первое создание: используем completedAt как базу
    previousNextDate = completedAt.split("T")[0];
  }

  const interval = rule.interval ?? 1;

  switch (rule.frequency) {
    case "daily":
      return calculateNextDateDaily(interval, previousNextDate);
    case "weekly":
      if (!rule.weekdays || rule.weekdays.length === 0) {
        throw new Error("weekdays required for weekly");
      }
      return calculateNextDateWeekly(interval, rule.weekdays, previousNextDate);
    case "monthly":
      if (!rule.day_of_month)
        throw new Error("day_of_month required for monthly");
      return calculateNextDateMonthly(
        interval,
        rule.day_of_month,
        previousNextDate,
      );
    case "yearly":
      if (!rule.month_and_day)
        throw new Error("month_and_day required for yearly");
      return calculateNextDateYearly(
        interval,
        rule.month_and_day,
        previousNextDate,
      );
    default:
      throw new Error(`Unknown frequency: ${rule.frequency}`);
  }
}

export function calculateAppearDate(
  nextDate: string,
  advanceDays: number,
): string {
  const next = new Date(nextDate);
  next.setDate(next.getDate() - advanceDays);
  return next.toISOString().split("T")[0];
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
