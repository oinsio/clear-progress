import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseResponse } from "../../../tests/server/helpers";
import { setupFileMocks } from "../../../tests/server/helpers/cover-mocks";
import { setScriptProperty } from "../../../tests/server/setup/gas-mocks";
import { FILE_HASH_PREFIX_LENGTH, PROPERTY_KEYS } from "../helpers/constants";
import { uploadFiles } from "./upload-files";

const MOCK_HASH = "00".repeat(32);
const MOCK_HASH_PREFIX = "0".repeat(FILE_HASH_PREFIX_LENGTH);

const validFile = {
  local_id: "local-uuid-1",
  goal_id: "goal-uuid-1",
  filename: "cover.jpg",
  mime_type: "image/jpeg",
  data: "base64_encoded_data",
};

function parseResults(): Array<Record<string, unknown>> {
  return parseResponse().results as Array<Record<string, unknown>>;
}

describe("uploadFiles", () => {
  beforeEach(() => {
    setupFileMocks();
  });

  describe("results array", () => {
    it("should return ok: true with results array", () => {
      uploadFiles({ files: [validFile] });

      const response = parseResponse();
      expect(response.ok).toBe(true);
      expect(Array.isArray(response.results)).toBe(true);
    });

    it("should return one result per input file", () => {
      const files = [
        { ...validFile, local_id: "local-1", goal_id: "goal-1" },
        { ...validFile, local_id: "local-2", goal_id: "goal-2" },
      ];

      uploadFiles({ files });

      expect((parseResponse().results as unknown[]).length).toBe(2);
    });

    it("should echo local_id in each result", () => {
      uploadFiles({ files: [{ ...validFile, local_id: "my-local-id" }] });

      const results = parseResults();
      expect(results[0].local_id).toBe("my-local-id");
    });

    it("should echo goal_id in each result", () => {
      uploadFiles({ files: [{ ...validFile, goal_id: "my-goal-id" }] });

      const results = parseResults();
      expect(results[0].goal_id).toBe("my-goal-id");
    });
  });

  describe("successful upload", () => {
    it("should return data_hash and reused: false for new upload", () => {
      uploadFiles({ files: [validFile] });

      const results = parseResults();
      expect(results[0].data_hash).toBe(MOCK_HASH);
      expect(results[0].reused).toBe(false);
    });

    it("should return reused: true when file with matching hash already exists", () => {
      vi.mocked(Drive.Files.list).mockReturnValue({
        files: [{ id: "existing-file-id", description: MOCK_HASH }],
      });

      uploadFiles({ files: [validFile] });

      const results = parseResults();
      expect(results[0].reused).toBe(true);
      expect(results[0].data_hash).toBe(MOCK_HASH);
    });

    it("should name new file using hash prefix and extension", () => {
      uploadFiles({ files: [{ ...validFile, filename: "photo.png" }] });

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: `${MOCK_HASH_PREFIX}.png` }),
        expect.anything(),
      );
    });

    it("should set public reader permissions on newly created file", () => {
      uploadFiles({ files: [validFile] });

      expect(Drive.Permissions.create).toHaveBeenCalledWith(
        { role: "reader", type: "anyone" },
        "new-file-id",
      );
    });
  });

  describe("Drive.Files.list call optimization", () => {
    it("should call Drive.Files.list exactly once regardless of files count", () => {
      const files = [
        { ...validFile, local_id: "local-1", goal_id: "goal-1" },
        { ...validFile, local_id: "local-2", goal_id: "goal-2" },
        { ...validFile, local_id: "local-3", goal_id: "goal-3" },
      ];

      uploadFiles({ files });

      expect(Drive.Files.list).toHaveBeenCalledTimes(1);
    });

    it("should search in the correct files folder", () => {
      setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, "my-files-folder");

      uploadFiles({ files: [validFile] });

      expect(Drive.Files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining("my-files-folder"),
        }),
      );
    });
  });
});
