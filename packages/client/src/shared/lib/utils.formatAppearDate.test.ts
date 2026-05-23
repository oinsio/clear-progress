import i18next from "i18next";
import { beforeEach, describe, expect, it } from "vitest";
import { formatAppearDate } from "./utils";

describe("formatAppearDate", () => {
  beforeEach(() => {
    i18next.changeLanguage("ru");
  });

  it("should return empty string for empty input", () => {
    expect(formatAppearDate("")).toBe("");
  });

  it("should format date with full month name in Russian", () => {
    const result = formatAppearDate("2026-04-15");
    expect(result).toBe("15 апреля 2026");
  });

  it("should format date with full month name in English with ordinal suffix", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-04-15");
    expect(result).toBe("April 15th, 2026");
  });

  it("should handle different dates correctly", () => {
    const result = formatAppearDate("2025-12-31");
    expect(result).toBe("31 декабря 2025");
  });

  it("should format date with single-digit day", () => {
    const result = formatAppearDate("2026-01-05");
    expect(result).toBe("5 января 2026");
  });

  it("should use ordinal suffix '1st' for day 1 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-01");
    expect(result).toBe("May 1st, 2026");
  });

  it("should use ordinal suffix '2nd' for day 2 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-02");
    expect(result).toBe("May 2nd, 2026");
  });

  it("should use ordinal suffix '3rd' for day 3 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-03");
    expect(result).toBe("May 3rd, 2026");
  });

  it("should use ordinal suffix '21st' for day 21 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-21");
    expect(result).toBe("May 21st, 2026");
  });

  it("should use ordinal suffix '22nd' for day 22 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-22");
    expect(result).toBe("May 22nd, 2026");
  });

  it("should use ordinal suffix '23rd' for day 23 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-23");
    expect(result).toBe("May 23rd, 2026");
  });

  it("should use ordinal suffix '31st' for day 31 in English", () => {
    i18next.changeLanguage("en");
    const result = formatAppearDate("2026-05-31");
    expect(result).toBe("May 31st, 2026");
  });
});
