import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  driveFileExists,
  getScriptPropertiesStore,
  init,
  initDefaults,
  MOCK_SPREADSHEET_ID,
  PROPERTY_KEYS,
  parseResponse,
  resetAndClear,
  setScriptProperty,
  setupAlreadyInitializedWithLegacyGoalsSheet,
  setupFirstTimeInit,
} from "./init-test-utils";

vi.mock("../helpers/drive", () => ({ driveFileExists: vi.fn() }));
vi.mock("../sheets/settings.sheet", () => ({ initDefaults: vi.fn() }));
vi.mock("../sheets/meta.sheet", () => ({ initMetaSheet: vi.fn() }));

describe("init — already initialized", () => {
  beforeEach(() => {
    resetAndClear();
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, MOCK_SPREADSHEET_ID);
    vi.mocked(driveFileExists).mockReturnValue(true);
    // Provide a minimal spreadsheet mock so migration finds no Goals sheet
    vi.mocked(SpreadsheetApp.openById).mockReturnValue({
      getSheetByName: vi.fn().mockReturnValue(null),
    } as never);
  });

  it("should return ok: true, created: false, spreadsheet_id when already initialized", () => {
    init();
    const response = parseResponse();
    expect(response.ok).toBe(true);
    expect(response.created).toBe(false);
    expect(response.spreadsheet_id).toBe(MOCK_SPREADSHEET_ID);
  });

  it("should not call Drive.Files.create when already initialized", () => {
    init();
    expect(Drive.Files.create).not.toHaveBeenCalled();
  });
});

describe("init — stale property (file deleted)", () => {
  beforeEach(() => {
    resetAndClear();
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, "stale-spreadsheet-id");
    vi.mocked(driveFileExists).mockReturnValue(false);
    vi.mocked(initDefaults).mockReturnValue(undefined);
    setupFirstTimeInit();
  });

  it("should clear stale properties and save new spreadsheet_id", () => {
    init();
    const store = getScriptPropertiesStore();
    expect(store[PROPERTY_KEYS.SPREADSHEET_ID]).toBe(MOCK_SPREADSHEET_ID);
  });

  it("should call Drive.Files.create 3 times when stale property found", () => {
    init();
    expect(Drive.Files.create).toHaveBeenCalledTimes(3);
  });
});

// implements FR7 of content-addressable-covers
describe("init — auto-migration: cover_file_id → cover_hash", () => {
  beforeEach(() => {
    resetAndClear();
    setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, MOCK_SPREADSHEET_ID);
    vi.mocked(driveFileExists).mockReturnValue(true);
  });

  it("should rename cover_file_id header to cover_hash after migration", () => {
    const { headerCellMock } = setupAlreadyInitializedWithLegacyGoalsSheet([
      ["file-abc"],
    ]);
    init();
    expect(headerCellMock.setValue).toHaveBeenCalledWith("cover_hash");
  });

  it("should write hash from Drive file description into data cell", () => {
    const { dataCellMock } = setupAlreadyInitializedWithLegacyGoalsSheet([
      ["file-abc"],
    ]);
    vi.mocked(Drive.Files.get).mockReturnValue({ description: "sha256hash" });
    init();
    expect(dataCellMock.setValues).toHaveBeenCalledWith([["sha256hash"]]);
  });

  it("should call Drive.Files.get with file ID from data cell", () => {
    setupAlreadyInitializedWithLegacyGoalsSheet([["file-abc"]]);
    vi.mocked(Drive.Files.get).mockReturnValue({ description: "sha256hash" });
    init();
    expect(Drive.Files.get).toHaveBeenCalledWith("file-abc", {
      fields: "description",
    });
  });

  it("should write empty string when Drive file lookup throws", () => {
    const { dataCellMock } = setupAlreadyInitializedWithLegacyGoalsSheet([
      ["bad-file-id"],
    ]);
    vi.mocked(Drive.Files.get).mockImplementation(() => {
      throw new Error("not found");
    });
    init();
    expect(dataCellMock.setValues).toHaveBeenCalledWith([[""]]);
  });

  it("should skip Drive lookup for rows with empty file ID", () => {
    setupAlreadyInitializedWithLegacyGoalsSheet([[""]]);
    init();
    expect(Drive.Files.get).not.toHaveBeenCalled();
  });

  it("should not rename header or write data when cover_file_id header is absent", () => {
    const { headerCellMock, dataCellMock } =
      setupAlreadyInitializedWithLegacyGoalsSheet([], false);
    init();
    expect(headerCellMock.setValue).not.toHaveBeenCalled();
    expect(dataCellMock.setValues).not.toHaveBeenCalled();
  });

  it("should not open spreadsheet when driveFileExists returns false", () => {
    vi.mocked(driveFileExists).mockReturnValue(false);
    vi.mocked(initDefaults).mockReturnValue(undefined);
    setupFirstTimeInit();
    init();
    // SpreadsheetApp.openById called only once (for new spreadsheet creation)
    expect(SpreadsheetApp.openById).toHaveBeenCalledTimes(1);
  });
});
