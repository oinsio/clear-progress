import { beforeEach, describe, expect, it } from "vitest";
import { MAX_COVER_BATCH_SIZE } from "../helpers/constants";
import { ERROR_CODES } from "../helpers/response";
import { getCover } from "./get-cover";
import { parseResponse, setupDriveMocks } from "./get-cover-test-utils";

describe("getCover — validation", () => {
  beforeEach(() => {
    setupDriveMocks();
  });

  it("should return ok: false when file_ids is missing", () => {
    getCover({} as Parameters<typeof getCover>[0]);

    expect(parseResponse().ok).toBe(false);
  });

  it("should return INVALID_PAYLOAD when file_ids is missing", () => {
    getCover({} as Parameters<typeof getCover>[0]);

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it("should return ok: false when file_ids is not an array", () => {
    getCover({ file_ids: "not-an-array" } as unknown as Parameters<
      typeof getCover
    >[0]);

    expect(parseResponse().ok).toBe(false);
  });

  it("should return INVALID_PAYLOAD when file_ids is not an array", () => {
    getCover({ file_ids: "not-an-array" } as unknown as Parameters<
      typeof getCover
    >[0]);

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it("should return ok: false when file_ids is empty array", () => {
    getCover({ file_ids: [] });

    expect(parseResponse().ok).toBe(false);
  });

  it("should return INVALID_PAYLOAD when file_ids is empty array", () => {
    getCover({ file_ids: [] });

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it("should return ok: false when file_ids count exceeds MAX_COVER_BATCH_SIZE", () => {
    const tooManyIds = Array.from(
      { length: MAX_COVER_BATCH_SIZE + 1 },
      (_, i) => `file-id-${i}`,
    );

    getCover({ file_ids: tooManyIds });

    expect(parseResponse().ok).toBe(false);
  });

  it("should return INVALID_PAYLOAD when file_ids count exceeds MAX_COVER_BATCH_SIZE", () => {
    const tooManyIds = Array.from(
      { length: MAX_COVER_BATCH_SIZE + 1 },
      (_, i) => `file-id-${i}`,
    );

    getCover({ file_ids: tooManyIds });

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it("should accept exactly MAX_COVER_BATCH_SIZE file_ids", () => {
    const maxIds = Array.from(
      { length: MAX_COVER_BATCH_SIZE },
      (_, i) => `file-id-${i}`,
    );

    getCover({ file_ids: maxIds });

    expect(parseResponse().ok).toBe(true);
  });
});
