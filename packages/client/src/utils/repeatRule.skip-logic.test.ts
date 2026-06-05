import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "./repeatRule";

describe("calculateNextDate skip logic", () => {
  it("should skip past dates for weekly recurrence when user was inactive", () => {
    // Task "Workout" — every Monday (weekday=1)
    const clock = fakeClock("2026-05-10T10:00:00Z"); // Sunday, May 10, 2026
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1], // Monday
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-20"; // Monday, April 20 (3 weeks ago)
    const completedAt = "2026-05-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Should return the nearest future Monday (May 12), not April 27
    expect(nextDate).toBe("2026-05-11"); // next Monday
  });

  it("should skip past dates for weekly recurrence with multiple weekdays", () => {
    const clock = fakeClock("2026-05-10T10:00:00Z"); // Saturday
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3, 5], // Mon, Wed, Fri
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-18"; // Friday, 3 weeks ago
    const completedAt = "2026-05-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Should return the nearest future day from the list (Monday, May 11)
    expect(nextDate).toBe("2026-05-11");
  });

  it("should skip past dates for weekly recurrence with interval > 1", () => {
    const clock = fakeClock("2026-05-10T10:00:00Z"); // Saturday
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 2, // every 2 weeks
      weekdays: [1], // Monday
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-07"; // Monday, 5 weeks ago
    const completedAt = "2026-05-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Skip logic: tomorrow=2026-05-11 (Mon), interval=2 → skip 7 days → 2026-05-18 (Mon)
    expect(nextDate).toBe("2026-05-18");
  });

  it("should skip past dates for monthly recurrence when user was inactive", () => {
    // Task "Rent payment" — on the 1st of every month
    const clock = fakeClock("2026-07-01T10:00:00Z"); // July 1
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

    // Should return August 1, not February 1
    expect(nextDate).toBe("2026-08-01");
  });

  it("should skip to next month if day already passed in current month", () => {
    const clock = fakeClock("2026-07-15T10:00:00Z"); // July 15
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 10, // 10th of the month
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-01-10"; // 6 months ago
    const completedAt = "2026-07-15T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // July 10 has already passed, should return August 10
    expect(nextDate).toBe("2026-08-10");
  });

  it("should return current month if day has not passed yet", () => {
    const clock = fakeClock("2026-07-05T10:00:00Z"); // July 5
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 10, // 10th of the month
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-01-10"; // 6 months ago
    const completedAt = "2026-07-05T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // July 10 has not passed yet, should return July 10
    expect(nextDate).toBe("2026-07-10");
  });

  it("should skip past dates for monthly recurrence with interval > 1", () => {
    const clock = fakeClock("2026-07-01T10:00:00Z"); // July 1
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 3, // every 3 months
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

    // Should return July 15 (nearest date respecting interval=3)
    expect(nextDate).toBe("2026-07-15");
  });

  it("should skip past dates for yearly recurrence when user was inactive", () => {
    // Task "Mom's birthday" — annually on March 15
    const clock = fakeClock("2026-04-16T10:00:00Z"); // April 16, 2026
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 3, day: 15 }, // March 15
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2024-03-15"; // 2 years ago
    const completedAt = "2026-04-16T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Should return March 15, 2027, not 2025 or 2026 (already passed)
    expect(nextDate).toBe("2027-03-15");
  });

  it("should return current year if date has not passed yet for yearly", () => {
    const clock = fakeClock("2026-02-10T10:00:00Z"); // February 10, 2026
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 3, day: 15 }, // March 15
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2024-03-15"; // 2 years ago
    const completedAt = "2026-02-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // March 15, 2026, has not passed yet, should return 2026-03-15
    expect(nextDate).toBe("2026-03-15");
  });

  it("should skip to next year if date already passed in current year", () => {
    const clock = fakeClock("2026-04-16T10:00:00Z"); // April 16, 2026
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 4, day: 10 }, // April 10
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

    // April 10, 2026, has already passed, should return 2027-04-10
    expect(nextDate).toBe("2027-04-10");
  });

  it("should skip past dates for yearly recurrence with interval > 1", () => {
    const clock = fakeClock("2026-04-16T10:00:00Z"); // April 16, 2026
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 2, // every 2 years
      month_and_day: { month: 5, day: 20 }, // May 20
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

    // Should return May 20, 2026 (nearest date respecting interval=2)
    expect(nextDate).toBe("2026-05-20");
  });

  it("should handle leap year for yearly recurrence (Feb 29)", () => {
    const clock = fakeClock("2026-04-16T10:00:00Z"); // April 16, 2026 (non-leap year)
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 2, day: 29 }, // February 29
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2024-02-29"; // 2024 was a leap year
    const completedAt = "2026-04-16T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // 2026 is not a leap year → should return February 28, 2027 (non-leap year)
    // 2028 will be a leap year, but we look for the nearest future year
    expect(nextDate).toBe("2027-02-28");
  });
});
