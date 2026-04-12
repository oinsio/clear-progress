import { describe, it, expect } from "vitest";
import i18n from "i18next";
import {
  parseRepeatRule,
  serializeRepeatRule,
  formatRepeatRuleLabel,
  calculateNextDate,
  calculateAppearDate,
} from "./repeatRule";
import type { RepeatRule } from "@/types/common";

describe("parseRepeatRule", () => {
  it("should return null for empty string", () => {
    expect(parseRepeatRule("")).toBeNull();
  });

  it("should parse a valid fixed daily repeat rule", () => {
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    };
    expect(parseRepeatRule(JSON.stringify(rule))).toEqual(rule);
  });

  it("should parse a fixed weekly rule with weekdays", () => {
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3, 5],
      target_box: "today",
      advance_days: 0,
    };
    expect(parseRepeatRule(JSON.stringify(rule))).toEqual(rule);
  });

  it("should parse an after_completion rule", () => {
    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 7,
      target_box: "week",
      advance_days: 2,
    };
    expect(parseRepeatRule(JSON.stringify(rule))).toEqual(rule);
  });

  it("should return null for invalid JSON", () => {
    expect(parseRepeatRule("invalid json")).toBeNull();
  });
});

describe("serializeRepeatRule", () => {
  it("should serialize a fixed daily rule to JSON string", () => {
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    };
    expect(serializeRepeatRule(rule)).toBe(JSON.stringify(rule));
  });

  it("should serialize a fixed weekly rule with weekdays", () => {
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3, 5],
      target_box: "today",
      advance_days: 0,
    };
    expect(serializeRepeatRule(rule)).toBe(JSON.stringify(rule));
  });

  it("should serialize an after_completion rule", () => {
    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 7,
      target_box: "week",
      advance_days: 2,
    };
    expect(serializeRepeatRule(rule)).toBe(JSON.stringify(rule));
  });
});

describe("formatRepeatRuleLabel", () => {
  const t = i18n.t.bind(i18n);

  it("should format fixed daily rule", () => {
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    };
    const label = formatRepeatRuleLabel(rule, t);
    expect(label).toBeTruthy();
    expect(typeof label).toBe("string");
  });

  it("should format fixed weekly rule", () => {
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3, 5],
      target_box: "today",
      advance_days: 0,
    };
    const label = formatRepeatRuleLabel(rule, t);
    expect(label).toBeTruthy();
    expect(typeof label).toBe("string");
  });

  it("should format after_completion rule", () => {
    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 7,
      target_box: "week",
      advance_days: 2,
    };
    const label = formatRepeatRuleLabel(rule, t);
    expect(label).toBeTruthy();
    expect(typeof label).toBe("string");
  });
});

describe("calculateNextDate", () => {
  it("should calculate next date for daily rule", () => {
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    };
    const completedAt = "2026-04-13T10:00:00.000Z";
    const nextDate = calculateNextDate(rule, completedAt);
    expect(nextDate).toBe("2026-04-14");
  });

  it("should calculate next date for after_completion rule", () => {
    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 7,
      target_box: "week",
      advance_days: 0,
    };
    const completedAt = "2026-04-13T10:00:00.000Z";
    const nextDate = calculateNextDate(rule, completedAt);
    expect(nextDate).toBe("2026-04-20");
  });
});

describe("calculateAppearDate", () => {
  it("should calculate appear date with advance_days = 0", () => {
    const nextDate = "2026-04-14";
    const appearDate = calculateAppearDate(nextDate, 0);
    expect(appearDate).toBe("2026-04-14");
  });

  it("should calculate appear date with advance_days = 2", () => {
    const nextDate = "2026-04-14";
    const appearDate = calculateAppearDate(nextDate, 2);
    expect(appearDate).toBe("2026-04-12");
  });
});
