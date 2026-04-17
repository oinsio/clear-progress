import { describe, it, expect } from "vitest";
import {
  getDaysInMonth,
  getCurrentDateDefaults,
  toISOTimestamp,
  toISODate,
  sanitizeDateOnly,
} from "./dateHelpers";
import { Temporal, fakeClock } from "@/lib/temporal";

describe("getDaysInMonth", () => {
  it("should return 31 for January", () => {
    expect(getDaysInMonth(1)).toBe(31);
  });

  it("should return 29 for February", () => {
    expect(getDaysInMonth(2)).toBe(29);
  });

  it("should return 31 for March", () => {
    expect(getDaysInMonth(3)).toBe(31);
  });

  it("should return 30 for April", () => {
    expect(getDaysInMonth(4)).toBe(30);
  });

  it("should return 31 for May", () => {
    expect(getDaysInMonth(5)).toBe(31);
  });

  it("should return 30 for June", () => {
    expect(getDaysInMonth(6)).toBe(30);
  });

  it("should return 31 for July", () => {
    expect(getDaysInMonth(7)).toBe(31);
  });

  it("should return 31 for August", () => {
    expect(getDaysInMonth(8)).toBe(31);
  });

  it("should return 30 for September", () => {
    expect(getDaysInMonth(9)).toBe(30);
  });

  it("should return 31 for October", () => {
    expect(getDaysInMonth(10)).toBe(31);
  });

  it("should return 30 for November", () => {
    expect(getDaysInMonth(11)).toBe(30);
  });

  it("should return 31 for December", () => {
    expect(getDaysInMonth(12)).toBe(31);
  });

  it("should return 31 for invalid month number (0)", () => {
    expect(getDaysInMonth(0)).toBe(31);
  });

  it("should return 31 for invalid month number (13)", () => {
    expect(getDaysInMonth(13)).toBe(31);
  });

  it("should return 31 for invalid month number (-1)", () => {
    expect(getDaysInMonth(-1)).toBe(31);
  });
});

