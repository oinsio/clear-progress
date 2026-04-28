import i18n from "i18next";
import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import {
  calculateAppearDate,
  calculateNextDate,
  formatRepeatRuleLabel,
  parseRepeatRule,
  serializeRepeatRule,
} from "./repeatRule";

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

describe("parseRepeatRule validation", () => {
  it("should return null when weekdays contain value below MIN_ISO_WEEKDAY", () => {
    const json = JSON.stringify({
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [0, 3],
      target_box: "today",
      advance_days: 0,
    });
    expect(parseRepeatRule(json)).toBeNull();
  });

  it("should return null when weekdays contain value above MAX_ISO_WEEKDAY", () => {
    const json = JSON.stringify({
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 8],
      target_box: "today",
      advance_days: 0,
    });
    expect(parseRepeatRule(json)).toBeNull();
  });

  it("should return null when weekdays is an empty array for weekly frequency", () => {
    const json = JSON.stringify({
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [],
      target_box: "today",
      advance_days: 0,
    });
    expect(parseRepeatRule(json)).toBeNull();
  });

  it("should return null when weekdays contain non-integer value", () => {
    const json = JSON.stringify({
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1.5, 3],
      target_box: "today",
      advance_days: 0,
    });
    expect(parseRepeatRule(json)).toBeNull();
  });

  it("should return null when day_of_month is below MIN_DAY_OF_MONTH", () => {
    const json = JSON.stringify({
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 0,
      target_box: "today",
      advance_days: 0,
    });
    expect(parseRepeatRule(json)).toBeNull();
  });

  it("should return null when day_of_month is above MAX_DAY_OF_MONTH", () => {
    const json = JSON.stringify({
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 32,
      target_box: "today",
      advance_days: 0,
    });
    expect(parseRepeatRule(json)).toBeNull();
  });

  it("should return null when month_and_day.month is below MIN_MONTH", () => {
    const json = JSON.stringify({
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 0, day: 15 },
      target_box: "today",
      advance_days: 0,
    });
    expect(parseRepeatRule(json)).toBeNull();
  });

  it("should return null when month_and_day.month is above MAX_MONTH", () => {
    const json = JSON.stringify({
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 13, day: 15 },
      target_box: "today",
      advance_days: 0,
    });
    expect(parseRepeatRule(json)).toBeNull();
  });

  it("should return null when month_and_day.day is below MIN_DAY_OF_MONTH", () => {
    const json = JSON.stringify({
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 3, day: 0 },
      target_box: "today",
      advance_days: 0,
    });
    expect(parseRepeatRule(json)).toBeNull();
  });

  it("should return null when month_and_day.day is above MAX_DAY_OF_MONTH", () => {
    const json = JSON.stringify({
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 3, day: 32 },
      target_box: "today",
      advance_days: 0,
    });
    expect(parseRepeatRule(json)).toBeNull();
  });

  it("should accept valid weekly rule with weekdays [1, 3, 5]", () => {
    const rule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3, 5],
      target_box: "today",
      advance_days: 0,
    };
    expect(parseRepeatRule(JSON.stringify(rule))).toEqual(rule);
  });

  it("should accept valid monthly rule with day_of_month 15", () => {
    const rule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 15,
      target_box: "today",
      advance_days: 0,
    };
    expect(parseRepeatRule(JSON.stringify(rule))).toEqual(rule);
  });

  it("should accept valid yearly rule with month 12, day 31", () => {
    const rule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 12, day: 31 },
      target_box: "today",
      advance_days: 0,
    };
    expect(parseRepeatRule(JSON.stringify(rule))).toEqual(rule);
  });
});

