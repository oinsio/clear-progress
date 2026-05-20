import { describe, expect, it, vi } from "vitest";
import { PROPERTY_KEYS } from "../helpers/constants";
import { uploadCover } from "./upload-cover";
import {
  DEFAULT_COVERS_FOLDER_ID,
  MOCK_HASH,
  MOCK_HASH_PREFIX,
  mockExistingCover,
  parseResponse,
  setScriptProperty,
  setupUploadCoverTests,
  validPayload,
} from "./upload-cover-test-utils";

describe("uploadCover", () => {
  setupUploadCoverTests();

  describe("deduplication (file already exists)", () => {
    it("should return reused: true when file with matching hash exists", () => {
      mockExistingCover();

      uploadCover(validPayload);

      expect(parseResponse().reused).toBe(true);
    });

    it("should return existing file_id when duplicate found", () => {
      mockExistingCover();

      uploadCover(validPayload);

      expect(parseResponse().file_id).toBe("existing-file-id");
    });

    it("should not create a new file when duplicate found", () => {
      mockExistingCover();

      uploadCover(validPayload);

      expect(Drive.Files.create).not.toHaveBeenCalled();
    });

    it("should not reuse a file whose hash does not match", () => {
      vi.mocked(Drive.Files.list).mockReturnValue({
        files: [{ id: "other-file-id", description: "different-hash" }],
      });

      uploadCover(validPayload);

      expect(parseResponse().reused).toBe(false);
    });

    it("should search for duplicates in the correct covers folder", () => {
      setScriptProperty(PROPERTY_KEYS.COVERS_FOLDER_ID, "my-covers-folder");

      uploadCover(validPayload);

      expect(Drive.Files.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.stringContaining("my-covers-folder"),
        }),
      );
    });
  });

  describe("new file upload", () => {
    it("should return ok: true for a new upload", () => {
      uploadCover(validPayload);

      expect(parseResponse().ok).toBe(true);
    });

    it("should return reused: false for a new upload", () => {
      uploadCover(validPayload);

      expect(parseResponse().reused).toBe(false);
    });

    it("should return file_id of newly created file", () => {
      vi.mocked(Drive.Files.create).mockReturnValue({ id: "new-file-id" });

      uploadCover(validPayload);

      expect(parseResponse().file_id).toBe("new-file-id");
    });

    it("should upload new file to the covers folder", () => {
      uploadCover(validPayload);

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ parents: [DEFAULT_COVERS_FOLDER_ID] }),
        expect.anything(),
      );
    });

    it("should store the content hash as the file description", () => {
      uploadCover(validPayload);

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: MOCK_HASH }),
        expect.anything(),
      );
    });

    it("should correctly convert negative digest bytes to unsigned hex", () => {
      // GAS computeDigest returns signed bytes; -1 → 255 → 'ff', -128 → 128 → '80'
      vi.mocked(Utilities.computeDigest).mockReturnValue([
        -1,
        -128,
        ...Array(30).fill(0),
      ] as never);

      uploadCover(validPayload);

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: `ff80${"00".repeat(30)}` }),
        expect.anything(),
      );
    });

    it("should use hash prefix as the base of new filename", () => {
      uploadCover(validPayload);

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining(MOCK_HASH_PREFIX),
        }),
        expect.anything(),
      );
    });

    it("should use only the hash prefix length in the filename, not the full hash", () => {
      uploadCover({ ...validPayload, filename: "cover.jpg" });

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: `${MOCK_HASH_PREFIX}.jpg` }),
        expect.anything(),
      );
    });

    it("should use extension from original filename", () => {
      uploadCover({ ...validPayload, filename: "photo.png" });

      expect(Drive.Files.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: expect.stringMatching(/\.png$/) }),
        expect.anything(),
      );
    });

    it("should create blob with correct mime_type and filename", () => {
      uploadCover(validPayload);

      expect(Utilities.newBlob).toHaveBeenCalledWith(
        expect.anything(),
        validPayload.mime_type,
        expect.any(String),
      );
    });

    it("should set public reader permissions on new file", () => {
      vi.mocked(Drive.Files.create).mockReturnValue({ id: "new-file-id" });

      uploadCover(validPayload);

      expect(Drive.Permissions.create).toHaveBeenCalledWith(
        { role: "reader", type: "anyone" },
        "new-file-id",
      );
    });
  });
});
