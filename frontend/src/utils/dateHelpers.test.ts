import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDaysInMonth, getCurrentDateDefaults } from "./dateHelpers";

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

describe("getCurrentDateDefaults", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return current date defaults", () => {
    // Устанавливаем фиксированную дату: 15 апреля 2026
    vi.setSystemTime(new Date(2026, 3, 15)); // месяц 3 = апрель (0-based)

    const result = getCurrentDateDefaults();

    expect(result).toEqual({
      dayOfMonth: 15,
      month: 4, // 1-based
      day: 15,
    });
  });

  it("should return correct values for first day of month", () => {
    // 1 января 2026
    vi.setSystemTime(new Date(2026, 0, 1));

    const result = getCurrentDateDefaults();

    expect(result).toEqual({
      dayOfMonth: 1,
      month: 1,
      day: 1,
    });
  });

  it("should return correct values for last day of month", () => {
    // 31 декабря 2026
    vi.setSystemTime(new Date(2026, 11, 31));

    const result = getCurrentDateDefaults();

    expect(result).toEqual({
      dayOfMonth: 31,
      month: 12,
      day: 31,
    });
  });

  it("should return correct values for February 29 in leap year", () => {
    // 29 февраля 2024 (високосный год)
    vi.setSystemTime(new Date(2024, 1, 29));

    const result = getCurrentDateDefaults();

    expect(result).toEqual({
      dayOfMonth: 29,
      month: 2,
      day: 29,
    });
  });
});
