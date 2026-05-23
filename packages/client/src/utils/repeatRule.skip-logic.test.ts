import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "./repeatRule";

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
