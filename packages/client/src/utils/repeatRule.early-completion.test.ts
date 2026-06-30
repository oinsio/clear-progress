// implements FR12, FR13, FR14 of add-recurring-edge-case-tests — early completion
// implements FR15, FR16 of add-recurring-edge-case-tests — monthly clamping chains

import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "./repeatRule";

describe("calculateNextDate early completion", () => {
  // implements FR2, FR5 of fix-recurring-skip-logic
  it("should handle early completion for daily recurrence", () => {
    const clock = fakeClock("2026-07-03T10:00:00Z"); // July 3
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-07-05"; // scheduled for July 5, completed early
    const completedAt = "2026-07-03T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Early completion: prev is in the future, next should be today+1 = July 4
    expect(nextDate).toBe("2026-07-04");
  });

  // @add-recurring-edge-case-tests @FR12
  it("should handle early completion for weekly recurrence", () => {
    const clock = fakeClock("2026-07-04T10:00:00Z"); // Saturday, July 4
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1], // Monday
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-07-06"; // Monday, July 6, completed early on Saturday
    const completedAt = "2026-07-04T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Early completion: should keep the same scheduled date (Monday, July 6)
    expect(nextDate).toBe("2026-07-06");
  });

  // @add-recurring-edge-case-tests @FR13
  it("should handle early completion for monthly recurrence", () => {
    const clock = fakeClock("2026-07-12T10:00:00Z"); // July 12
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 15,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-07-15"; // July 15, completed early on July 12
    const completedAt = "2026-07-12T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Early completion: should keep the same scheduled date (July 15)
    expect(nextDate).toBe("2026-07-15");
  });

  // @add-recurring-edge-case-tests @FR14
  it("should handle early completion for yearly recurrence", () => {
    const clock = fakeClock("2026-12-20T10:00:00Z"); // December 20
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "yearly",
      interval: 1,
      month_and_day: { month: 12, day: 25 },
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-12-25"; // December 25, completed early on December 20
    const completedAt = "2026-12-20T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Early completion: should keep the same scheduled date (December 25)
    expect(nextDate).toBe("2026-12-25");
  });
});

describe("calculateNextDate monthly clamping chains", () => {
  // @add-recurring-edge-case-tests @FR15
  it("should recover from clamped Feb 28 to full Mar 31 when day=31", () => {
    const clock = fakeClock("2026-02-28T10:00:00Z"); // February 28
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 31,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-02-28"; // clamped from 31
    const completedAt = "2026-02-28T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // March has 31 days, so should recover to full day=31
    expect(nextDate).toBe("2026-03-31");
  });

  // @add-recurring-edge-case-tests @FR16
  it("should clamp day=30 to Feb 28 when moving from January", () => {
    const clock = fakeClock("2026-01-30T10:00:00Z"); // January 30
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 30,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-01-30";
    const completedAt = "2026-01-30T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // February has 28 days in 2026, so day=30 clamps to 28
    expect(nextDate).toBe("2026-02-28");
  });

  // @add-recurring-edge-case-tests @FR16
  it("should recover from clamped Feb 28 to full Mar 30 when day=30", () => {
    const clock = fakeClock("2026-02-28T10:00:00Z"); // February 28
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "monthly",
      interval: 1,
      day_of_month: 30,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-02-28"; // clamped from 30
    const completedAt = "2026-02-28T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // March has 31 days, so day=30 should recover to full 30
    expect(nextDate).toBe("2026-03-30");
  });
});
