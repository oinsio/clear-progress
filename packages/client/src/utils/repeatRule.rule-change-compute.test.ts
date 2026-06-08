// implements FR1, FR4, FR5 of repeating-task-rule-change
import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { computeRuleChangeUpdates } from "./repeatRule";

const CLOCK = fakeClock("2026-06-08T10:00:00Z");

function fixedDaily(interval: number, advanceDays = 0): RepeatRule {
  return {
    type: "fixed",
    frequency: "daily",
    interval,
    target_box: "today",
    advance_days: advanceDays,
  };
}

function afterCompletion(delayDays: number): RepeatRule {
  return {
    type: "after_completion",
    delay_days: delayDays,
    target_box: "today",
    advance_days: 0,
  };
}

describe("computeRuleChangeUpdates — recalculating path", () => {
  // FR1: daily interval change triggers recalculation
  it("should recalculate next_date when daily interval changes", () => {
    const oldRule = fixedDaily(1);
    const newRule = fixedDaily(5);
    const currentNextDate = "2026-06-11";

    const result = computeRuleChangeUpdates(
      oldRule,
      newRule,
      currentNextDate,
      CLOCK,
    );

    // interval=5 → today + 5 = 2026-06-13
    expect(result.next_date).toBe("2026-06-13");
    expect(result.appear_date).toBe("2026-06-13");
  });

  // FR1: recalc with advance_days on new rule
  it("should recalculate appear_date with advance_days on recalc", () => {
    const oldRule = fixedDaily(1);
    const newRule = fixedDaily(5, 2);
    const currentNextDate = "2026-06-11";

    const result = computeRuleChangeUpdates(
      oldRule,
      newRule,
      currentNextDate,
      CLOCK,
    );

    expect(result.next_date).toBe("2026-06-13");
    // appear = 2026-06-13 - 2 days = 2026-06-11
    expect(result.appear_date).toBe("2026-06-11");
  });

  // FR7: changing to after_completion → empty next_date and appear_date
  it("should return empty strings when recalculating to after_completion", () => {
    const oldRule = fixedDaily(1);
    const newRule = afterCompletion(7);
    const currentNextDate = "2026-06-11";

    const result = computeRuleChangeUpdates(
      oldRule,
      newRule,
      currentNextDate,
      CLOCK,
    );

    expect(result.next_date).toBe("");
    expect(result.appear_date).toBe("");
  });
});

describe("computeRuleChangeUpdates — non-recalculating path", () => {
  // FR5: empty currentNextDate → appear_date is also empty
  it("should return empty appear_date when currentNextDate is empty", () => {
    const oldRule = fixedDaily(3, 0);
    const newRule = fixedDaily(3, 2);
    const currentNextDate = "";

    const result = computeRuleChangeUpdates(
      oldRule,
      newRule,
      currentNextDate,
      CLOCK,
    );

    expect(result.next_date).toBe("");
    expect(result.appear_date).toBe("");
  });

  // FR4: after_completion delay_days change does not recalculate
  it("should not recalculate when after_completion delay_days changes", () => {
    const oldRule = afterCompletion(7);
    const newRule = afterCompletion(14);
    const currentNextDate = "2026-06-15";

    const result = computeRuleChangeUpdates(
      oldRule,
      newRule,
      currentNextDate,
      CLOCK,
    );

    expect(result.next_date).toBe("2026-06-15");
    expect(result.appear_date).toBe("2026-06-15");
  });
});
