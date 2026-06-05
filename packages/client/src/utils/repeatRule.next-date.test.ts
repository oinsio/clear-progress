import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateAppearDate, calculateNextDate } from "./repeatRule";

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
    const previousNextDate = "2026-04-15"; // yesterday
    const completedAt = "2026-04-13T10:00:00.000Z";
    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    expect(nextDate).toBe("2026-04-16"); // today
  });

  it("should calculate next date for after_completion rule", () => {
    const clock = fakeClock("2026-04-13T10:00:00.000Z", "UTC");
    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 7,
      target_box: "week",
      advance_days: 0,
    };
    const completedAt = "2026-04-13T10:00:00.000Z";
    const nextDate = calculateNextDate(rule, completedAt, undefined, clock);
    expect(nextDate).toBe("2026-04-20");
  });

  it("should calculate next date for monthly rule without timezone shift", () => {
    const clock = fakeClock("2026-04-15T10:00:00.000Z", "UTC");
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
    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );
    expect(nextDate).toBe("2026-05-07");
  });

  it("should calculate next date for yearly rule without timezone shift", () => {
    // Use relative dates: "today" is April 15, previous was May 7 last year
    const clock = fakeClock("2026-04-15T10:00:00.000Z", "UTC");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 5, day: 7 }, // May 7
      target_box: "today",
      advance_days: 0,
    };
    const completedAt = "2026-04-15T10:00:00.000Z";
    const previousNextDate = "2025-05-07"; // Last year
    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );
    expect(nextDate).toBe("2026-05-07"); // This year (not passed yet)
  });

  it("should calculate next date for after_completion without timezone shift", () => {
    const clock = fakeClock("2026-04-07T10:00:00.000Z", "UTC");
    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 7,
      target_box: "today",
      advance_days: 0,
    };
    const completedAt = "2026-04-07T10:00:00.000Z";
    const nextDate = calculateNextDate(rule, completedAt, undefined, clock);
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
