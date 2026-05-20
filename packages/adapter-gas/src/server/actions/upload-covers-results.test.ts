import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseResponse } from "../../../tests/server/helpers";
import { setupCoverMocks } from "../../../tests/server/helpers/cover-mocks";
import { setScriptProperty } from "../../../tests/server/setup/gas-mocks";
import { COVER_HASH_PREFIX_LENGTH, PROPERTY_KEYS } from "../helpers/constants";
import { uploadCovers } from "./upload-covers";

const MOCK_HASH = "00".repeat(32);
const MOCK_HASH_PREFIX = "0".repeat(COVER_HASH_PREFIX_LENGTH);

const validCover = {
  local_id: "local-uuid-1",
  goal_id: "goal-uuid-1",
  filename: "cover.jpg",
  mime_type: "image/jpeg",
  data: "base64_encoded_data",
};

function parseResults(): Array<Record<string, unknown>> {
  return parseResponse().results as Array<Record<string, unknown>>;
}

describe("uploadCovers", () => {
  beforeEach(() => {
    setupCoverMocks();
  });

  describe("results array", () => {
    it("should return ok: true with results array", () => {
      uploadCovers({ covers: [validCover] });

      const response = parseResponse();
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.results)).toBe(true);
    });

    it("should return one result per input cover", () => {
      const covers = [
        { ...validCover, local_id: "local-1", goal_id: "goal-1" },
        { ...validCover, local_id: "local-2", goal_id: "goal-2" },
      ];

      uploadCovers({ covers });

      expect((parseResponse().results as unknown[]).length).toBe(2);
    });

    it("should echo local_id in each result", () => {
      uploadCovers({ covers: [{ ...validCover, local_id: "my-local-id" }] });

      const results = parseResults();
      expect(results[0].local_id).toBe("my-local-id");
    });

    it("should echo goal_id in each result", () => {
      uploadCovers({ covers: [{ ...validCover, goal_id: "my-goal-id" }] });

      const results = parseResults();
      expect(results[0].goal_id).toBe("my-goal-id");
    });
  });

  describe("successful upload", () => {
    it("should return file_id and reused: false for new upload", () => {
      uploadCovers({ covers: [validCover] });

      const results = parseResults();
      expect(results[0].file_id).toBe("new-file-id");
      expect(results[0].reused).toBe(false);
    });

    it("should return reused: true when cover with matching hash already exists", () => {
      vi.mocked(Drive.Files.list).mockReturnValue({
        files: [{ id: "existing-file-id", description: MOCK_HASH }],
      });

      uploadCovers({ covers: [validCover] });

      const results = parseResults();
      expect(results[0].reused).toBe(true);
      expect(results[0].file_id).toBe("existing-file-id");
    });

    it("should name new file using hash prefix and extension", () => {
      uploadCovers({ covers: [{ ...validCover, filename: "photo.png" }] });

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: `${MOCK_HASH_PREFIX}.png` }),
        expect.anything(),
      );
    });

    it("should set public reader permissions on newly created file", () => {
      uploadCovers({ covers: [validCover] });

      expect(Drive.Permissions.create).toHaveBeenCalledWith(
        { role: "reader", type: "anyone" },
        "new-file-id",
      );
    });
  });

  describe("Drive.Files.list call optimization", () => {
    it("should call Drive.Files.list exactly once regardless of covers count", () => {
      const covers = [
        { ...validCover, local_id: "local-1", goal_id: "goal-1" },
        { ...validCover, local_id: "local-2", goal_id: "goal-2" },
        { ...validCover, local_id: "local-3", goal_id: "goal-3" },
      ];

      uploadCovers({ covers });

      expect(Drive.Files.list).toHaveBeenCalledTimes(1);
    });

    it("should search in the correct covers folder", () => {
      setScriptProperty(PROPERTY_KEYS.COVERS_FOLDER_ID, "my-covers-folder");

      uploadCovers({ covers: [validCover] });

      expect(Drive.Files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining("my-covers-folder"),
        }),
      );
    });
  });
});
