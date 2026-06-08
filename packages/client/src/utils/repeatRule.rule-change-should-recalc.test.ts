// implements FR1, FR2, FR3, FR7 of repeating-task-rule-change
import { describe, expect, it } from "vitest";
import type { RepeatRule } from "@/types/common";
import { shouldRecalculateNextDate } from "./repeatRule";
import {
  afterCompletion,
  fixedDaily,
  fixedMonthly,
  fixedWeekly,
  fixedYearly,
} from "./repeatRule.test-factories";

describe("shouldRecalculateNextDate", () => {
  it.each([
    {
      name: "daily interval change (1->5)",
      oldRule: fixedDaily(1),
      newRule: fixedDaily(5),
    },
    {
      name: "daily -> weekly",
      oldRule: fixedDaily(),
      newRule: fixedWeekly([3]),
    },
    {
      name: "daily -> monthly",
      oldRule: fixedDaily(),
      newRule: fixedMonthly(15),
    },
    {
      name: "daily -> yearly",
      oldRule: fixedDaily(),
      newRule: fixedYearly(12, 25),
    },
    {
      name: "weekly -> daily",
      oldRule: fixedWeekly([1]),
      newRule: fixedDaily(),
    },
    {
      name: "weekly weekdays change ([1]->[5])",
      oldRule: fixedWeekly([1]),
      newRule: fixedWeekly([5]),
    },
    {
      name: "monthly -> daily",
      oldRule: fixedMonthly(15),
      newRule: fixedDaily(),
    },
    {
      name: "fixed -> after_completion",
      oldRule: fixedDaily(),
      newRule: afterCompletion(7),
    },
    {
      name: "after_completion -> fixed daily",
      oldRule: afterCompletion(7),
      newRule: fixedDaily(3),
    },
    {
      name: "after_completion -> fixed weekly",
      oldRule: afterCompletion(7),
      newRule: fixedWeekly([3]),
    },
  ])("should return true for: $name", ({ oldRule, newRule }) => {
    expect(shouldRecalculateNextDate(oldRule, newRule)).toBe(true);
  });

  it.each([
    {
      name: "after_completion delay_days change only",
      oldRule: afterCompletion(7),
      newRule: afterCompletion(14),
    },
    {
      name: "advance_days change only",
      oldRule: fixedDaily(),
      newRule: { ...fixedDaily(), advance_days: 3 },
    },
    {
      name: "target_box change only",
      oldRule: fixedDaily(),
      newRule: { ...fixedDaily(), target_box: "week" as const },
    },
    {
      name: "same after_completion rules (same delay_days)",
      oldRule: afterCompletion(7),
      newRule: afterCompletion(7),
    },
    {
      name: "same fixed daily rules (identical)",
      oldRule: fixedDaily(),
      newRule: fixedDaily(),
    },
    {
      name: "same fixed weekly rules (identical weekdays)",
      oldRule: fixedWeekly([1, 3]),
      newRule: fixedWeekly([1, 3]),
    },
    {
      name: "same fixed monthly rules (identical day_of_month)",
      oldRule: fixedMonthly(15),
      newRule: fixedMonthly(15),
    },
    {
      name: "same fixed yearly rules (identical month_and_day)",
      oldRule: fixedYearly(6, 8),
      newRule: fixedYearly(6, 8),
    },
  ])("should return false for: $name", ({ oldRule, newRule }) => {
    expect(shouldRecalculateNextDate(oldRule, newRule)).toBe(false);
  });

  it("should return false for interval=undefined vs interval=1 (both default to 1)", () => {
    const oldRule = {
      ...fixedDaily(),
      interval: undefined,
    } as unknown as RepeatRule;
    const newRule = fixedDaily(1);
    expect(shouldRecalculateNextDate(oldRule, newRule)).toBe(false);
  });

  // FR2: same weekdays in different order should NOT recalculate
  it("should return false for same weekdays in different order", () => {
    const oldRule = fixedWeekly([5, 3, 1]);
    const newRule = fixedWeekly([1, 5, 3]);
    expect(shouldRecalculateNextDate(oldRule, newRule)).toBe(false);
  });

  // FR2: isolated field changes for monthly and yearly
  it.each([
    {
      name: "monthly day_of_month change (15->20)",
      oldRule: fixedMonthly(15),
      newRule: fixedMonthly(20),
    },
    {
      name: "yearly month change (6,8 -> 7,8)",
      oldRule: fixedYearly(6, 8),
      newRule: fixedYearly(7, 8),
    },
    {
      name: "yearly day change (6,8 -> 6,15)",
      oldRule: fixedYearly(6, 8),
      newRule: fixedYearly(6, 15),
    },
    {
      name: "weekly weekdays length change ([1,3] -> [1])",
      oldRule: fixedWeekly([1, 3]),
      newRule: fixedWeekly([1]),
    },
    {
      name: "frequency-only change (daily -> weekly, no other fields differ)",
      oldRule: {
        type: "fixed" as const,
        frequency: "daily" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 0,
      },
      newRule: {
        type: "fixed" as const,
        frequency: "weekly" as const,
        interval: 1,
        target_box: "today" as const,
        advance_days: 0,
      },
    },
  ])("should return true for isolated field change: $name", ({
    oldRule,
    newRule,
  }) => {
    expect(shouldRecalculateNextDate(oldRule, newRule)).toBe(true);
  });
});
