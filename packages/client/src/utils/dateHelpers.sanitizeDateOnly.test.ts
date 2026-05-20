import { describe, expect, it } from "vitest";
import { sanitizeDateOnly } from "./dateHelpers";

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
