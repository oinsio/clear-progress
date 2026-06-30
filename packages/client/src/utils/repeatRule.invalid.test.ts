import { describe, expect, it } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { isRepeatRuleInvalid } from "./repeatRule";

describe("isRepeatRuleInvalid", () => {
  it.each([
    {
      scenario: "unknown type",
      repeatRule: '{"type":"unknown"}',
    },
    {
      scenario: "corrupted JSON",
      repeatRule: "{not valid json}",
    },
  ])("returns true when repeat_rule is non-empty but fails parsing ($scenario)", ({
    repeatRule,
  }) => {
    const task = buildTask({ repeat_rule: repeatRule });

    expect(isRepeatRuleInvalid(task)).toBe(true);
  });

  it("returns false when repeat_rule is empty", () => {
    const task = buildTask({ repeat_rule: "" });

    expect(isRepeatRuleInvalid(task)).toBe(false);
  });

  it("returns false when repeat_rule is valid", () => {
    const validRepeatRule = JSON.stringify({
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    });
    const task = buildTask({ repeat_rule: validRepeatRule });

    expect(isRepeatRuleInvalid(task)).toBe(false);
  });
});
