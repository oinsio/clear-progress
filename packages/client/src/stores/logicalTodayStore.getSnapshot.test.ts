import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { fakeClock } from "@/lib/temporal";
import { _resetForTesting, getSnapshot } from "./logicalTodayStore";

// implements FR1 of fix-completed-today-stale-on-day-rollover
describe("logicalTodayStore — getSnapshot", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetForTesting();
  });

  it("should return the current logical date for the injected clock", () => {
    _resetForTesting(fakeClock("2026-06-04T20:00:00Z", "UTC"));

    expect(getSnapshot()).toBe("2026-06-04");
  });

  it("should return the previous logical day before a custom day boundary", () => {
    localStorage.setItem(STORAGE_KEYS.DAY_BOUNDARY, "04:00");
    _resetForTesting(fakeClock("2026-06-05T01:00:00Z", "UTC"));

    expect(getSnapshot()).toBe("2026-06-04");
  });
});