describe("toISOTimestamp", () => {
  it("should return timestamp from clock when clock is provided", () => {
    const clock = fakeClock("2026-04-16T10:30:00Z");
    const result = toISOTimestamp(clock);

    expect(result).toBe("2026-04-16T10:30:00.000Z");
  });

  it("should return timestamp from Temporal.Instant when instant is provided", () => {
    const instant = Temporal.Instant.from("2025-01-01T00:00:00Z");
    const result = toISOTimestamp(instant);

    expect(result).toBe("2025-01-01T00:00:00.000Z");
  });

  it("should return current timestamp when called without arguments", () => {
    const result = toISOTimestamp();

    expect(typeof result).toBe("string");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe("getCurrentDateDefaults", () => {
  it("should return current date defaults", () => {
    const clock = fakeClock("2026-04-15T00:00:00Z");
    const result = getCurrentDateDefaults(clock);

    expect(result).toEqual({
      dayOfMonth: 15,
      month: 4,
      day: 15,
    });
  });

  it("should return correct values for first day of month", () => {
    const clock = fakeClock("2026-01-01T00:00:00Z");
    const result = getCurrentDateDefaults(clock);

    expect(result).toEqual({
      dayOfMonth: 1,
      month: 1,
      day: 1,
    });
  });

  it("should return correct values for last day of month", () => {
    const clock = fakeClock("2026-12-31T00:00:00Z");
    const result = getCurrentDateDefaults(clock);

    expect(result).toEqual({
      dayOfMonth: 31,
      month: 12,
      day: 31,
    });
  });

  it("should return correct values for February 29 in leap year", () => {
    const clock = fakeClock("2024-02-29T00:00:00Z");
    const result = getCurrentDateDefaults(clock);

    expect(result).toEqual({
      dayOfMonth: 29,
      month: 2,
      day: 29,
    });
  });
});

describe("toISODate", () => {
  it("should return branded ISODate for valid date string", () => {
    const result = toISODate("2026-04-16");

    expect(result).toBe("2026-04-16");
    expect(typeof result).toBe("string");
  });

  it("should return current date when called without arguments", () => {
    const clock = fakeClock("2026-04-16T10:30:00Z");
    const result = toISODate(undefined, clock);

    expect(result).toBe("2026-04-16");
  });

  it("should use provided clock when dateString is not provided", () => {
    const clock = fakeClock("2026-04-16T10:30:00Z");
    const result = toISODate(undefined, clock);

    expect(result).toBe("2026-04-16");
  });

  it("should ignore clock when dateString is provided", () => {
    const clock = fakeClock("2026-04-16T10:30:00Z");
    const result = toISODate("2025-01-01", clock);

    expect(result).toBe("2025-01-01");
  });

  it("should throw error when timestamp is passed instead of date", () => {
    expect(() => toISODate("2026-04-16T10:30:00Z")).toThrow();
  });

  it("should throw error for invalid date string", () => {
    expect(() => toISODate("invalid")).toThrow();
  });

  it("should throw error for empty string", () => {
    expect(() => toISODate("")).toThrow();
  });

  it("should accept valid date with leading zeros", () => {
    const result = toISODate("2026-01-01");

    expect(result).toBe("2026-01-01");
  });

  it("should accept leap year date", () => {
    const result = toISODate("2024-02-29");

    expect(result).toBe("2024-02-29");
  });
});

describe("sanitizeDateOnly", () => {
  it("should return empty string for empty input", () => {
    expect(sanitizeDateOnly("")).toBe("");
  });

  it("should return ISO date as-is when already in correct format", () => {
    expect(sanitizeDateOnly("2026-04-20")).toBe("2026-04-20");
  });

  it("should extract date from ISO timestamp", () => {
    expect(sanitizeDateOnly("2026-04-20T10:30:00.000Z")).toBe("2026-04-20");
  });

  it("should extract date from ISO timestamp without milliseconds", () => {
    expect(sanitizeDateOnly("2026-04-20T10:30:00Z")).toBe("2026-04-20");
  });

  it("should handle date with timezone offset", () => {
    expect(sanitizeDateOnly("2026-04-20T10:30:00+03:00")).toBe("2026-04-20");
  });

  it("should parse valid date string via Temporal.PlainDate", () => {
    expect(sanitizeDateOnly("2026-04-20")).toBe("2026-04-20");
  });

  it("should return empty string for invalid date", () => {
    expect(sanitizeDateOnly("invalid-date")).toBe("");
  });

  it("should return empty string for malformed date", () => {
    // Temporal.PlainDate.from() выбрасывает RangeError для невалидных дат
    expect(sanitizeDateOnly("2026-13-45")).toBe("");
  });

  it("should handle leap year date", () => {
    expect(sanitizeDateOnly("2024-02-29")).toBe("2024-02-29");
  });

  it("should return empty string for non-leap year Feb 29", () => {
    // Temporal.PlainDate.from() выбрасывает RangeError для невалидных дат
    // (2025 — не високосный год, 29 февраля не существует)
    expect(sanitizeDateOnly("2025-02-29")).toBe("");
  });

  describe("timezone-independent behavior (regression test for sync bug)", () => {
    it("should not shift date when parsing ISO date string", () => {
      // Баг: new Date("2026-04-20") в UTC-5 возвращал "2026-04-19"
      // Исправление: используем Temporal.PlainDate вместо Date
      expect(sanitizeDateOnly("2026-04-20")).toBe("2026-04-20");
      expect(sanitizeDateOnly("2026-04-19")).toBe("2026-04-19");
      expect(sanitizeDateOnly("2026-04-18")).toBe("2026-04-18");
    });

    it("should preserve date when called multiple times", () => {
      const date1 = sanitizeDateOnly("2026-04-20");
      const date2 = sanitizeDateOnly(date1);
      const date3 = sanitizeDateOnly(date2);

      expect(date1).toBe("2026-04-20");
      expect(date2).toBe("2026-04-20");
      expect(date3).toBe("2026-04-20");
    });
  });
});
