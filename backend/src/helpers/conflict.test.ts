import { describe, expect, it } from "vitest";
import { resolveConflict } from "./conflict";
import { CONFLICT_RESOLUTION } from "./constants";

describe("resolveConflict", () => {
  it("should return accept when client updated_at is newer than server", () => {
    expect(
      resolveConflict("2025-01-02T00:00:00.000Z", "2025-01-01T00:00:00.000Z"),
    ).toBe(CONFLICT_RESOLUTION.ACCEPT);
  });

  it("should return conflict when server updated_at is newer than client", () => {
    expect(
      resolveConflict("2025-01-01T00:00:00.000Z", "2025-01-02T00:00:00.000Z"),
    ).toBe(CONFLICT_RESOLUTION.CONFLICT);
  });

  it("should return accept when client and server updated_at are equal", () => {
    const sameTime = "2025-06-15T12:00:00.000Z";
    expect(resolveConflict(sameTime, sameTime)).toBe(
      CONFLICT_RESOLUTION.ACCEPT,
    );
  });

  it("should compare by milliseconds precision", () => {
    expect(
      resolveConflict("2025-01-01T00:00:00.001Z", "2025-01-01T00:00:00.000Z"),
    ).toBe(CONFLICT_RESOLUTION.ACCEPT);
    expect(
      resolveConflict("2025-01-01T00:00:00.000Z", "2025-01-01T00:00:00.001Z"),
    ).toBe(CONFLICT_RESOLUTION.CONFLICT);
  });

  it("should compare by time of day within the same date", () => {
    expect(
      resolveConflict("2025-01-01T12:00:00.000Z", "2025-01-01T11:59:59.999Z"),
    ).toBe(CONFLICT_RESOLUTION.ACCEPT);
    expect(
      resolveConflict("2025-01-01T11:59:59.999Z", "2025-01-01T12:00:00.000Z"),
    ).toBe(CONFLICT_RESOLUTION.CONFLICT);
  });

  it("should handle timestamps with timezone offset (not just Z)", () => {
    // 2025-01-01T10:00:00+05:00 = 2025-01-01T05:00:00Z
    // 2025-01-01T06:00:00Z is newer
    expect(
      resolveConflict("2025-01-01T06:00:00Z", "2025-01-01T10:00:00+05:00"),
    ).toBe(CONFLICT_RESOLUTION.ACCEPT);
    expect(
      resolveConflict("2025-01-01T10:00:00+05:00", "2025-01-01T06:00:00Z"),
    ).toBe(CONFLICT_RESOLUTION.CONFLICT);
  });

  it("should throw error when client timestamp is invalid", () => {
    expect(() =>
      resolveConflict("invalid-date", "2025-01-01T00:00:00.000Z"),
    ).toThrow(
      "Invalid timestamp format: client=invalid-date, server=2025-01-01T00:00:00.000Z",
    );
  });

  it("should throw error when server timestamp is invalid", () => {
    expect(() =>
      resolveConflict("2025-01-01T00:00:00.000Z", "not-a-date"),
    ).toThrow(
      "Invalid timestamp format: client=2025-01-01T00:00:00.000Z, server=not-a-date",
    );
  });

  it("should throw error when both timestamps are invalid", () => {
    expect(() => resolveConflict("bad-client", "bad-server")).toThrow(
      "Invalid timestamp format: client=bad-client, server=bad-server",
    );
  });

  it("should throw error when client timestamp is empty string", () => {
    expect(() => resolveConflict("", "2025-01-01T00:00:00.000Z")).toThrow(
      "Invalid timestamp format",
    );
  });

  it("should throw error when server timestamp is empty string", () => {
    expect(() => resolveConflict("2025-01-01T00:00:00.000Z", "")).toThrow(
      "Invalid timestamp format",
    );
  });
});
