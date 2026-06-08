import { beforeEach, describe, expect, it, vi } from "vitest";
import { ERROR_CODES } from "../helpers/response";
import {
  HASH_1,
  HASH_2,
  MOCK_BASE64,
  MOCK_FILE_ID_1,
  MOCK_MIME_TYPE,
  parseResponse,
  setupDriveMocks,
} from "./get-cover-test-utils";
import { getFile } from "./get-file";

describe("getFile — retrieval", () => {
  beforeEach(() => {
    setupDriveMocks();
  });

  describe("single file retrieval", () => {
    it("should return ok: true for a valid file", () => {
      getFile({ hashes: [HASH_1] });

      expect(parseResponse().ok).toBe(true);
    });

    it("should return files array for a valid file", () => {
      getFile({ hashes: [HASH_1] });

      const response = parseResponse();
      expect(Array.isArray(response.files)).toBe(true);
    });

    it("should return one file item for one hash", () => {
      getFile({ hashes: [HASH_1] });

      const response = parseResponse();
      expect((response.files as unknown[]).length).toBe(1);
    });

    it("should return hash in file item", () => {
      getFile({ hashes: [HASH_1] });

      const files = parseResponse().files as Array<Record<string, unknown>>;
      expect(files[0].hash).toBe(HASH_1);
    });

    it("should return base64 data in file item", () => {
      getFile({ hashes: [HASH_1] });

      const files = parseResponse().files as Array<Record<string, unknown>>;
      expect(files[0].data).toBe(MOCK_BASE64);
    });

    it("should return mime_type in file item", () => {
      getFile({ hashes: [HASH_1] });

      const files = parseResponse().files as Array<Record<string, unknown>>;
      expect(files[0].mime_type).toBe(MOCK_MIME_TYPE);
    });

    it("should call DriveApp.getFileById with the Drive file id matched by hash", () => {
      getFile({ hashes: [HASH_1] });

      expect(DriveApp.getFileById).toHaveBeenCalledWith(MOCK_FILE_ID_1);
    });

    it("should encode file bytes with Utilities.base64Encode", () => {
      const mockBytes = [10, 20, 30];
      vi.mocked(DriveApp.getFileById).mockReturnValue({
        getBlob: () => ({
          getBytes: () => mockBytes,
          getContentType: () => MOCK_MIME_TYPE,
        }),
      } as never);

      getFile({ hashes: [HASH_1] });

      expect(Utilities.base64Encode).toHaveBeenCalledWith(mockBytes);
    });
  });

  describe("FILE_NOT_FOUND handling", () => {
    it("should return FILE_NOT_FOUND error in file item when file does not exist", () => {
      vi.mocked(DriveApp.getFileById).mockImplementation(() => {
        throw new Error("File not found");
      });

      getFile({ hashes: [HASH_1] });

      const files = parseResponse().files as Array<Record<string, unknown>>;
      expect(files[0].error).toBe(ERROR_CODES.FILE_NOT_FOUND);
    });

    it("should return hash in error file item", () => {
      vi.mocked(DriveApp.getFileById).mockImplementation(() => {
        throw new Error("File not found");
      });

      getFile({ hashes: [HASH_1] });

      const files = parseResponse().files as Array<Record<string, unknown>>;
      expect(files[0].hash).toBe(HASH_1);
    });

    it("should not return data when file does not exist", () => {
      vi.mocked(DriveApp.getFileById).mockImplementation(() => {
        throw new Error("File not found");
      });

      getFile({ hashes: [HASH_1] });

      const files = parseResponse().files as Array<Record<string, unknown>>;
      expect(files[0].data).toBeUndefined();
    });

    it("should still return ok: true even when a file is not found", () => {
      vi.mocked(DriveApp.getFileById).mockImplementation(() => {
        throw new Error("File not found");
      });

      getFile({ hashes: [HASH_1] });

      expect(parseResponse().ok).toBe(true);
    });
  });

  describe("batch retrieval", () => {
    it("should return two file items for two hashes", () => {
      getFile({ hashes: [HASH_1, HASH_2] });

      const files = parseResponse().files as Array<Record<string, unknown>>;
      expect(files.length).toBe(2);
    });

    it("should return partial success when some files exist and some do not", () => {
      vi.mocked(DriveApp.getFileById)
        .mockReturnValueOnce({
          getBlob: () => ({
            getBytes: () => [1, 2, 3],
            getContentType: () => MOCK_MIME_TYPE,
          }),
        } as never)
        .mockImplementationOnce(() => {
          throw new Error("File not found");
        });

      getFile({ hashes: [HASH_1, HASH_2] });

      const files = parseResponse().files as Array<Record<string, unknown>>;
      expect(files[0].data).toBe(MOCK_BASE64);
      expect(files[1].error).toBe(ERROR_CODES.FILE_NOT_FOUND);
    });

    it("should process remaining files after one fails", () => {
      vi.mocked(DriveApp.getFileById)
        .mockImplementationOnce(() => {
          throw new Error("File not found");
        })
        .mockReturnValueOnce({
          getBlob: () => ({
            getBytes: () => [1, 2, 3],
            getContentType: () => MOCK_MIME_TYPE,
          }),
        } as never);

      getFile({ hashes: [HASH_1, HASH_2] });

      const files = parseResponse().files as Array<Record<string, unknown>>;
      expect(files[0].error).toBe(ERROR_CODES.FILE_NOT_FOUND);
      expect(files[1].data).toBe(MOCK_BASE64);
    });

    it("should preserve hash order in response", () => {
      getFile({ hashes: [HASH_1, HASH_2] });

      const files = parseResponse().files as Array<Record<string, unknown>>;
      expect(files[0].hash).toBe(HASH_1);
      expect(files[1].hash).toBe(HASH_2);
    });
  });
});
