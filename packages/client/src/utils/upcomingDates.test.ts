// implements FR8, FR9 of show-upcoming-recurrences

import type { RepeatRule } from "@clear-progress/contract";
import { describe, expect, it } from "vitest";

import { fakeClock } from "@/lib/temporal";

import { calculateUpcomingDates, UPCOMING_DATES_COUNT } from "./upcomingDates";

const CLOCK_TIMESTAMP = "2026-07-01T00:00:00Z";
const clock = fakeClock(CLOCK_TIMESTAMP);

describe("calculateUpcomingDates", () => {
  describe("weekly with interval > 1 and multiple weekdays (FR8)", () => {
    it("should generate correct dates for biweekly rule with Monday and Wednesday", () => {
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "weekly",
        interval: 2,
        weekdays: [1, 3],
        target_box: "inbox",
        advance_days: 0,
      };

      const startDate = "2026-07-06"; // Monday
      const result = calculateUpcomingDates(
        rule,
        startDate,
        UPCOMING_DATES_COUNT,
        clock,
      );

      expect(result).toEqual([
        "2026-07-06", // Mon (start)
        "2026-07-08", // Wed (same active week)
        "2026-07-20", // Mon (skip 1 week, next active week)
        "2026-07-22", // Wed (same active week)
        "2026-08-03", // Mon (skip 1 week, next active week)
      ]);
    });
  });

  describe("daily with interval (FR8)", () => {
    it("should generate correct dates for every-3-days rule", () => {
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "daily",
        interval: 3,
        target_box: "inbox",
        advance_days: 0,
      };

      const startDate = "2026-07-01";
      const count = 3;
      const result = calculateUpcomingDates(rule, startDate, count, clock);

      expect(result).toEqual(["2026-07-01", "2026-07-04", "2026-07-07"]);
    });
  });

  describe("monthly with clamping (FR8)", () => {
    it("should clamp day 31 to 28 in February and preserve 31 in March", () => {
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "monthly",
        interval: 1,
        day_of_month: 31,
        target_box: "inbox",
        advance_days: 0,
      };

      const startDate = "2026-01-31";
      const januaryClock = fakeClock("2026-01-01T00:00:00Z");
      const count = 3;
      const result = calculateUpcomingDates(
        rule,
        startDate,
        count,
        januaryClock,
      );

      expect(result).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
    });
  });

  describe("after_completion returns empty array (FR9)", () => {
    it("should return empty array for after_completion rules", () => {
      const rule: RepeatRule = {
        type: "after_completion",
        delay_days: 3,
        target_box: "inbox",
        advance_days: 0,
      };

      const startDate = "2026-07-01";
      const result = calculateUpcomingDates(
        rule,
        startDate,
        UPCOMING_DATES_COUNT,
        clock,
      );

      expect(result).toEqual([]);
    });
  });
});
