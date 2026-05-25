import { describe, expect, it } from "vitest";
import {
  coerceSheetBox,
  coerceSheetGoalStatus,
  normalizeToSheetDate,
  SHEET_HEADERS,
  SHEET_NAMES,
  toISODateValue,
  toISOStringValue,
} from "../../../src/server/helpers/constants";

describe("toISOStringValue", () => {
  it("should convert Date object via toISOString", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    const result = toISOStringValue(date);
    expect(result).toBe("2025-01-15T10:30:00.000Z");
    // Kills L259: instanceof Date → false (String(date) gives different format)
  });

  it("should return empty string for empty input", () => {
    expect(toISOStringValue("")).toBe("");
  });

  it("should return empty string for null", () => {
    expect(toISOStringValue(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(toISOStringValue(undefined)).toBe("");
  });

  it("should pad missing fractional seconds to .000Z", () => {
    expect(toISOStringValue("2025-01-15T10:30:00Z")).toBe(
      "2025-01-15T10:30:00.000Z",
    );
  });

  it("should pad 1-digit fractional seconds to 3 digits", () => {
    expect(toISOStringValue("2025-01-15T10:30:00.1Z")).toBe(
      "2025-01-15T10:30:00.100Z",
    );
  });

  it("should pad 2-digit fractional seconds to 3 digits", () => {
    expect(toISOStringValue("2025-01-15T10:30:00.12Z")).toBe(
      "2025-01-15T10:30:00.120Z",
    );
  });

  it("should preserve 3-digit fractional seconds", () => {
    expect(toISOStringValue("2025-01-15T10:30:00.123Z")).toBe(
      "2025-01-15T10:30:00.123Z",
    );
  });

  it("should return non-timestamp string unchanged", () => {
    expect(toISOStringValue("hello")).toBe("hello");
  });

  it("should handle numeric value via String coercion", () => {
    expect(toISOStringValue(42)).toBe("42");
  });

  // Kills Regex mutant L268: /(\d:\d{2}:\d{2})/ (single digit hour)
  it("should not match single-digit hour format", () => {
    const input = "2025-01-15T1:30:00Z";
    // The regex requires \d{2} for hours, so this should NOT be normalized
    expect(toISOStringValue(input)).toBe(input);
  });

  // Kills Regex mutant L268: anchor removed — /(...)?Z/  instead of /(...)?Z$/
  it("should not replace Z in middle of string", () => {
    const input = "prefixZ2025-01-15T10:30:00Z";
    const result = toISOStringValue(input);
    // Only trailing Z should be processed
    expect(result).toContain("prefixZ");
  });
});

describe("toISODateValue", () => {
  it("should extract date part from Date object", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    expect(toISODateValue(date)).toBe("2025-01-15");
  });

  it("should return empty for empty string", () => {
    expect(toISODateValue("")).toBe("");
  });

  it("should return empty for null", () => {
    expect(toISODateValue(null)).toBe("");
  });

  it("should return empty for undefined", () => {
    expect(toISODateValue(undefined)).toBe("");
  });

  it("should return ISO date string as-is", () => {
    expect(toISODateValue("2025-01-15")).toBe("2025-01-15");
  });

  it("should strip leading apostrophe", () => {
    expect(toISODateValue("'2025-01-15")).toBe("2025-01-15");
  });

  it("should extract date from ISO timestamp", () => {
    expect(toISODateValue("2025-01-15T10:30:00.000Z")).toBe("2025-01-15");
  });

  it("should parse non-ISO date string via Date constructor", () => {
    // Kills NoCoverage L292-293: parseable non-ISO string
    // RFC 2822 with +0000 (no "T" char, unlike "GMT")
    const result = toISODateValue("Wed, 15 Jan 2025 12:00:00 +0000");
    expect(result).toBe("2025-01-15");
  });

  it("should return empty for unparseable string", () => {
    // Kills NoCoverage L294: fallback to ""
    expect(toISODateValue("not-a-date")).toBe("");
  });

  it("should not confuse non-date string with ISO date", () => {
    expect(toISODateValue("abcd-ef-gh")).toBe("");
  });

  it("should handle apostrophe-prefixed ISO timestamp", () => {
    expect(toISODateValue("'2025-01-15T10:30:00Z")).toBe("2025-01-15");
  });

  // Kills Regex mutants for /^\d{4}-\d{2}-\d{2}$/ at L287
  // Mutated regex would match these and return them as-is via fast path;
  // original regex rejects them → they go through Date parsing fallback
  it.each([
    "1-01-01", // Kills /^\d-\d{2}-\d{2}$/
    "2025-1-15", // Kills /^\d{4}-\d-\d{2}$/
    "2025-01-1", // Kills /^\d{4}-\d{2}-\d$/
    "2025-AB-15", // Kills /^\d{4}-\D{2}-\d{2}$/
    "2025-01-AB", // Kills /^\d{4}-\d{2}-\D{2}$/
    "X2025-01-15", // Kills /\d{4}-\d{2}-\d{2}$/ (no ^ anchor)
  ])("should not return %s as-is (regex fast path must not match)", (input) => {
    expect(toISODateValue(input)).not.toBe(input);
  });

  // Kills ConditionalExpression L287 → false (valid date must match regex)
  it("should return valid ISO date unchanged without Date parsing", () => {
    expect(toISODateValue("9999-12-31")).toBe("9999-12-31");
  });

  // Kills ConditionalExpression L289 → false (timestamp with T must extract date)
  it("should extract date from timestamp with T character", () => {
    expect(toISODateValue("2025-06-15T23:59:59Z")).toBe("2025-06-15");
  });
});

