// implements FR1 of fix-push-poison-pill
import { describe, expect, it } from "vitest";
import { fakeClock } from "@/lib/temporal";
import {
  healBoolean,
  healChecklistItemTaskId,
  healFileSize,
  healForeignKey,
  healMissingBox,
  healMissingName,
  healOptionalDate,
  healOptionalTimestamp,
  healRepeatRule,
  healSortOrder,
  healTimestamp,
  isValidISODateOrEmpty,
  isValidISOTimestamp,
  isValidISOTimestampOrEmpty,
  isValidUUID,
  isValidUUIDOrEmpty,
} from "./healingRules";

describe("isValidUUID", () => {
  it("should return true for a valid UUID", () => {
    expect(isValidUUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe(true);
  });

  it("should return false for a non-string value", () => {
    expect(isValidUUID(123)).toBe(false);
    expect(isValidUUID(null)).toBe(false);
    expect(isValidUUID(undefined)).toBe(false);
  });

  it("should return false for an empty string", () => {
    expect(isValidUUID("")).toBe(false);
  });

  it("should return false for an invalid string", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
  });
});

describe("isValidISOTimestamp", () => {
  it("should return true for a valid ISO timestamp", () => {
    expect(isValidISOTimestamp("2026-06-27T10:00:00.000Z")).toBe(true);
  });

  it("should return false for a non-string value", () => {
    expect(isValidISOTimestamp(42)).toBe(false);
    expect(isValidISOTimestamp(null)).toBe(false);
  });

  it("should return false for an invalid string", () => {
    expect(isValidISOTimestamp("not-a-timestamp")).toBe(false);
    expect(isValidISOTimestamp("2026/06/27")).toBe(false);
  });
});

describe("isValidISODateOrEmpty", () => {
  it("should return true for empty string", () => {
    expect(isValidISODateOrEmpty("")).toBe(true);
  });

  it("should return true for a valid ISO date", () => {
    expect(isValidISODateOrEmpty("2026-06-27")).toBe(true);
  });

  it("should return false for a non-string value", () => {
    expect(isValidISODateOrEmpty(123)).toBe(false);
    expect(isValidISODateOrEmpty(null)).toBe(false);
  });

  it("should return false for an invalid date string", () => {
    expect(isValidISODateOrEmpty("2026/06/27")).toBe(false);
  });
});

describe("isValidISOTimestampOrEmpty", () => {
  it("should return true for empty string", () => {
    expect(isValidISOTimestampOrEmpty("")).toBe(true);
  });

  it("should return true for a valid ISO timestamp", () => {
    expect(isValidISOTimestampOrEmpty("2026-06-27T10:00:00.000Z")).toBe(true);
  });

  it("should return false for a non-string value", () => {
    expect(isValidISOTimestampOrEmpty(99)).toBe(false);
  });

  it("should return false for an invalid string", () => {
    expect(isValidISOTimestampOrEmpty("bad")).toBe(false);
  });
});

describe("isValidUUIDOrEmpty", () => {
  it("should return true for empty string", () => {
    expect(isValidUUIDOrEmpty("")).toBe(true);
  });

  it("should return true for a valid UUID", () => {
    expect(isValidUUIDOrEmpty("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe(
      true,
    );
  });

  it("should return false for a non-string value", () => {
    expect(isValidUUIDOrEmpty(42)).toBe(false);
  });

  it("should return false for an invalid string", () => {
    expect(isValidUUIDOrEmpty("not-uuid")).toBe(false);
  });
});

describe("healer functions", () => {
  it("healTimestamp should return current ISO timestamp", () => {
    const clock = fakeClock("2026-06-27T10:00:00Z");
    const result = healTimestamp(clock);
    expect(result).toBe("2026-06-27T10:00:00.000Z");
  });

  it("healForeignKey should return empty string", () => {
    expect(healForeignKey()).toBe("");
  });

  it("healBoolean should return false", () => {
    expect(healBoolean()).toBe(false);
  });

  it("healOptionalTimestamp should return empty string", () => {
    expect(healOptionalTimestamp()).toBe("");
  });

  it("healOptionalDate should return empty string", () => {
    expect(healOptionalDate()).toBe("");
  });

  it("healRepeatRule should return empty string and alert", () => {
    const result = healRepeatRule();
    expect(result.value).toBe("");
    expect(result.alert.messageKey).toBe("sync.alert.repeat_rule_reset");
  });

  it("healMissingName should return (untitled) and alert", () => {
    const result = healMissingName();
    expect(result.value).toBe("(untitled)");
    expect(result.alert.messageKey).toBe("sync.alert.name_set_untitled");
  });

  it("healSortOrder should return '0'", () => {
    expect(healSortOrder()).toBe("0");
  });

  it("healMissingBox should return 'inbox'", () => {
    expect(healMissingBox()).toBe("inbox");
  });

  it("healFileSize should return 0", () => {
    expect(healFileSize()).toBe(0);
  });

  it("healChecklistItemTaskId should return isDeleted true and alert", () => {
    const result = healChecklistItemTaskId();
    expect(result.isDeleted).toBe(true);
    expect(result.alert.messageKey).toBe("sync.alert.checklist_item_deleted");
  });
});
