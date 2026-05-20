import { describe, expect, it } from "vitest";
import { fakeClock, Temporal } from "@/lib/temporal";
import { getCurrentDateDefaults, toISOTimestamp } from "./dateHelpers";

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
