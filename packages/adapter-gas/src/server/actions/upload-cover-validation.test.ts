import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_FILE_SIZE_BYTES } from "../helpers/constants";
import { ERROR_CODES } from "../helpers/response";
import {
  expectErrorResponse,
  parseResponse,
  resetScriptProperties,
  setupUploadFileTests,
  validPayload,
} from "./upload-cover-test-utils";
import { uploadFile } from "./upload-file";

describe("uploadFile", () => {
  setupUploadFileTests();

  describe("mime_type validation", () => {
    it("should return INVALID_PAYLOAD error when mime_type is not allowed", () => {
      uploadFile({ ...validPayload, mime_type: "application/zip" });

      expectErrorResponse(ERROR_CODES.INVALID_PAYLOAD);
    });

    it("should not decode base64 when mime_type is invalid", () => {
      uploadFile({ ...validPayload, mime_type: "application/json" });

      expect(Utilities.base64Decode).not.toHaveBeenCalled();
    });

    it("should accept image/jpeg as valid mime_type", () => {
      // Default mock returns JPEG magic bytes [-1, -40, -1]
      uploadFile({ ...validPayload, mime_type: "image/jpeg" });

      expect(parseResponse().ok).toBe(true);
    });

    it("should accept image/png as valid mime_type", () => {
      // PNG magic bytes: 0x89, 0x50, 0x4E, 0x47 (signed: -119, 80, 78, 71)
      vi.mocked(Utilities.base64Decode).mockReturnValue([-119, 80, 78, 71]);
      uploadFile({ ...validPayload, mime_type: "image/png" });

      expect(parseResponse().ok).toBe(true);
    });

    it("should accept image/webp as valid mime_type", () => {
      // WEBP magic bytes (RIFF header): 0x52, 0x49, 0x46, 0x46
      vi.mocked(Utilities.base64Decode).mockReturnValue([
        0x52, 0x49, 0x46, 0x46,
      ]);
      uploadFile({ ...validPayload, mime_type: "image/webp" });

      expect(parseResponse().ok).toBe(true);
    });
  });

  describe("missing data field", () => {
    const payloadWithoutData = {
      goal_id: "goal-1",
      filename: "cover.jpg",
      mime_type: "image/jpeg",
    } as Parameters<typeof uploadFile>[0];

    it("should return INVALID_PAYLOAD error when data field is missing", () => {
      uploadFile(payloadWithoutData);

      expectErrorResponse(ERROR_CODES.INVALID_PAYLOAD);
    });

    it("should not call base64Decode when data field is missing", () => {
      uploadFile(payloadWithoutData);

      expect(Utilities.base64Decode).not.toHaveBeenCalled();
    });
  });

  describe("size validation", () => {
    it("should return FILE_TOO_LARGE error when decoded size exceeds limit", () => {
      vi.mocked(Utilities.base64Decode).mockReturnValue(
        new Array(MAX_FILE_SIZE_BYTES + 1).fill(0),
      );

      uploadFile(validPayload);

      expectErrorResponse(ERROR_CODES.FILE_TOO_LARGE);
    });

    it("should not return FILE_TOO_LARGE when decoded size is exactly at the limit", () => {
      const exactSizeData = new Array(MAX_FILE_SIZE_BYTES).fill(0);
      // JPEG magic bytes (signed GAS format): FF D8 FF
      exactSizeData[0] = -1;
      exactSizeData[1] = -40;
      exactSizeData[2] = -1;
      vi.mocked(Utilities.base64Decode).mockReturnValue(exactSizeData);

      uploadFile(validPayload);

      expect(parseResponse().ok).toBe(true);
    });

    it("should decode base64 data before checking size", () => {
      uploadFile(validPayload);

      expect(Utilities.base64Decode).toHaveBeenCalledWith(validPayload.data);
    });
  });

  describe("initialization check", () => {
    beforeEach(() => {
      resetScriptProperties();
      uploadFile(validPayload);
    });

    it("should return NOT_INITIALIZED when FILES_FOLDER_ID is not set", () => {
      expectErrorResponse(ERROR_CODES.NOT_INITIALIZED);
    });

    it("should not check for duplicates when not initialized", () => {
      expect(Drive.Files.list).not.toHaveBeenCalled();
    });
  });
});
