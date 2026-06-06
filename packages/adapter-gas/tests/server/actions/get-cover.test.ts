import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFile } from "../../../src/server/actions/get-file";
import { PROPERTY_KEYS } from "../../../src/server/helpers/constants";
import { ERROR_CODES } from "../../../src/server/helpers/response";
import { parseResponse } from "../helpers";
import { resetScriptProperties, setScriptProperty } from "../setup/gas-mocks";

describe("getFile action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
  });

  it("should return NOT_INITIALIZED when files folder not set", () => {
    getFile({ hashes: ["abc"] });
    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.NOT_INITIALIZED);
  });

  it("should return file data for matching hash", () => {
    setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, "folder-id");
    vi.mocked(Drive.Files.list).mockReturnValue({
      files: [{ id: "file-1", description: "hash-abc" }],
    } as never);

    const mockBlob = {
      getBytes: vi.fn().mockReturnValue([1, 2, 3]),
      getContentType: vi.fn().mockReturnValue("image/png"),
    };
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getBlob: vi.fn().mockReturnValue(mockBlob),
    } as never);
    vi.mocked(Utilities.base64Encode).mockReturnValue("AQID");

    getFile({ hashes: ["hash-abc"] });
    const response = parseResponse();
    expect(response.ok).toBe(true);
    const files = response.files as Array<Record<string, unknown>>;
    expect(files).toHaveLength(1);
    expect(files[0].hash).toBe("hash-abc");
    expect(files[0].data).toBe("AQID");
    expect(files[0].mime_type).toBe("image/png");
  });

  it("should return FILE_NOT_FOUND for non-matching hash", () => {
    setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, "folder-id");
    vi.mocked(Drive.Files.list).mockReturnValue({ files: [] } as never);

    getFile({ hashes: ["unknown-hash"] });
    const response = parseResponse();
    const files = response.files as Array<Record<string, unknown>>;
    expect(files[0].error).toBe(ERROR_CODES.FILE_NOT_FOUND);
  });

  it("should return FILE_NOT_FOUND when file has no id", () => {
    setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, "folder-id");
    vi.mocked(Drive.Files.list).mockReturnValue({
      files: [{ description: "hash-abc" }],
    } as never);

    getFile({ hashes: ["hash-abc"] });
    const response = parseResponse();
    const files = response.files as Array<Record<string, unknown>>;
    expect(files[0].error).toBe(ERROR_CODES.FILE_NOT_FOUND);
  });

  it("should handle DriveApp error gracefully", () => {
    setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, "folder-id");
    vi.mocked(Drive.Files.list).mockReturnValue({
      files: [{ id: "file-1", description: "hash-abc" }],
    } as never);
    vi.mocked(DriveApp.getFileById).mockImplementation(() => {
      throw new Error("access denied");
    });

    getFile({ hashes: ["hash-abc"] });
    const response = parseResponse();
    const files = response.files as Array<Record<string, unknown>>;
    expect(files[0].error).toBe(ERROR_CODES.FILE_NOT_FOUND);
  });

  it("should handle file with null content type", () => {
    setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, "folder-id");
    vi.mocked(Drive.Files.list).mockReturnValue({
      files: [{ id: "file-1", description: "hash-abc" }],
    } as never);

    const mockBlob = {
      getBytes: vi.fn().mockReturnValue([]),
      getContentType: vi.fn().mockReturnValue(null),
    };
    vi.mocked(DriveApp.getFileById).mockReturnValue({
      getBlob: vi.fn().mockReturnValue(mockBlob),
    } as never);

    getFile({ hashes: ["hash-abc"] });
    const response = parseResponse();
    const files = response.files as Array<Record<string, unknown>>;
    expect(files[0].mime_type).toBeUndefined();
  });
});
