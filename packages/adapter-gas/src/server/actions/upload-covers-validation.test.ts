import { beforeEach, describe, expect, it } from "vitest";
import { parseResponse } from "../../../tests/server/helpers";
import { setupFileMocks } from "../../../tests/server/helpers/cover-mocks";
import { resetScriptProperties } from "../../../tests/server/setup/gas-mocks";
import { MAX_FILE_BATCH_SIZE } from "../helpers/constants";
import { ERROR_CODES } from "../helpers/response";
import { uploadFiles } from "./upload-files";

const validFile = {
  local_id: "local-uuid-1",
  goal_id: "goal-uuid-1",
  filename: "cover.jpg",
  mime_type: "image/jpeg",
  data: "base64_encoded_data",
};

describe("uploadFiles", () => {
  beforeEach(() => {
    setupFileMocks();
  });

  describe("payload validation", () => {
    it("should return INVALID_PAYLOAD when files is not an array", () => {
      uploadFiles({ files: "not-an-array" as never });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it("should return INVALID_PAYLOAD when files is an empty array", () => {
      uploadFiles({ files: [] });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it("should return INVALID_PAYLOAD when files.length exceeds MAX_FILE_BATCH_SIZE", () => {
      const tooManyFiles = Array(MAX_FILE_BATCH_SIZE + 1).fill(validFile);

      uploadFiles({ files: tooManyFiles });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it("should accept files.length === MAX_FILE_BATCH_SIZE (boundary)", () => {
      const files = Array(MAX_FILE_BATCH_SIZE)
        .fill(null)
        .map((_, i) => ({
          ...validFile,
          local_id: `local-${i}`,
          goal_id: `goal-${i}`,
        }));

      uploadFiles({ files });

      expect(parseResponse().ok).toBe(true);
    });

    it("should not call Drive.Files.list when files array is empty", () => {
      uploadFiles({ files: [] });

      expect(Drive.Files.list).not.toHaveBeenCalled();
    });
  });

  describe("initialization check", () => {
    it("should return NOT_INITIALIZED when FILES_FOLDER_ID is not set", () => {
      resetScriptProperties();

      uploadFiles({ files: [validFile] });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.NOT_INITIALIZED);
    });

    it("should not call Drive.Files.list when not initialized", () => {
      resetScriptProperties();

      uploadFiles({ files: [validFile] });

      expect(Drive.Files.list).not.toHaveBeenCalled();
    });
  });
});
