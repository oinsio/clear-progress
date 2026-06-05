import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import type { RepeatRule } from "@/types/common";
import { calculateNextDate } from "./repeatRule";

describe("calculateNextDate with timezone changes", () => {
  it("should calculate daily task next_date in new timezone", () => {
    // Create a task in UTC+5 (Asia/Almaty)
    const clockAlmaty = fakeClock("2026-04-16T03:00:00Z", "Asia/Almaty");
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "daily",
      interval: 1,
      target_box: "today",
      advance_days: 0,
    };
    const completedAt = "2026-04-16T03:00:00.000Z"; // 08:00 in Almaty time
    const previousNextDate = "2026-04-16";

    const nextDateAlmaty = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clockAlmaty,
    );
    expect(nextDateAlmaty).toBe("2026-04-17"); // tomorrow in Almaty time

    // User moved to UTC-5 (America/New_York)
    const clockNY = fakeClock("2026-04-17T14:00:00Z", "America/New_York");
    const nextDateNY = calculateNextDate(
      rule,
      "2026-04-17T14:00:00.000Z",
      nextDateAlmaty,
      clockNY,
    );
    expect(nextDateNY).toBe("2026-04-18"); // tomorrow in New York time
  });

  it("should calculate weekly task next_date in new timezone", () => {
    // Weekly task: every Monday and Wednesday
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 1,
      weekdays: [1, 3], // Mon, Wed
      target_box: "today",
      advance_days: 0,
    };

    // Completed on Tuesday, April 14 in UTC
    const clockUTC = fakeClock("2026-04-14T10:00:00Z", "UTC");
    const completedAt = "2026-04-14T10:00:00.000Z";
    const previousNextDate = "2026-04-14";

    const nextDateUTC = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clockUTC,
    );
    expect(nextDateUTC).toBe("2026-04-15"); // Wednesday

    // Moved to UTC+10 (Australia/Sydney)
    const clockSydney = fakeClock("2026-04-15T20:00:00Z", "Australia/Sydney");
    const nextDateSydney = calculateNextDate(
      rule,
      "2026-04-15T20:00:00.000Z",
      nextDateUTC,
      clockSydney,
    );
    expect(nextDateSydney).toBe("2026-04-20"); // next Monday
  });

  it("should calculate after_completion task in new timezone", () => {
    const rule: RepeatRule = {
      type: "after_completion",
      delay_days: 7,
      target_box: "week",
      advance_days: 0,
    };

    // Completed in UTC+0 (Europe/London)
    const completedAt = "2026-04-10T14:00:00.000Z"; // 14:00 London time = 2026-04-10
    const clockLondon = fakeClock("2026-04-10T14:00:00Z", "Europe/London");
    const nextDateLondon = calculateNextDate(
      rule,
      completedAt,
      undefined,
      clockLondon,
    );
    expect(nextDateLondon).toBe("2026-04-17"); // +7 days from 2026-04-10

    // Moved to UTC+10 (Australia/Sydney)
    // Same completedAt in Sydney = 2026-04-11 00:00 (next day due to UTC+10)
    const clockSydney = fakeClock("2026-04-11T00:00:00Z", "Australia/Sydney");
    const nextDateSydney = calculateNextDate(
      rule,
      completedAt,
      undefined,
      clockSydney,
    );
    expect(nextDateSydney).toBe("2026-04-18"); // +7 days from 2026-04-11 (date in Sydney TZ)
  });

  it("should preserve monthly interval alignment when user was inactive (non-divisible gap)", () => {
    // Task "every 3 months on the 15th", cadence: Jan→Apr→Jul→Oct
    // previousNextDate = Jan 15, user was inactive until May 10
    const clock = fakeClock("2026-05-10T10:00:00Z"); // May 10
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

    // Cadence: Jan 15 → Apr 15 → Jul 15. April already passed → Jul 15
    expect(nextDate).toBe("2026-07-15");
  });

  it("should preserve monthly interval alignment when day already passed (non-divisible gap)", () => {
    // Every 2 months on the 5th, cadence: Jan→Mar→May→Jul
    // previousNextDate = Jan 5, today is May 10 → May 5 already passed → Jul 5
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

    // Cadence: Jan 5 → Mar 5 → May 5 → Jul 5. May 5 passed → Jul 5
    expect(nextDate).toBe("2026-07-05");
  });

  it("should preserve yearly interval alignment when user was inactive (off-cadence year)", () => {
    // Task "every 2 years on June 15", cadence: 2024→2026→2028
    // previousNextDate = June 15, 2024, today is July 1, 2026
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

    // Cadence: 2024 → 2026 → 2028. June 2026 passed → 2028-06-15
    expect(nextDate).toBe("2028-06-15");
  });

  it("should preserve yearly interval alignment when target year has not passed yet", () => {
    // Every 3 years on December 20, cadence: 2023→2026→2029
    // previousNextDate = Dec 20, 2023, today is March 1, 2026 → Dec 20, 2026 has not passed yet
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

    // Cadence: 2023 → 2026 → 2029. Dec 2026 is still ahead → 2026-12-20
    expect(nextDate).toBe("2026-12-20");
  });

  it("should preserve weekly interval alignment when user was inactive", () => {
    // Every 2 weeks on Monday
    // previousNextDate = Mon April 6, today is Saturday April 25
    // Cadence: Apr 6 → Apr 20 → May 4. Apr 20 passed → May 4
    const clock = fakeClock("2026-04-25T10:00:00Z"); // Saturday
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 2,
      weekdays: [1], // Monday
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-06"; // Monday
    const completedAt = "2026-04-25T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Cadence: Apr 6 → Apr 20 → May 4. Apr 20 passed → May 4
    expect(nextDate).toBe("2026-05-04");
  });

  it("should preserve weekly interval alignment with interval=3 (non-divisible gap)", () => {
    // Every 3 weeks on Monday
    // previousNextDate = Mon April 6
    // Cadence: findNextWeekday(Apr7, [1], 3) = Apr 27
    //           findNextWeekday(Apr28, [1], 3) = May 18
    //           findNextWeekday(May19, [1], 3) = Jun 8
    // Today is Thursday, May 7 → Apr 27 passed → next cadence May 18
    const clock = fakeClock("2026-05-07T10:00:00Z"); // Thursday
    const rule: RepeatRule = {
      type: "fixed",
      frequency: "weekly",
      interval: 3,
      weekdays: [1], // Monday
      target_box: "today",
      advance_days: 0,
    };
    const previousNextDate = "2026-04-06"; // Monday
    const completedAt = "2026-05-07T10:00:00.000Z";

    const nextDate = calculateNextDate(
      rule,
      completedAt,
      previousNextDate,
      clock,
    );

    // Cadence: Apr 27 → May 18 → Jun 8. Apr 27 passed, May 18 is ahead → May 18
    expect(nextDate).toBe("2026-05-18");
  });

  it("should handle timezone change across midnight boundary", () => {
    // Completed the task at 23:50 Tokyo time (UTC+9)
    const completedAt = "2026-04-10T14:50:00.000Z"; // 23:50 Tokyo time = 2026-04-10
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
    expect(nextDateTokyo).toBe("2026-04-13"); // +3 days from 2026-04-10

    // Moved to UTC+0 (Europe/London)
    // Same completedAt in London = 2026-04-10 14:50 (same day)
    const clockLondon = fakeClock("2026-04-10T14:50:00Z", "Europe/London");
    const nextDateLondon = calculateNextDate(
      rule,
      completedAt,
      undefined,
      clockLondon,
    );
    expect(nextDateLondon).toBe("2026-04-13"); // +3 days from 2026-04-10
  });
});