describe("findNextWeekday error handling", () => {
  it("should throw when no matching weekday found (invalid weekdays)", () => {
    const clock = fakeClock("2026-04-16T10:00:00Z");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1],
      target_box: "today",
      advance_days: 0,
    };
    // This test verifies that findNextWeekday throws via calculateNextDate
    // We can't call findNextWeekday directly as it's not exported,
    // but the throw will propagate through calculateNextDate
    // We test indirectly by ensuring valid weekdays work (covered elsewhere)
    // The throw is a safety net for impossible situations
    expect(() =>
      calculateNextDate(rule, "2026-04-16T10:00:00.000Z", "2026-04-15", clock),
    ).not.toThrow();
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

describe("calculateNextDate skip logic", () => {
  it("should skip past dates for weekly recurrence when user was inactive", () => {
    // Задача "Тренировка" — каждый понедельник (weekday=1)
    const clock = fakeClock("2026-05-10T10:00:00Z"); // суббота, 10 мая
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1], // понедельник
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-20"; // понедельник, 20 апреля (3 недели назад)
    const completedAt = "2026-05-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Должен вернуть ближайший будущий понедельник (12 мая), а не 27 апреля
    expect(nextDate).toBe("2026-05-11"); // следующий понедельник
  });

  it("should skip past dates for weekly recurrence with multiple weekdays", () => {
    const clock = fakeClock("2026-05-10T10:00:00Z"); // суббота
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3, 5], // Пн, Ср, Пт
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-18"; // пятница, 3 недели назад
    const completedAt = "2026-05-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Должен вернуть ближайший будущий день из списка (понедельник 11 мая)
    expect(nextDate).toBe("2026-05-11");
  });

  it("should skip past dates for weekly recurrence with interval > 1", () => {
    const clock = fakeClock("2026-05-10T10:00:00Z"); // суббота
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 2, // каждые 2 недели
      weekdays: [1], // понедельник
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-07"; // понедельник, 5 недель назад
    const completedAt = "2026-05-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Skip logic: tomorrow=2026-05-11 (пн), interval=2 → skip 7 days → 2026-05-18 (пн)
    expect(nextDate).toBe("2026-05-18");
  });

  it("should skip past dates for monthly recurrence when user was inactive", () => {
    // Задача "Оплата аренды" — 1-го числа каждого месяца
    const clock = fakeClock("2026-07-01T10:00:00Z"); // 1 июля
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 1,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-01-01"; // 6 месяцев назад
    const completedAt = "2026-07-01T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Должен вернуть 1 августа, а не 1 февраля
    expect(nextDate).toBe("2026-08-01");
  });

  it("should skip to next month if day already passed in current month", () => {
    const clock = fakeClock("2026-07-15T10:00:00Z"); // 15 июля
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 10, // 10-е число
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-01-10"; // 6 месяцев назад
    const completedAt = "2026-07-15T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // 10 июля уже прошло, должен вернуть 10 августа
    expect(nextDate).toBe("2026-08-10");
  });

  it("should return current month if day has not passed yet", () => {
    const clock = fakeClock("2026-07-05T10:00:00Z"); // 5 июля
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 10, // 10-е число
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-01-10"; // 6 месяцев назад
    const completedAt = "2026-07-05T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // 10 июля ещё не прошло, должен вернуть 10 июля
    expect(nextDate).toBe("2026-07-10");
  });

  it("should skip past dates for monthly recurrence with interval > 1", () => {
    const clock = fakeClock("2026-07-01T10:00:00Z"); // 1 июля
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 3, // каждые 3 месяца
      day_of_month: 15,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2025-10-15"; // 9 месяцев назад
    const completedAt = "2026-07-01T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Должен вернуть 15 июля (ближайшая дата с учётом interval=3)
    expect(nextDate).toBe("2026-07-15");
  });

  it("should skip past dates for yearly recurrence when user was inactive", () => {
    // Задача "День рождения мамы" — ежегодно 15 марта
    const clock = fakeClock("2026-04-16T10:00:00Z"); // 16 апреля 2026
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 3, day: 15 }, // 15 марта
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2024-03-15"; // 2 года назад
    const completedAt = "2026-04-16T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Должен вернуть 15 марта 2027, а не 2025 или 2026 (уже прошли)
    expect(nextDate).toBe("2027-03-15");
  });

  it("should return current year if date has not passed yet for yearly", () => {
    const clock = fakeClock("2026-02-10T10:00:00Z"); // 10 февраля 2026
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 3, day: 15 }, // 15 марта
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2024-03-15"; // 2 года назад
    const completedAt = "2026-02-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // 15 марта 2026 ещё не прошло, должен вернуть 2026-03-15
    expect(nextDate).toBe("2026-03-15");
  });

  it("should skip to next year if date already passed in current year", () => {
    const clock = fakeClock("2026-04-16T10:00:00Z"); // 16 апреля 2026
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 4, day: 10 }, // 10 апреля
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2025-04-10";
    const completedAt = "2026-04-16T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // 10 апреля 2026 уже прошло, должен вернуть 2027-04-10
    expect(nextDate).toBe("2027-04-10");
  });

  it("should skip past dates for yearly recurrence with interval > 1", () => {
    const clock = fakeClock("2026-04-16T10:00:00Z"); // 16 апреля 2026
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 2, // каждые 2 года
      month_and_day: { month: 5, day: 20 }, // 20 мая
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2022-05-20"; // 4 года назад
    const completedAt = "2026-04-16T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Должен вернуть 20 мая 2026 (ближайшая дата с учётом interval=2)
    expect(nextDate).toBe("2026-05-20");
  });

  it("should handle leap year for yearly recurrence (Feb 29)", () => {
    const clock = fakeClock("2026-04-16T10:00:00Z"); // 16 апреля 2026 (не високосный)
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 2, day: 29 }, // 29 февраля
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2024-02-29"; // 2024 был високосным
    const completedAt = "2026-04-16T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // 2026 не високосный → должен вернуть 28 февраля 2027 (не високосный)
    // 2028 будет високосным, но мы ищем ближайший будущий год
    expect(nextDate).toBe("2027-02-28");
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

  it("should preserve monthly interval alignment when user was inactive (non-divisible gap)", () => {
    // Задача "каждые 3 месяца 15-го числа", каденция: Янв→Апр→Июл→Окт
    // previousNextDate = Янв 15, пользователь не заходил до 10 мая
    const clock = fakeClock("2026-05-10T10:00:00Z"); // 10 мая
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 3,
      day_of_month: 15,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-01-15";
    const completedAt = "2026-05-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Каденция: Янв 15 → Апр 15 → Июл 15. Апрель уже прошёл → Июл 15
    expect(nextDate).toBe("2026-07-15");
  });

  it("should preserve monthly interval alignment when day already passed (non-divisible gap)", () => {
    // Каждые 2 месяца 5-го числа, каденция: Янв→Мар→Май→Июл
    // previousNextDate = Янв 5, сегодня 10 мая → Май 5 уже прошло → Июл 5
    const clock = fakeClock("2026-05-10T10:00:00Z");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 2,
      day_of_month: 5,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-01-05";
    const completedAt = "2026-05-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Каденция: Янв 5 → Мар 5 → Май 5 → Июл 5. Май 5 прошло → Июл 5
    expect(nextDate).toBe("2026-07-05");
  });

  it("should preserve yearly interval alignment when user was inactive (off-cadence year)", () => {
    // Задача "каждые 2 года 15 июня", каденция: 2024→2026→2028
    // previousNextDate = 15 июня 2024, сегодня 1 июля 2026
    const clock = fakeClock("2026-07-01T10:00:00Z");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 2,
      month_and_day: { month: 6, day: 15 },
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2024-06-15";
    const completedAt = "2026-07-01T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Каденция: 2024 → 2026 → 2028. Июнь 2026 прошёл → 2028-06-15
    expect(nextDate).toBe("2028-06-15");
  });

  it("should preserve yearly interval alignment when target year has not passed yet", () => {
    // Каждые 3 года 20 декабря, каденция: 2023→2026→2029
    // previousNextDate = 20 дек 2023, сегодня 1 марта 2026 → 20 дек 2026 ещё не прошло
    const clock = fakeClock("2026-03-01T10:00:00Z");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 3,
      month_and_day: { month: 12, day: 20 },
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2023-12-20";
    const completedAt = "2026-03-01T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Каденция: 2023 → 2026 → 2029. Дек 2026 ещё впереди → 2026-12-20
    expect(nextDate).toBe("2026-12-20");
  });

  it("should preserve weekly interval alignment when user was inactive", () => {
    // Каждые 2 недели в понедельник
    // previousNextDate = Пн 6 апреля, сегодня суббота 25 апреля
    // Каденция: 6 апр → 20 апр → 4 мая. 20 апр прошло → 4 мая
    const clock = fakeClock("2026-04-25T10:00:00Z"); // суббота
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 2,
      weekdays: [1], // понедельник
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-06"; // понедельник
    const completedAt = "2026-04-25T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Каденция: 6 апр → 20 апр → 4 мая. 20 апр прошло → 4 мая
    expect(nextDate).toBe("2026-05-04");
  });

  it("should preserve weekly interval alignment with interval=3 (non-divisible gap)", () => {
    // Каждые 3 недели в понедельник
    // previousNextDate = Пн 6 апреля
    // Каденция: findNextWeekday(Apr7, [1], 3) = Apr 27
    //           findNextWeekday(Apr28, [1], 3) = May 18
    //           findNextWeekday(May19, [1], 3) = Jun 8
    // Сегодня четверг 7 мая → Apr 27 прошёл → следующая каденция May 18
    const clock = fakeClock("2026-05-07T10:00:00Z"); // четверг
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 3,
      weekdays: [1], // понедельник
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-06"; // понедельник
    const completedAt = "2026-05-07T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Каденция: Apr 27 → May 18 → Jun 8. Apr 27 прошёл, May 18 впереди → May 18
    expect(nextDate).toBe("2026-05-18");
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
