import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DRIVE_FOLDER_NAMES,
  DRIVE_MIME_TYPES,
  driveFileExists,
  getScriptPropertiesStore,
  init,
  initDefaults,
  initMetaSheet,
  MOCK_ROOT_FOLDER_ID,
  MOCK_SPREADSHEET_ID,
  PROPERTY_KEYS,
  parseResponse,
  resetAndClear,
  SHEET_HEADERS,
  SHEET_NAMES,
  setupFirstTimeInit,
} from "./init-test-utils";

vi.mock("../helpers/drive", () => ({ driveFileExists: vi.fn() }));
vi.mock("../sheets/settings.sheet", () => ({ initDefaults: vi.fn() }));
vi.mock("../sheets/meta.sheet", () => ({ initMetaSheet: vi.fn() }));

describe("init — first time setup", () => {
  let defaultSheet: ReturnType<typeof setupFirstTimeInit>["defaultSheet"];
  let insertedSheets: ReturnType<typeof setupFirstTimeInit>["insertedSheets"];
  let spreadsheetMock: ReturnType<typeof setupFirstTimeInit>["spreadsheetMock"];

  beforeEach(() => {
    resetAndClear();
    vi.mocked(initDefaults).mockReturnValue(undefined);
    const mocks = setupFirstTimeInit();
    defaultSheet = mocks.defaultSheet;
    insertedSheets = mocks.insertedSheets;
    spreadsheetMock = mocks.spreadsheetMock;
  });

  it("should create root folder with correct name and mimeType", () => {
    init();
    expect(vi.mocked(Drive.Files.create).mock.calls[0][0]).toMatchObject({
      name: DRIVE_FOLDER_NAMES.ROOT,
      mimeType: DRIVE_MIME_TYPES.FOLDER,
    });
  });

  it("should create files folder inside root folder", () => {
    init();
    expect(vi.mocked(Drive.Files.create).mock.calls[1][0]).toMatchObject({
      name: DRIVE_FOLDER_NAMES.FILES,
      mimeType: DRIVE_MIME_TYPES.FOLDER,
      parents: [MOCK_ROOT_FOLDER_ID],
    });
  });

  it("should create spreadsheet file inside root folder", () => {
    init();
    expect(vi.mocked(Drive.Files.create).mock.calls[2][0]).toMatchObject({
      name: DRIVE_FOLDER_NAMES.DATA_FILE,
      mimeType: DRIVE_MIME_TYPES.SPREADSHEET,
      parents: [MOCK_ROOT_FOLDER_ID],
    });
  });

  it("should open spreadsheet by id returned from Drive", () => {
    init();
    expect(SpreadsheetApp.openById).toHaveBeenCalledWith("spreadsheet-file-id");
  });

  it("should rename default sheet to the first sheet name", () => {
    init();
    const firstSheetName = Object.keys(SHEET_HEADERS)[0];
    expect(defaultSheet.setName).toHaveBeenCalledWith(firstSheetName);
  });

  it("should insert N-1 additional sheets with correct names", () => {
    init();
    const sheetNames = Object.keys(SHEET_HEADERS);
    sheetNames.slice(1).forEach((sheetName) => {
      expect(spreadsheetMock.insertSheet).toHaveBeenCalledWith(sheetName);
    });
    expect(spreadsheetMock.insertSheet).toHaveBeenCalledTimes(
      sheetNames.length - 1,
    );
  });

  it("should set headers on the first (renamed) sheet", () => {
    init();
    const firstSheetName = Object.keys(SHEET_HEADERS)[0];
    const headers = SHEET_HEADERS[firstSheetName];
    expect(defaultSheet.getRange).toHaveBeenCalledWith(1, 1, 1, headers.length);
    const rangeInstance = vi.mocked(defaultSheet.getRange).mock.results[0]
      .value;
    expect(rangeInstance.setValues).toHaveBeenCalledWith([headers]);
  });

  it("should set headers on each inserted sheet", () => {
    init();
    const sheetNames = Object.keys(SHEET_HEADERS);
    insertedSheets.forEach((sheetMock, index) => {
      const sheetName = sheetNames[index + 1];
      const headers = SHEET_HEADERS[sheetName];
      expect(sheetMock.getRange).toHaveBeenCalledWith(1, 1, 1, headers.length);
      const rangeInstance = vi.mocked(sheetMock.getRange).mock.results[0].value;
      expect(rangeInstance.setValues).toHaveBeenCalledWith([headers]);
    });
  });

  it("should save SPREADSHEET_ID, FOLDER_ID, FILES_FOLDER_ID to PropertiesService", () => {
    init();
    const store = getScriptPropertiesStore();
    expect(store[PROPERTY_KEYS.SPREADSHEET_ID]).toBe(MOCK_SPREADSHEET_ID);
    expect(store[PROPERTY_KEYS.FOLDER_ID]).toBe(MOCK_ROOT_FOLDER_ID);
    expect(store[PROPERTY_KEYS.FILES_FOLDER_ID]).toBe("covers-folder-id");
  });

  it("should call initDefaults once", () => {
    init();
    expect(initDefaults).toHaveBeenCalledTimes(1);
  });

  it("should call initMetaSheet once", () => {
    init();
    expect(initMetaSheet).toHaveBeenCalledTimes(1);
  });

  it('should include "revision" column in Tasks sheet headers', () => {
    expect(SHEET_HEADERS[SHEET_NAMES.TASKS]).toContain("revision");
  });

  it('should include "revision" column in Goals sheet headers', () => {
    expect(SHEET_HEADERS[SHEET_NAMES.GOALS]).toContain("revision");
  });

  it("should return created: true with spreadsheet_id and folder_id", () => {
    init();
    const response = parseResponse();
    expect(response.ok).toBe(true);
    expect(response.created).toBe(true);
    expect(response.spreadsheet_id).toBe(MOCK_SPREADSHEET_ID);
    expect(response.folder_id).toBe(MOCK_ROOT_FOLDER_ID);
  });

  it("should not call driveFileExists when SPREADSHEET_ID is not set", () => {
    init();
    expect(driveFileExists).not.toHaveBeenCalled();
  });
});
