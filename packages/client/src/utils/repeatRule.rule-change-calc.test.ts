// implements FR1, FR2, FR3, FR7 of repeating-task-rule-change
import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDateOnRuleChange } from "./repeatRule";

const DATE_OF_CHANGE = "2026-06-08"; // Monday
const CLOCK = fakeClock("2026-06-08T10:00:00Z");

function fixedDaily(interval: number): RepeatRule {
  return {
    type: "fixed",
    frequency: "daily",
    interval,
    target_box: "today",
    advance_days: 0,
  };
}

function fixedWeekly(weekdays: number[]): RepeatRule {
  return {
    type: "fixed",
    frequency: "weekly",
    interval: 1,
    weekdays,
    target_box: "today",
    advance_days: 0,
  };
}

function fixedMonthly(dayOfMonth: number): RepeatRule {
  return {
    type: "fixed",
    frequency: "monthly",
    interval: 1,
    day_of_month: dayOfMonth,
    target_box: "today",
    advance_days: 0,
  };
}

function fixedYearly(month: number, day: number): RepeatRule {
  return {
    type: "fixed",
    frequency: "yearly",
    interval: 1,
    month_and_day: { month, day },
    target_box: "today",
    advance_days: 0,
  };
}

describe("calculateNextDateOnRuleChange", () => {
  it.each([
    {
      name: "daily interval 1->5",
      newRule: fixedDaily(5),
      expected: "2026-06-13",
    },
    {
      name: "daily->weekly weekdays=[3] (Wed)",
      newRule: fixedWeekly([3]),
      expected: "2026-06-10",
    },
    {
      name: "daily->monthly day_of_month=15",
      newRule: fixedMonthly(15),
      expected: "2026-06-15",
    },
    {
      name: "daily->yearly month=12 day=25",
      newRule: fixedYearly(12, 25),
      expected: "2026-12-25",
    },
    {
      name: "weekly->daily interval=3",
      newRule: fixedDaily(3),
      expected: "2026-06-11",
    },
    {
      name: "weekly weekdays [1]->[5] (Fri)",
      newRule: fixedWeekly([5]),
      expected: "2026-06-12",
    },
    {
      name: "monthly->daily interval=2",
      newRule: fixedDaily(2),
      expected: "2026-06-10",
    },
    {
      name: "after_completion->daily interval=3",
      newRule: fixedDaily(3),
      expected: "2026-06-11",
    },
    {
      name: "after_completion->weekly weekdays=[3] (Wed)",
      newRule: fixedWeekly([3]),
      expected: "2026-06-10",
    },
  ])("should calculate next_date for: $name", ({ newRule, expected }) => {
    const nextDate = calculateNextDateOnRuleChange(
      newRule,
      DATE_OF_CHANGE,
      CLOCK,
    );
    expect(nextDate).toBe(expected);
  });

  // FR2: boundary — monthly day_of_month equals today → next month
  it("should go to next month when monthly day_of_month equals today", () => {
    const rule = fixedMonthly(8); // today is June 8
    const nextDate = calculateNextDateOnRuleChange(rule, DATE_OF_CHANGE, CLOCK);
    expect(nextDate).toBe("2026-07-08");
  });

  // FR2: monthly day already passed this month
  it("should go to next month when monthly day_of_month already passed", () => {
    const rule = fixedMonthly(7); // yesterday
    const nextDate = calculateNextDateOnRuleChange(rule, DATE_OF_CHANGE, CLOCK);
    expect(nextDate).toBe("2026-07-07");
  });

  // FR3: boundary — yearly month_and_day equals today → next year
  it("should go to next year when yearly date equals today", () => {
    const rule = fixedYearly(6, 8); // today is June 8
    const nextDate = calculateNextDateOnRuleChange(rule, DATE_OF_CHANGE, CLOCK);
    expect(nextDate).toBe("2027-06-08");
  });

  // FR3: yearly date already passed this year
  it("should go to next year when yearly date already passed", () => {
    const rule = fixedYearly(5, 25); // May 25 already passed
    const nextDate = calculateNextDateOnRuleChange(rule, DATE_OF_CHANGE, CLOCK);
    expect(nextDate).toBe("2027-05-25");
  });

  // FR1: weekly with unsorted weekdays — verifies sorting logic
  it("should handle unsorted weekdays correctly", () => {
    const rule = fixedWeekly([5, 3]); // unsorted: Fri, Wed
    // June 8 is Monday, tomorrow is Tuesday(2), then Wed(3) → June 10
    const nextDate = calculateNextDateOnRuleChange(rule, DATE_OF_CHANGE, CLOCK);
    expect(nextDate).toBe("2026-06-10");
  });

  // FR7: weekly with empty weekdays → should throw error
  it("should throw error when weekly has empty weekdays", () => {
    const rule = fixedWeekly([]);
    expect(() =>
      calculateNextDateOnRuleChange(rule, DATE_OF_CHANGE, CLOCK),
    ).toThrow("No matching weekday found");
  });

  // Covers no-coverage: weekdays ?? [] default when weekdays is undefined
  it("should throw error when weekly has undefined weekdays", () => {
    const rule = {
      type: "fixed" as const,
      frequency: "weekly" as const,
      interval: 1,
      target_box: "today" as const,
      advance_days: 0,
    } as RepeatRule;
    expect(() =>
      calculateNextDateOnRuleChange(rule, DATE_OF_CHANGE, CLOCK),
    ).toThrow("No matching weekday found");
  });

  // FR3: yearly Feb 29 falling on leap year — kills year+1 → year-1 mutant
  it("should handle yearly Feb 29 falling on leap year correctly", () => {
    const clock = fakeClock("2027-06-08T10:00:00Z");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 2, day: 29 },
      target_box: "today",
      advance_days: 0,
    };
    const nextDate = calculateNextDateOnRuleChange(rule, "2027-06-08", clock);
    expect(nextDate).toBe("2028-02-29");
  });

  // FR7: unknown frequency — kills no-coverage on default switch case
  it("should throw for unknown frequency", () => {
    const rule = {
      type: "fixed" as const,
      frequency: "biweekly" as any,
      interval: 1,
      target_box: "today" as const,
      advance_days: 0,
    };
    expect(() => calculateNextDateOnRuleChange(rule, "2026-06-08")).toThrow(
      "Unknown frequency",
    );
  });

  // FR3: yearly with no month_and_day — defaults to Jan 1
  it("should use default month_and_day when not provided in yearly rule", () => {
    const rule = {
      type: "fixed" as const,
      frequency: "yearly" as const,
      interval: 1,
      target_box: "today" as const,
      advance_days: 0,
    } as RepeatRule;
    // month_and_day is undefined → defaults to {month: 1, day: 1} → Jan 1
    // Today is June 8, 2026 — Jan 1 already passed → next year Jan 1, 2027
    const nextDate = calculateNextDateOnRuleChange(rule, DATE_OF_CHANGE, CLOCK);
    expect(nextDate).toBe("2027-01-01");
  });

  it("should return empty string when changing to after_completion", () => {
    const newRule: RepeatRule = {
      type: "after_completion",
      delay_days: 7,
      target_box: "today",
      advance_days: 0,
    };

    const nextDate = calculateNextDateOnRuleChange(
      newRule,
      DATE_OF_CHANGE,
      CLOCK,
    );

    expect(nextDate).toBe("");
  });
});
