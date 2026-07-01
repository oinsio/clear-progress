// implements FR1, FR5 of unify-next-date-calculation

import type { RepeatRule } from "@clear-progress/contract";
import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import { resolveNextFixedDate } from "./repeatRule";

describe("resolveNextFixedDate — nearest-match mode", () => {
  describe("weekly with interval > 1", () => {
    // FR5: first creation of weekly with interval > 1 should find nearest matching day
    it("should return nearest Monday for biweekly-on-Monday rule created on Saturday", () => {
      const clock = fakeClock("2026-06-27T10:00:00Z"); // Saturday
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "weekly",
        interval: 2,
        weekdays: [1], // Monday
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-06-27"; // Saturday

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      // Nearest Monday after Saturday, June 27 is Monday, June 29
      expect(nextDate).toBe("2026-06-29");
    });

    it("should return nearest weekday for triweekly rule with multiple weekdays", () => {
      const clock = fakeClock("2026-06-25T10:00:00Z"); // Thursday
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "weekly",
        interval: 3,
        weekdays: [1, 3, 5], // Mon, Wed, Fri
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-06-25"; // Thursday

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      // Tomorrow is Friday (day 5), which is in the weekdays list
      expect(nextDate).toBe("2026-06-26");
    });

    it("should wrap to next week when no remaining weekdays in current week", () => {
      const clock = fakeClock("2026-06-27T10:00:00Z"); // Saturday
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "weekly",
        interval: 4,
        weekdays: [1, 3], // Mon, Wed
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-06-27"; // Saturday

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      // Saturday has no remaining Mon/Wed this week → next week Monday, June 29
      // nearest-match uses interval=1, so next Monday (not 4 weeks out)
      expect(nextDate).toBe("2026-06-29");
    });
  });

  describe("monthly", () => {
    it("should return this month's date when day_of_month is still in the future", () => {
      const clock = fakeClock("2026-06-10T10:00:00Z");
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "monthly",
        interval: 1,
        day_of_month: 20,
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-06-10";

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      expect(nextDate).toBe("2026-06-20");
    });

    it("should return next month's date when day_of_month has already passed", () => {
      const clock = fakeClock("2026-06-25T10:00:00Z");
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "monthly",
        interval: 1,
        day_of_month: 15,
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-06-25";

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      expect(nextDate).toBe("2026-07-15");
    });

    it("should return next month's date when day_of_month equals today", () => {
      const clock = fakeClock("2026-06-15T10:00:00Z");
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "monthly",
        interval: 1,
        day_of_month: 15,
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-06-15";

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      // nearest-match finds strictly after today, so next month
      expect(nextDate).toBe("2026-07-15");
    });

    it("should clamp day_of_month to last day of month for short months", () => {
      const clock = fakeClock("2026-01-31T10:00:00Z");
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "monthly",
        interval: 1,
        day_of_month: 31,
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-01-31";

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      // February 2026 has 28 days, so day_of_month=31 clamps to 28
      expect(nextDate).toBe("2026-02-28");
    });
  });

  describe("yearly", () => {
    it("should return this year's date when month_and_day is still in the future", () => {
      const clock = fakeClock("2026-03-10T10:00:00Z");
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "yearly",
        interval: 1,
        month_and_day: { month: 7, day: 4 }, // July 4
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-03-10";

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      expect(nextDate).toBe("2026-07-04");
    });

    it("should return next year's date when month_and_day has already passed", () => {
      const clock = fakeClock("2026-09-15T10:00:00Z");
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "yearly",
        interval: 1,
        month_and_day: { month: 3, day: 20 }, // March 20
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-09-15";

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      expect(nextDate).toBe("2027-03-20");
    });

    it("should return next year's date when month_and_day equals today", () => {
      const clock = fakeClock("2026-07-04T10:00:00Z");
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "yearly",
        interval: 1,
        month_and_day: { month: 7, day: 4 },
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-07-04";

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      // nearest-match finds strictly after today, so next year
      expect(nextDate).toBe("2027-07-04");
    });

    it("should clamp day to last day of month for Feb 29 in non-leap year", () => {
      const clock = fakeClock("2026-06-01T10:00:00Z"); // 2026 is not a leap year
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "yearly",
        interval: 1,
        month_and_day: { month: 2, day: 29 },
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-06-01";

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      // 2027 is also not a leap year → Feb has 28 days → clamp to 28
      expect(nextDate).toBe("2027-02-28");
    });
  });

  describe("daily", () => {
    it("should return today plus interval for daily nearest-match", () => {
      const clock = fakeClock("2026-06-15T10:00:00Z");
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "daily",
        interval: 1,
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-06-15";

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      expect(nextDate).toBe("2026-06-16");
    });

    it("should return today plus interval for daily nearest-match with interval 3", () => {
      const clock = fakeClock("2026-06-15T10:00:00Z");
      const rule: RepeatRule = {
        type: "fixed",
        frequency: "daily",
        interval: 3,
        target_box: "today",
        advance_days: 0,
      };
      const anchor = "2026-06-15";

      const nextDate = resolveNextFixedDate(
        rule,
        anchor,
        "nearest-match",
        clock,
      );

      expect(nextDate).toBe("2026-06-18");
    });
  });
});
