// implements FR7, FR8 of fix-push-poison-pill
import { describe, expect, it } from "vitest";
import { RECORD_SYNC_STATUS } from "@/constants";
import {
  getEffectiveSyncStatus,
  getSyncStatusBorderClass,
} from "./syncStatusBorder";

describe("getSyncStatusBorderClass", () => {
  it("should return red border for rejected status", () => {
    expect(getSyncStatusBorderClass(RECORD_SYNC_STATUS.REJECTED)).toBe(
      "border-l-red-500",
    );
  });

  it("should return amber border for pending status", () => {
    expect(getSyncStatusBorderClass(RECORD_SYNC_STATUS.PENDING)).toBe(
      "border-l-amber-400",
    );
  });

  it("should return transparent border for synced status", () => {
    expect(getSyncStatusBorderClass(RECORD_SYNC_STATUS.SYNCED)).toBe(
      "border-l-transparent",
    );
  });

  it("should return transparent border for unknown status", () => {
    expect(getSyncStatusBorderClass("unknown")).toBe("border-l-transparent");
  });
});

describe("getEffectiveSyncStatus", () => {
  it("should return rejected when entity is rejected", () => {
    expect(getEffectiveSyncStatus(RECORD_SYNC_STATUS.REJECTED, false)).toBe(
      RECORD_SYNC_STATUS.REJECTED,
    );
  });

  it("should return rejected when entity is rejected even with unsynced children", () => {
    expect(getEffectiveSyncStatus(RECORD_SYNC_STATUS.REJECTED, true)).toBe(
      RECORD_SYNC_STATUS.REJECTED,
    );
  });

  it("should return pending when entity is pending", () => {
    expect(getEffectiveSyncStatus(RECORD_SYNC_STATUS.PENDING, false)).toBe(
      RECORD_SYNC_STATUS.PENDING,
    );
  });

  it("should return pending when entity is synced but has unsynced children", () => {
    expect(getEffectiveSyncStatus(RECORD_SYNC_STATUS.SYNCED, true)).toBe(
      RECORD_SYNC_STATUS.PENDING,
    );
  });

  it("should return synced when entity is synced and no unsynced children", () => {
    expect(getEffectiveSyncStatus(RECORD_SYNC_STATUS.SYNCED, false)).toBe(
      RECORD_SYNC_STATUS.SYNCED,
    );
  });
});
