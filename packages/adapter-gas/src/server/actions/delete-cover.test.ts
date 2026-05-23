import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetScriptProperties,
  setScriptProperty,
} from "../../../tests/server/setup/gas-mocks";
import { PROPERTY_KEYS } from "../helpers/constants";
import { ERROR_CODES } from "../helpers/response";
import { deleteCover } from "./delete-cover";

vi.mock("../sheets/goals.sheet", () => ({ getCoverHashes: vi.fn() }));

import { getCoverHashes } from "../sheets/goals.sheet";

const DEFAULT_COVERS_FOLDER_ID = "covers-folder-id";
const MOCK_DRIVE_FILE_ID = "drive-file-id-abc";

function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>)
    .mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

describe("deleteCover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
    setScriptProperty(PROPERTY_KEYS.COVERS_FOLDER_ID, DEFAULT_COVERS_FOLDER_ID);
    vi.mocked(getCoverHashes).mockReturnValue([]);
    vi.mocked(Drive.Files.list).mockReturnValue({
      files: [{ id: MOCK_DRIVE_FILE_ID, description: "hash-abc" }],
    } as never);
  });

  describe("payload validation", () => {
    it("should return INVALID_PAYLOAD error when hash is empty string", () => {
      deleteCover({ hash: "" });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it("should not call getCoverHashes when hash is missing", () => {
      deleteCover({ hash: "" });

      expect(getCoverHashes).not.toHaveBeenCalled();
    });
  });

  describe("ref_count check (file still referenced)", () => {
    it("should return deleted: false when hash is referenced by one goal", () => {
      vi.mocked(getCoverHashes).mockReturnValue(["hash-abc"]);

      deleteCover({ hash: "hash-abc" });

      expect(parseResponse()).toMatchObject({
        ok: true,
        deleted: false,
        ref_count: 1,
      });
    });

    it("should return correct ref_count when hash is referenced by multiple goals", () => {
      vi.mocked(getCoverHashes).mockReturnValue([
        "hash-abc",
        "hash-abc",
        "hash-abc",
      ]);

      deleteCover({ hash: "hash-abc" });

      expect(parseResponse().ref_count).toBe(3);
    });

    it("should not call Drive.Files.update when hash is still referenced", () => {
      vi.mocked(getCoverHashes).mockReturnValue(["hash-abc"]);

      deleteCover({ hash: "hash-abc" });

      expect(Drive.Files.update).not.toHaveBeenCalled();
    });

    it("should not count other hashes toward ref_count", () => {
      vi.mocked(getCoverHashes).mockReturnValue(["hash-other", "hash-abc"]);

      deleteCover({ hash: "hash-abc" });

      expect(parseResponse().ref_count).toBe(1);
    });
  });

  describe("successful deletion (file not referenced)", () => {
    it("should return deleted: true when hash has no references", () => {
      vi.mocked(getCoverHashes).mockReturnValue([]);

      deleteCover({ hash: "hash-abc" });

      expect(parseResponse()).toMatchObject({
        ok: true,
        deleted: true,
        ref_count: 0,
      });
    });

    it("should call Drive.Files.update with trashed: true", () => {
      deleteCover({ hash: "hash-abc" });

      expect(Drive.Files.update).toHaveBeenCalledWith(
        { trashed: true },
        expect.any(String),
      );
    });

    it("should trash the file matching the given hash", () => {
      deleteCover({ hash: "hash-abc" });

      expect(Drive.Files.update).toHaveBeenCalledWith(
        expect.anything(),
        MOCK_DRIVE_FILE_ID,
      );
    });
  });

  describe("Drive error handling", () => {
    it("should return FILE_NOT_FOUND error when Drive.Files.update throws", () => {
      vi.mocked(Drive.Files.update).mockImplementation(() => {
        throw new Error("Not found");
      });

      deleteCover({ hash: "hash-abc" });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.FILE_NOT_FOUND);
    });

    it("should include hash in the error message when Drive throws", () => {
      vi.mocked(Drive.Files.update).mockImplementation(() => {
        throw new Error("Not found");
      });

      deleteCover({ hash: "hash-abc" });

      expect(parseResponse().message).toContain("hash-abc");
    });
  });
});
