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
import { fakeClock } from "@/lib/temporal";

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

describe("calculateNextDate", () => {
  it("should calculate next date for daily rule", () => {
    const clock = fakeClock("2026-04-16T10:00:00Z");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-15"; // вчера
    const completedAt = "2026-04-13T10:00:00.000Z";
    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    expect(nextDate).toBe("2026-04-16"); // сегодня
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

  it("should calculate next date for monthly rule without timezone shift", () => {
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 7,
      target_box: "today",
      advance_days: 0,
    };
    const completedAt = "2026-04-15T10:00:00.000Z";
    const previousNextDate = "2026-04-07";
    const nextDate = calculateNextDate(rule, completedAt, previousNextDate);
    expect(nextDate).toBe("2026-05-07");
  });

  it("should calculate next date for yearly rule without timezone shift", () => {
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 5, day: 7 },
      target_box: "today",
      advance_days: 0,
    };
    const completedAt = "2026-04-15T10:00:00.000Z";
    const previousNextDate = "2025-05-07";
    const nextDate = calculateNextDate(rule, completedAt, previousNextDate);
    expect(nextDate).toBe("2026-05-07");
  });

  it("should calculate next date for after_completion without timezone shift", () => {
    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 7,
      target_box: "today",
      advance_days: 0,
    };
    const completedAt = "2026-04-07T10:00:00.000Z";
    const nextDate = calculateNextDate(rule, completedAt);
    expect(nextDate).toBe("2026-04-14");
  });

  it("should use clock timezone for after_completion date extraction", () => {
    // completedAt is 2026-04-16T23:00:00Z — in UTC it's still April 16
    // but in UTC+5 (Asia/Almaty) it's already April 17 04:00
    const clock = fakeClock("2026-04-17T04:00:00Z", "Asia/Almaty");
    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 1,
      target_box: "today",
      advance_days: 0,
    };
    const completedAt = "2026-04-16T23:00:00.000Z";
    const nextDate = calculateNextDate(rule, completedAt, undefined, clock);
    // In Asia/Almaty, completedAt is April 17 → next = April 18
    expect(nextDate).toBe("2026-04-18");
  });

  it("should use clock timezone for fixed rule without previousNextDate", () => {
    // completedAt is 2026-04-16T23:00:00Z — UTC says April 16
    // but in UTC+5 it's April 17
    const clock = fakeClock("2026-04-17T04:00:00Z", "Asia/Almaty");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    };
    const completedAt = "2026-04-16T23:00:00.000Z";
    // No previousNextDate → completedAt date is used as base
    // In Asia/Almaty, completedAt is April 17 → next daily = April 18
    const nextDate = calculateNextDate(rule, completedAt, undefined, clock);
    expect(nextDate).toBe("2026-04-18");
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

describe("calculateNextDate with timezone changes", () => {
  it("should calculate daily task next_date in new timezone", () => {
    // Создаём задачу в UTC+5 (Asia/Almaty)
    const clockAlmaty = fakeClock("2026-04-16T03:00:00Z", "Asia/Almaty");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    };
    const completedAt = "2026-04-16T03:00:00.000Z"; // 08:00 по Алматы
    const previousNextDate = "2026-04-16";

    const nextDateAlmaty = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clockAlmaty,
    );
    expect(nextDateAlmaty).toBe("2026-04-17"); // завтра по Алматы

    // Пользователь переехал в UTC-5 (America/New_York)
    const clockNY = fakeClock("2026-04-17T14:00:00Z", "America/New_York");
    const nextDateNY = calculateNextDate(
      rule,
      "2026-04-17T14:00:00.000Z",
      nextDateAlmaty,
      clockNY,
    );
    expect(nextDateNY).toBe("2026-04-18"); // завтра по Нью-Йорку
  });

  it("should calculate weekly task next_date in new timezone", () => {
    // Weekly задача: каждый понедельник и среду
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3], // Пн, Ср
      target_box: "today",
      advance_days: 0,
    };

    // Завершили в понедельник 14 апреля в UTC
    const clockUTC = fakeClock("2026-04-14T10:00:00Z", "UTC");
    const completedAt = "2026-04-14T10:00:00.000Z";
    const previousNextDate = "2026-04-14";

    const nextDateUTC = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clockUTC,
    );
    expect(nextDateUTC).toBe("2026-04-15"); // среда

    // Переехали в UTC+10 (Australia/Sydney)
    const clockSydney = fakeClock("2026-04-15T20:00:00Z", "Australia/Sydney");
    const nextDateSydney = calculateNextDate(
      rule,
      "2026-04-15T20:00:00.000Z",
      nextDateUTC,
      clockSydney,
    );
    expect(nextDateSydney).toBe("2026-04-20"); // следующий понедельник
  });

  it("should calculate after_completion task in new timezone", () => {
    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 7,
      target_box: "week",
      advance_days: 0,
    };

    // Завершили в UTC+0 (Europe/London)
    const completedAt = "2026-04-10T14:00:00.000Z"; // 14:00 по Лондону = 2026-04-10
    const clockLondon = fakeClock("2026-04-10T14:00:00Z", "Europe/London");
    const nextDateLondon = calculateNextDate(
      rule,
      completedAt,
      undefined,
      clockLondon,
    );
    expect(nextDateLondon).toBe("2026-04-17"); // +7 дней от 2026-04-10

    // Переехали в UTC+10 (Australia/Sydney)
    // Тот же completedAt в Сиднее = 2026-04-11 00:00 (следующий день из-за UTC+10)
    const clockSydney = fakeClock("2026-04-11T00:00:00Z", "Australia/Sydney");
    const nextDateSydney = calculateNextDate(
      rule,
      completedAt,
      undefined,
      clockSydney,
    );
    expect(nextDateSydney).toBe("2026-04-18"); // +7 дней от 2026-04-11 (дата в Sydney TZ)
  });

  it("should handle timezone change across midnight boundary", () => {
    // Завершили задачу в 23:50 по Токио (UTC+9)
    const completedAt = "2026-04-10T14:50:00.000Z"; // 23:50 по Токио = 2026-04-10
    const clockTokyo = fakeClock("2026-04-10T14:50:00Z", "Asia/Tokyo");

    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 3,
      target_box: "today",
      advance_days: 0,
    };

    const nextDateTokyo = calculateNextDate(
      rule,
      completedAt,
      undefined,
      clockTokyo,
    );
    expect(nextDateTokyo).toBe("2026-04-13"); // +3 дня от 2026-04-10

    // Переехали в UTC+0 (Europe/London)
    // Тот же completedAt в Лондоне = 2026-04-10 14:50 (тот же день)
    const clockLondon = fakeClock("2026-04-10T14:50:00Z", "Europe/London");
    const nextDateLondon = calculateNextDate(
      rule,
      completedAt,
      undefined,
      clockLondon,
    );
    expect(nextDateLondon).toBe("2026-04-13"); // +3 дня от 2026-04-10
  });
});