describe("normalizeToSheetDate", () => {
  it("should return empty for null", () => {
    expect(normalizeToSheetDate(null)).toBe("");
  });

  it("should return empty for undefined", () => {
    expect(normalizeToSheetDate(undefined)).toBe("");
  });

  it("should return empty for empty string", () => {
    expect(normalizeToSheetDate("")).toBe("");
  });

  it("should convert Date object to apostrophe-prefixed date", () => {
    // Kills NoCoverage L356-358
    const date = new Date("2025-06-15T10:30:00.000Z");
    expect(normalizeToSheetDate(date)).toBe("'2025-06-15");
  });

  it("should return empty for invalid Date object", () => {
    // Kills NoCoverage L357: isNaN check
    expect(normalizeToSheetDate(new Date("invalid"))).toBe("");
  });

  it("should return already-prefixed string as-is", () => {
    expect(normalizeToSheetDate("'2025-01-15")).toBe("'2025-01-15");
  });

  it("should add apostrophe to ISO date string", () => {
    expect(normalizeToSheetDate("2025-01-15")).toBe("'2025-01-15");
  });

  it("should extract date from ISO timestamp and prefix", () => {
    // Kills NoCoverage L374-376
    expect(normalizeToSheetDate("2025-01-15T10:30:00.000Z")).toBe(
      "'2025-01-15",
    );
  });

  it("should parse non-ISO date string and prefix", () => {
    // Kills NoCoverage L380-382
    // RFC 2822 with +0000 (no "T" char, unlike "GMT")
    const result = normalizeToSheetDate("Sun, 15 Jun 2025 12:00:00 +0000");
    expect(result).toBe("'2025-06-15");
  });

  it("should return empty for unparseable string", () => {
    // Kills NoCoverage L385
    expect(normalizeToSheetDate("not-a-date")).toBe("");
  });

  it("should not treat startsWith as endsWith", () => {
    // Kills L364 MethodExpression: str.endsWith("'")
    expect(normalizeToSheetDate("2025-01-15'")).not.toBe("2025-01-15'");
  });

  // Kills L351 ConditionalExpression: each branch independently
  it("should return empty for null specifically", () => {
    expect(normalizeToSheetDate(null)).toBe("");
  });

  it("should return empty for undefined specifically", () => {
    expect(normalizeToSheetDate(undefined)).toBe("");
  });

  it("should return empty for empty string specifically", () => {
    expect(normalizeToSheetDate("")).toBe("");
  });

  // Kills L351 LogicalOperator: || → && (only null+undefined+empty should return "")
  // Use a parseable non-empty value to prove it doesn't return ""
  it("should NOT return empty for parseable non-empty non-null value", () => {
    expect(normalizeToSheetDate("2025-01-15")).not.toBe("");
  });

  // Kills L351 BlockStatement → {} (must actually return "")
  it("should return exactly empty string for null, not undefined", () => {
    const result = normalizeToSheetDate(null);
    expect(result).toStrictEqual("");
  });

  // Kills Regex mutants for /^\d{4}-\d{2}-\d{2}$/ at L369
  // Mutated regex would match these and return `'${input}`;
  // original rejects them → they go through Date parsing fallback
  it.each([
    "1-01-01",
    "2025-1-15",
    "2025-01-1",
    "2025-AB-15",
    "2025-01-AB",
    "X2025-01-15",
  ])("should not return '%s prefixed as-is (regex must not match %s)", (input) => {
    expect(normalizeToSheetDate(input)).not.toBe(`'${input}`);
  });

  // Kills L369 ConditionalExpression → false (ISO date must get apostrophe prefix)
  it("should prefix ISO date with apostrophe", () => {
    expect(normalizeToSheetDate("2025-01-15")).toBe("'2025-01-15");
  });

  // Kills L369 BlockStatement → {} (must return the prefixed value)
  it("should return prefixed string, not fall through to Date parsing", () => {
    const result = normalizeToSheetDate("2025-01-15");
    expect(result).toBe("'2025-01-15");
    expect(result).not.toBe("");
  });

  // Kills L374 ConditionalExpression → false (timestamp with T must be handled)
  it("should handle ISO timestamp by extracting date", () => {
    expect(normalizeToSheetDate("2025-06-15T23:59:59Z")).toBe("'2025-06-15");
  });

  // Kills L374 BlockStatement → {} (must return the value, not fall through)
  it("should return prefixed date from timestamp, not empty", () => {
    const result = normalizeToSheetDate("2025-06-15T23:59:59Z");
    expect(result).not.toBe("");
    expect(result).toBe("'2025-06-15");
  });
});

describe("SHEET_HEADERS", () => {
  // Kills StringLiteral mutants at L59-62
  it.each([
    "is_hidden",
    "next_date",
    "appear_date",
    "original_task_id",
  ])("should include %s in Tasks headers", (column) => {
    expect(SHEET_HEADERS[SHEET_NAMES.TASKS]).toContain(column);
  });
});

describe("coerceSheetBox edge cases", () => {
  it("should return inbox when value is null", () => {
    expect(coerceSheetBox(null)).toBe("inbox");
  });
});

describe("coerceSheetGoalStatus edge cases", () => {
  it("should return planning when value is null", () => {
    expect(coerceSheetGoalStatus(null)).toBe("planning");
  });
});
