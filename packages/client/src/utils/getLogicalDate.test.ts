import { describe, expect, it, vi } from "vitest";
import { DEFAULT_DAY_BOUNDARY } from "@/constants";
import { fakeClock, Temporal } from "@/lib/temporal";
import { getLogicalDate, isValidDayBoundary } from "./getLogicalDate";

// implements FR3 of day-boundary
describe("getLogicalDate", () => {
  describe("midnight boundary (fast path)", () => {
    it.each([
      { time: "2026-06-05T00:00:00Z", expected: "2026-06-05" },
      { time: "2026-06-05T12:00:00Z", expected: "2026-06-05" },
      { time: "2026-06-05T23:59:59Z", expected: "2026-06-05" },
    ])('should return calendar date $expected when boundary is "00:00" at $time', ({
      time,
      expected,
    }) => {
      const clock = fakeClock(time);

      const logicalDate = getLogicalDate(clock, DEFAULT_DAY_BOUNDARY);

      expect(logicalDate).toBe(expected);
    });
  });

  describe("before boundary returns previous day", () => {
    it('should return previous day when current time 01:30 is before boundary "02:00"', () => {
      const clock = fakeClock("2026-06-05T01:30:00Z");

      const logicalDate = getLogicalDate(clock, "02:00");

      expect(logicalDate).toBe("2026-06-04");
    });
  });

  describe("at boundary returns current day", () => {
    it('should return current day when current time exactly equals boundary "02:00"', () => {
      const clock = fakeClock("2026-06-05T02:00:00Z");

      const logicalDate = getLogicalDate(clock, "02:00");

      expect(logicalDate).toBe("2026-06-05");
    });
  });

  describe("after boundary returns current day", () => {
    it('should return current day when current time 14:00 is after boundary "02:00"', () => {
      const clock = fakeClock("2026-06-05T14:00:00Z");

      const logicalDate = getLogicalDate(clock, "02:00");

      expect(logicalDate).toBe("2026-06-05");
    });
  });

  describe("large boundary value", () => {
    it('should return previous day when current time 05:59 is before boundary "06:00"', () => {
      const clock = fakeClock("2026-06-05T05:59:00Z");

      const logicalDate = getLogicalDate(clock, "06:00");

      expect(logicalDate).toBe("2026-06-04");
    });
  });

  describe("respects timezone", () => {
    it("should compute logical date in the clock timezone (Asia/Tokyo)", () => {
      // 01:00 JST on June 5 = 16:00 UTC on June 4
      const clock = fakeClock("2026-06-04T16:00:00Z", "Asia/Tokyo");

      const logicalDate = getLogicalDate(clock, "02:00");

      // In Tokyo, it's 01:00 June 5, which is before 02:00 boundary → logical date is June 4
      expect(logicalDate).toBe("2026-06-04");
    });
  });

  describe("fast path skips PlainTime parsing", () => {
    it("should not call Temporal.PlainTime.from when boundary is DEFAULT_DAY_BOUNDARY", () => {
      const clock = fakeClock("2026-06-05T12:00:00Z");
      const plainTimeFromSpy = vi.spyOn(Temporal.PlainTime, "from");

      getLogicalDate(clock, DEFAULT_DAY_BOUNDARY);

      expect(plainTimeFromSpy).not.toHaveBeenCalled();
      plainTimeFromSpy.mockRestore();
    });
  });

  // Verifies NFR-P1 of day-boundary
  describe("performance", () => {
    it("should complete in less than 1ms", () => {
      const clock = fakeClock("2026-06-05T01:30:00Z");

      const startTime = performance.now();
      getLogicalDate(clock, "02:00");
      const elapsedMs = performance.now() - startTime;

      expect(elapsedMs).toBeLessThan(1);
    });
  });
});

// implements FR11 of day-boundary
describe("isValidDayBoundary", () => {
  it.each([
    { value: "00:00", expected: true },
    { value: "02:30", expected: true },
    { value: "23:59", expected: true },
    { value: "12:00", expected: true },
  ])("should accept valid boundary $value", ({ value, expected }) => {
    expect(isValidDayBoundary(value)).toBe(expected);
  });

  it.each([
    { value: "24:00", reason: "hours out of range" },
    { value: "abc", reason: "not a time format" },
    { value: "", reason: "empty string" },
    { value: "2:00", reason: "missing leading zero" },
    { value: "-1:00", reason: "negative hours" },
    { value: "12:60", reason: "minutes out of range" },
    { value: "xx12:00", reason: "valid pattern not at start" },
    { value: "12:00xx", reason: "valid pattern not at end" },
    { value: "prefix02:30suffix", reason: "valid pattern embedded in string" },
  ])("should reject invalid boundary $value ($reason)", ({ value }) => {
    expect(isValidDayBoundary(value)).toBe(false);
  });
});
