import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteFile } from "../../../src/server/actions/delete-file";
import { PROPERTY_KEYS } from "../../../src/server/helpers/constants";
import { ERROR_CODES } from "../../../src/server/helpers/response";
import { parseResponse } from "../helpers";
import { resetScriptProperties, setScriptProperty } from "../setup/gas-mocks";

vi.mock("../../../src/server/sheets/goals.sheet", () => ({
  getCoverHashes: vi.fn().mockReturnValue([]),
}));

vi.mock("../../../src/server/sheets/attachments.sheet", () => ({
  getDataHashes: vi.fn().mockReturnValue([]),
}));

const { getCoverHashes } = await import(
  "../../../src/server/sheets/goals.sheet"
);

const { getDataHashes } = await import(
  "../../../src/server/sheets/attachments.sheet"
);

describe("deleteFile action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
    vi.mocked(getCoverHashes).mockReturnValue([]);
    vi.mocked(getDataHashes).mockReturnValue([]);
  });

  it("should return error when hash is empty", () => {
    deleteFile({ hash: "" });
    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INVALID_PAYLOAD);
  });

  it("should return deleted: false when hash is still referenced", () => {
    vi.mocked(getCoverHashes).mockReturnValue(["hash-abc", "hash-abc"]);

    deleteFile({ hash: "hash-abc" });
    const response = parseResponse();
    expect(response.ok).toBe(true);
    expect(response.deleted).toBe(false);
    expect(response.ref_count).toBe(2);
  });

  it("should return NOT_INITIALIZED when files folder not set", () => {
    deleteFile({ hash: "hash-abc" });
    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.NOT_INITIALIZED);
  });

  it("should delete file when hash is unreferenced", () => {
    setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, "folder-id");
    vi.mocked(Drive.Files.list).mockReturnValue({
      files: [{ id: "file-1", description: "hash-abc" }],
    } as never);

    deleteFile({ hash: "hash-abc" });
    const response = parseResponse();
    expect(response.ok).toBe(true);
    expect(response.deleted).toBe(true);
    expect(response.ref_count).toBe(0);
    expect(Drive.Files.update).toHaveBeenCalledWith(
      { trashed: true },
      "file-1",
    );
  });

  it("should return FILE_NOT_FOUND when file not in Drive", () => {
    setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, "folder-id");
    vi.mocked(Drive.Files.list).mockReturnValue({ files: [] } as never);

    deleteFile({ hash: "hash-abc" });
    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.FILE_NOT_FOUND);
  });

  it("should return FILE_NOT_FOUND when matched file has no id", () => {
    setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, "folder-id");
    vi.mocked(Drive.Files.list).mockReturnValue({
      files: [{ description: "hash-abc" }],
    } as never);

    deleteFile({ hash: "hash-abc" });
    const response = parseResponse();
    expect(response.error).toBe(ERROR_CODES.FILE_NOT_FOUND);
  });

  it("should return FILE_NOT_FOUND when Drive.Files.update throws", () => {
    setScriptProperty(PROPERTY_KEYS.FILES_FOLDER_ID, "folder-id");
    vi.mocked(Drive.Files.list).mockReturnValue({
      files: [{ id: "file-1", description: "hash-abc" }],
    } as never);
    vi.mocked(Drive.Files.update).mockImplementation(() => {
      throw new Error("access denied");
    });

    deleteFile({ hash: "hash-abc" });
    const response = parseResponse();
    expect(response.error).toBe(ERROR_CODES.FILE_NOT_FOUND);
  });
});
