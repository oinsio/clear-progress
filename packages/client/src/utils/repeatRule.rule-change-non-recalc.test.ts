// implements FR4, FR5 of repeating-task-rule-change
import { describe, expect, it } from "vitest";
import type { RepeatRule } from "@/types/common";
import { computeRuleChangeUpdates } from "./repeatRule";

function fixedDaily(interval: number, advance_days = 0): RepeatRule {
  return {
    type: "fixed",
    frequency: "daily",
    interval,
    target_box: "today",
    advance_days,
  };
}

describe("computeRuleChangeUpdates — non-recalculating changes", () => {
  it("should keep next_date and recalculate appear_date when only advance_days changes", () => {
    const oldRule = fixedDaily(3, 0);
    const newRule = fixedDaily(3, 2);
    const currentNextDate = "2026-06-11";

    const result = computeRuleChangeUpdates(oldRule, newRule, currentNextDate);

    expect(result.next_date).toBe("2026-06-11");
    expect(result.appear_date).toBe("2026-06-09");
  });

  it("should keep both next_date and appear_date when only target_box changes", () => {
    const oldRule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 3,
      target_box: "today",
      advance_days: 0,
    };
    const newRule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 3,
      target_box: "week",
      advance_days: 0,
    };
    const currentNextDate = "2026-06-11";

    const result = computeRuleChangeUpdates(oldRule, newRule, currentNextDate);

    expect(result.next_date).toBe("2026-06-11");
    expect(result.appear_date).toBe("2026-06-11");
  });
});
