import { beforeEach, describe, expect, it } from "vitest";
import { MAX_FILE_BATCH_SIZE } from "../helpers/constants";
import { ERROR_CODES } from "../helpers/response";
import { parseResponse, setupDriveMocks } from "./get-cover-test-utils";
import { getFile } from "./get-file";

describe("getFile — validation", () => {
  beforeEach(() => {
    setupDriveMocks();
  });

  it("should return ok: false when hashes is missing", () => {
    getFile({} as Parameters<typeof getFile>[0]);

    expect(parseResponse().ok).toBe(false);
  });

  it("should return INVALID_PAYLOAD when hashes is missing", () => {
    getFile({} as Parameters<typeof getFile>[0]);

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it("should return ok: false when hashes is not an array", () => {
    getFile({ hashes: "not-an-array" } as unknown as Parameters<
      typeof getFile
    >[0]);

    expect(parseResponse().ok).toBe(false);
  });

  it("should return INVALID_PAYLOAD when hashes is not an array", () => {
    getFile({ hashes: "not-an-array" } as unknown as Parameters<
      typeof getFile
    >[0]);

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it("should return ok: false when hashes is empty array", () => {
    getFile({ hashes: [] });

    expect(parseResponse().ok).toBe(false);
  });

  it("should return INVALID_PAYLOAD when hashes is empty array", () => {
    getFile({ hashes: [] });

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it("should return ok: false when hashes count exceeds MAX_FILE_BATCH_SIZE", () => {
    const tooManyIds = Array.from(
      { length: MAX_FILE_BATCH_SIZE + 1 },
      (_, i) => `file-id-${i}`,
    );

    getFile({ hashes: tooManyIds });

    expect(parseResponse().ok).toBe(false);
  });

  it("should return INVALID_PAYLOAD when hashes count exceeds MAX_FILE_BATCH_SIZE", () => {
    const tooManyIds = Array.from(
      { length: MAX_FILE_BATCH_SIZE + 1 },
      (_, i) => `file-id-${i}`,
    );

    getFile({ hashes: tooManyIds });

    expect(parseResponse().error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it("should accept exactly MAX_FILE_BATCH_SIZE hashes", () => {
    const maxIds = Array.from(
      { length: MAX_FILE_BATCH_SIZE },
      (_, i) => `file-id-${i}`,
    );

    getFile({ hashes: maxIds });

    expect(parseResponse().ok).toBe(true);
  });
});
