import i18n from "i18next";
import { describe, expect, it } from "vitest";
import type { RepeatRule } from "@/types/common";
import { formatRepeatRuleLabel, serializeRepeatRule } from "./repeatRule";

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

  it("should format yearly rule in Russian", async () => {
    await i18n.changeLanguage("ru");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 2, day: 28 },
      target_box: "today",
      advance_days: 0,
    };
    const label = formatRepeatRuleLabel(rule, t);
    expect(label).toContain("28 февраля");
  });

  it("should format yearly rule in English", async () => {
    await i18n.changeLanguage("en");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 2, day: 28 },
      target_box: "today",
      advance_days: 0,
    };
    const label = formatRepeatRuleLabel(rule, t);
    expect(label).toContain("February 28th");
  });

  it("should format yearly rule with ordinal 1st", async () => {
    await i18n.changeLanguage("en");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 1, day: 1 },
      target_box: "today",
      advance_days: 0,
    };
    const label = formatRepeatRuleLabel(rule, t);
    expect(label).toContain("January 1st");
  });

  it("should format yearly rule with ordinal 2nd", async () => {
    await i18n.changeLanguage("en");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 3, day: 2 },
      target_box: "today",
      advance_days: 0,
    };
    const label = formatRepeatRuleLabel(rule, t);
    expect(label).toContain("March 2nd");
  });

  it("should format yearly rule with ordinal 3rd", async () => {
    await i18n.changeLanguage("en");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 5, day: 3 },
      target_box: "today",
      advance_days: 0,
    };
    const label = formatRepeatRuleLabel(rule, t);
    expect(label).toContain("May 3rd");
  });

  it("should format yearly rule with ordinal 31st", async () => {
    await i18n.changeLanguage("en");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 12, day: 31 },
      target_box: "today",
      advance_days: 0,
    };
    const label = formatRepeatRuleLabel(rule, t);
    expect(label).toContain("December 31st");
  });
});
