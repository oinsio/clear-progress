import type { RepeatRule } from "@/types/common";

export function fixedDaily(interval = 1, advanceDays = 0): RepeatRule {
  return {
    type: "fixed",
    frequency: "daily",
    interval,
    target_box: "today",
    advance_days: advanceDays,
  };
}

export function fixedWeekly(weekdays: number[], interval = 1): RepeatRule {
  return {
    type: "fixed",
    frequency: "weekly",
    interval,
    weekdays,
    target_box: "today",
    advance_days: 0,
  };
}

export function fixedMonthly(dayOfMonth: number): RepeatRule {
  return {
    type: "fixed",
    frequency: "monthly",
    interval: 1,
    day_of_month: dayOfMonth,
    target_box: "today",
    advance_days: 0,
  };
}

export function fixedYearly(month: number, day: number): RepeatRule {
  return {
    type: "fixed",
    frequency: "yearly",
    interval: 1,
    month_and_day: { month, day },
    target_box: "today",
    advance_days: 0,
  };
}

export function afterCompletion(delayDays: number): RepeatRule {
  return {
    type: "after_completion",
    delay_days: delayDays,
    target_box: "today",
    advance_days: 0,
  };
}
