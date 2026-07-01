import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "./repeatRule";

describe("calculateNextDate skip logic — weekly & daily", () => {
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
    const clock = fakeClock("2026-05-10T10:00:00Z"); // Sunday
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3, 5], // Mon, Wed, Fri
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-18"; // Saturday, 3 weeks ago
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
    const clock = fakeClock("2026-05-10T10:00:00Z"); // Sunday
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 2, // every 2 weeks
      weekdays: [1], // Monday
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-07"; // Tuesday, ~5 weeks ago
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

  it("should skip to correct active week for multi-weekday with interval > 1", () => {
    // implements FR3 of fix-date-and-weekly-bugs
    const clock = fakeClock("2026-06-10T10:00:00Z"); // Wednesday
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 2,
      weekdays: [1, 3], // Mon, Wed
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-06"; // Monday, ~9 weeks ago
    const completedAt = "2026-06-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Active weeks from Apr 6: Apr 6-12, Apr 20-26, May 4-10, May 18-24, Jun 1-7, Jun 15-21
    // Today Jun 10 is in skip week Jun 8-14 → next active week starts Jun 15
    // First matching weekday >= today in active week: Mon Jun 15
    expect(nextDate).toBe("2026-06-15");
  });

  it("should correctly sort unsorted weekdays during skip logic", () => {
    // Mutant killer: verifies sort comparator (a - b) not (a + b)
    const clock = fakeClock("2026-06-10T10:00:00Z"); // Wednesday
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 2,
      weekdays: [5, 1, 3], // Unsorted: Fri, Mon, Wed
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-06"; // Monday, ~9 weeks ago
    const completedAt = "2026-06-10T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Active weeks from Apr 6: ..., Jun 15-21
    // Sorted weekdays [1,3,5] → first >= today in active week: Mon Jun 15
    expect(nextDate).toBe("2026-06-15");
  });

  // implements FR1, FR5 of fix-recurring-skip-logic
  it("should skip past dates for daily recurrence with interval=1 when user was inactive", () => {
    const clock = fakeClock("2026-04-16T10:00:00Z"); // April 16
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-10"; // 6 days ago
    const completedAt = "2026-04-16T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Today is April 16, should return tomorrow April 17
    expect(nextDate).toBe("2026-04-17");
  });

  // implements FR1, FR5 of fix-recurring-skip-logic
  it("should skip past dates for daily recurrence with interval=3 when user was inactive", () => {
    const clock = fakeClock("2026-04-20T10:00:00Z"); // April 20
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 3,
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-10"; // 10 days ago
    const completedAt = "2026-04-20T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // From Apr 10 with interval=3: Apr 13, 16, 19, 22 → 22 > today
    expect(nextDate).toBe("2026-04-22");
  });
});
