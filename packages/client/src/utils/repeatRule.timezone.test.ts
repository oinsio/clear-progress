import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "./repeatRule";

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
