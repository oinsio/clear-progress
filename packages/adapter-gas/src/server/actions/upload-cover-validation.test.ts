import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_COVER_SIZE_BYTES } from "../helpers/constants";
import { ERROR_CODES } from "../helpers/response";
import { uploadCover } from "./upload-cover";
import {
  expectErrorResponse,
  parseResponse,
  resetScriptProperties,
  setupUploadCoverTests,
  validPayload,
} from "./upload-cover-test-utils";

describe("uploadCover", () => {
  setupUploadCoverTests();

  describe("mime_type validation", () => {
    it("should return INVALID_PAYLOAD error when mime_type is not an image type", () => {
      uploadCover({ ...validPayload, mime_type: "application/pdf" });

      expectErrorResponse(
        ERROR_CODES.INVALID_PAYLOAD,
        "mime_type must be an image type (image/*)",
      );
    });

    it("should not decode base64 when mime_type is invalid", () => {
      uploadCover({ ...validPayload, mime_type: "application/json" });

      expect(Utilities.base64Decode).not.toHaveBeenCalled();
    });

    it.each([
      "image/jpeg",
      "image/png",
      "image/webp",
    ])("should accept %s as valid mime_type", (mimeType) => {
      uploadCover({ ...validPayload, mime_type: mimeType });

      expect(parseResponse().ok).toBe(true);
    });
  });

  describe("missing data field", () => {
    const payloadWithoutData = {
      goal_id: "goal-1",
      filename: "cover.jpg",
      mime_type: "image/jpeg",
    } as Parameters<typeof uploadCover>[0];

    it("should return INVALID_PAYLOAD error when data field is missing", () => {
      uploadCover(payloadWithoutData);

      expectErrorResponse(ERROR_CODES.INVALID_PAYLOAD);
    });

    it("should not call base64Decode when data field is missing", () => {
      uploadCover(payloadWithoutData);

      expect(Utilities.base64Decode).not.toHaveBeenCalled();
    });
  });

  describe("size validation", () => {
    it("should return FILE_TOO_LARGE error when decoded size exceeds limit", () => {
      vi.mocked(Utilities.base64Decode).mockReturnValue(
        new Array(MAX_COVER_SIZE_BYTES + 1).fill(0),
      );

      uploadCover(validPayload);

      expectErrorResponse(ERROR_CODES.FILE_TOO_LARGE);
    });

    it("should not return FILE_TOO_LARGE when decoded size is exactly at the limit", () => {
      vi.mocked(Utilities.base64Decode).mockReturnValue(
        new Array(MAX_COVER_SIZE_BYTES).fill(0),
      );

      uploadCover(validPayload);

      expect(parseResponse().ok).toBe(true);
    });

    it("should decode base64 data before checking size", () => {
      uploadCover(validPayload);

      expect(Utilities.base64Decode).toHaveBeenCalledWith(validPayload.data);
    });
  });

  describe("initialization check", () => {
    beforeEach(() => {
      resetScriptProperties();
      uploadCover(validPayload);
    });

    it("should return NOT_INITIALIZED when COVERS_FOLDER_ID is not set", () => {
      expectErrorResponse(ERROR_CODES.NOT_INITIALIZED);
    });

    it("should not check for duplicates when not initialized", () => {
      expect(Drive.Files.list).not.toHaveBeenCalled();
    });
  });
});
