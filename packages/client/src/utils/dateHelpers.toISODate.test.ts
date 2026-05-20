import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import { toISODate } from "./dateHelpers";

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
