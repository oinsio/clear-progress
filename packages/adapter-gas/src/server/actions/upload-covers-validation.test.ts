import { beforeEach, describe, expect, it } from "vitest";
import { parseResponse } from "../../../tests/server/helpers";
import { setupCoverMocks } from "../../../tests/server/helpers/cover-mocks";
import { resetScriptProperties } from "../../../tests/server/setup/gas-mocks";
import { MAX_COVER_BATCH_SIZE } from "../helpers/constants";
import { ERROR_CODES } from "../helpers/response";
import { uploadCovers } from "./upload-covers";

const validCover = {
  local_id: "local-uuid-1",
  goal_id: "goal-uuid-1",
  filename: "cover.jpg",
  mime_type: "image/jpeg",
  data: "base64_encoded_data",
};

describe("uploadCovers", () => {
  beforeEach(() => {
    setupCoverMocks();
  });

  describe("payload validation", () => {
    it("should return INVALID_PAYLOAD when covers is not an array", () => {
      uploadCovers({ covers: "not-an-array" as never });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it("should return INVALID_PAYLOAD when covers is an empty array", () => {
      uploadCovers({ covers: [] });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it("should return INVALID_PAYLOAD when covers.length exceeds MAX_COVER_BATCH_SIZE", () => {
      const tooManyCovers = Array(MAX_COVER_BATCH_SIZE + 1).fill(validCover);

      uploadCovers({ covers: tooManyCovers });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
    });

    it("should accept covers.length === MAX_COVER_BATCH_SIZE (boundary)", () => {
      const covers = Array(MAX_COVER_BATCH_SIZE)
        .fill(null)
        .map((_, i) => ({
          ...validCover,
          local_id: `local-${i}`,
          goal_id: `goal-${i}`,
        }));

      uploadCovers({ covers });

      expect(parseResponse().ok).toBe(true);
    });

    it("should not call Drive.Files.list when covers array is empty", () => {
      uploadCovers({ covers: [] });

      expect(Drive.Files.list).not.toHaveBeenCalled();
    });
  });

  describe("initialization check", () => {
    it("should return NOT_INITIALIZED when COVERS_FOLDER_ID is not set", () => {
      resetScriptProperties();

      uploadCovers({ covers: [validCover] });

      const response = parseResponse();
      expect(response.ok).toBe(false);
      expect(response.error).toBe(ERROR_CODES.NOT_INITIALIZED);
    });

    it("should not call Drive.Files.list when not initialized", () => {
      resetScriptProperties();

      uploadCovers({ covers: [validCover] });

      expect(Drive.Files.list).not.toHaveBeenCalled();
    });
  });
});
