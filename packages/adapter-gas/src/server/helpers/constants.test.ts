import { describe, expect, it } from "vitest";
import {
  API_VERSION,
  APP_NAME,
  coerceSheetGoalStatus,
  colMap,
  DEFAULT_COVER_EXTENSION,
  isValidUuid,
  LOCK_TIMEOUT_MS,
  MAX_COVER_SIZE_BYTES,
  META_KEYS,
  SHEET_HEADERS,
  SHEET_NAMES,
  toISODateValue,
  toSheetDateValue,
  VALID_GOAL_STATUSES,
} from "./constants";

describe("APP_NAME", () => {
  it('should be "clear_progress"', () => {
    expect(APP_NAME).toBe("clear_progress");
  });
});

describe("API_VERSION", () => {
  it('should be "1.0"', () => {
    expect(API_VERSION).toBe("1.0");
  });
});

describe("VALID_GOAL_STATUSES", () => {
  it('should include "planning" as the first value', () => {
    expect(VALID_GOAL_STATUSES[0]).toBe("planning");
  });

  it("should contain all five valid statuses", () => {
    expect(VALID_GOAL_STATUSES).toEqual([
      "planning",
      "in_progress",
      "paused",
      "completed",
      "cancelled",
    ]);
  });
});

describe("MAX_COVER_SIZE_BYTES", () => {
  it("should equal exactly 2 MB (2097152 bytes)", () => {
    expect(MAX_COVER_SIZE_BYTES).toBe(2097152);
  });
});

describe("DEFAULT_COVER_EXTENSION", () => {
  it('should be "jpg"', () => {
    expect(DEFAULT_COVER_EXTENSION).toBe("jpg");
  });
});

describe("colMap", () => {
  it("should map id column to index 0 for Tasks sheet", () => {
    expect(colMap(SHEET_NAMES.TASKS).id).toBe(0);
  });

  it("should map name column to index 1 for Tasks sheet", () => {
    expect(colMap(SHEET_NAMES.TASKS).name).toBe(1);
  });

  it("should map id column to index 0 for Goals sheet", () => {
    expect(colMap(SHEET_NAMES.GOALS).id).toBe(0);
  });
});

describe("coerceSheetGoalStatus", () => {
  it('should return "planning" for input "planning"', () => {
    expect(coerceSheetGoalStatus("planning")).toBe("planning");
  });
});

describe("SHEET_NAMES.META", () => {
  it('should equal "Meta"', () => {
    expect(SHEET_NAMES.META).toBe("Meta");
  });
});

describe("META_KEYS", () => {
  it('should have NEXT_REVISION key equal to "next_revision"', () => {
    expect(META_KEYS.NEXT_REVISION).toBe("next_revision");
  });
});

describe("LOCK_TIMEOUT_MS", () => {
  it("should be a positive number", () => {
    expect(LOCK_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it("should be 30000 (30 seconds)", () => {
    expect(LOCK_TIMEOUT_MS).toBe(30000);
  });
});

describe("SHEET_HEADERS revision column", () => {
  const entitySheets = [
    SHEET_NAMES.TASKS,
    SHEET_NAMES.GOALS,
    SHEET_NAMES.CONTEXTS,
    SHEET_NAMES.CATEGORIES,
    SHEET_NAMES.CHECKLIST_ITEMS,
  ];

  it.each(
    entitySheets,
  )('should include "revision" column in %s headers', (sheetName) => {
    expect(SHEET_HEADERS[sheetName]).toContain("revision");
  });

  it('should NOT include "revision" column in Settings headers', () => {
    expect(SHEET_HEADERS[SHEET_NAMES.SETTINGS]).not.toContain("revision");
  });
});

describe("isValidUuid", () => {
  const VALID_UUID = "11111111-1111-4111-a111-111111111111";

  it("should return false for a UUID with a leading prefix", () => {
    expect(isValidUuid(`prefix-${VALID_UUID}`)).toBe(false);
  });

  it("should return false for a UUID with a trailing suffix", () => {
    expect(isValidUuid(`${VALID_UUID}-suffix`)).toBe(false);
  });

  it("should return true for a valid UUID v4", () => {
    expect(isValidUuid(VALID_UUID)).toBe(true);
  });

  it("should return false for an empty string", () => {
    expect(isValidUuid("")).toBe(false);
  });
});

describe("toSheetDateValue", () => {
  it("should add leading apostrophe to ISO date string", () => {
    expect(toSheetDateValue("2026-04-20")).toBe("'2026-04-20");
  });

  it("should return empty string for empty input", () => {
    expect(toSheetDateValue("")).toBe("");
  });

  it("should add apostrophe to any non-empty string", () => {
    expect(toSheetDateValue("2026-12-31")).toBe("'2026-12-31");
  });
});

describe("toISODateValue", () => {
  it("should extract date from Date object", () => {
    const date = new Date("2026-04-20T10:30:00.000Z");
    expect(toISODateValue(date)).toBe("2026-04-20");
  });

  it("should return ISO date string as-is", () => {
    expect(toISODateValue("2026-04-20")).toBe("2026-04-20");
  });

  it("should extract date from ISO timestamp", () => {
    expect(toISODateValue("2026-04-20T10:30:00.000Z")).toBe("2026-04-20");
  });

  it("should remove leading apostrophe from string", () => {
    expect(toISODateValue("'2026-04-20")).toBe("2026-04-20");
  });

  it("should handle apostrophe-prefixed ISO timestamp", () => {
    expect(toISODateValue("'2026-04-20T10:30:00.000Z")).toBe("2026-04-20");
  });

  it("should return empty string for empty input", () => {
    expect(toISODateValue("")).toBe("");
  });

  it("should return empty string for null", () => {
    expect(toISODateValue(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(toISODateValue(undefined)).toBe("");
  });
});
