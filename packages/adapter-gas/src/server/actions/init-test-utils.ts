import { vi } from "vitest";
import { resetScriptProperties } from "../../../tests/server/setup/gas-mocks";
import { SHEET_HEADERS } from "../helpers/constants";

export {
  getScriptPropertiesStore,
  resetScriptProperties,
  setScriptProperty,
} from "../../../tests/server/setup/gas-mocks";
export {
  DRIVE_FOLDER_NAMES,
  DRIVE_MIME_TYPES,
  PROPERTY_KEYS,
  SHEET_HEADERS,
  SHEET_NAMES,
} from "../helpers/constants";
export { driveFileExists } from "../helpers/drive";
export { initMetaSheet } from "../sheets/meta.sheet";
export { initDefaults } from "../sheets/settings.sheet";
export { init } from "./init";

export const MOCK_ROOT_FOLDER_ID = "root-folder-id";
export const MOCK_FILES_FOLDER_ID = "covers-folder-id";
export const MOCK_SPREADSHEET_FILE_ID = "spreadsheet-file-id";
export const MOCK_SPREADSHEET_ID = "mock-spreadsheet-id";

export function parseResponse(): Record<string, unknown> {
  const calls = (ContentService.createTextOutput as ReturnType<typeof vi.fn>)
    .mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[0]);
}

type MockFn = ReturnType<typeof vi.fn>;

export function makeSheetMock(): { setName: MockFn; getRange: MockFn } {
  return {
    setName: vi.fn(),
    getRange: vi.fn().mockReturnValue({ setValues: vi.fn() }),
  };
}

export function setupFirstTimeInit(): {
  defaultSheet: { setName: MockFn; getRange: MockFn };
  insertedSheets: { setName: MockFn; getRange: MockFn }[];
  spreadsheetMock: { getSheets: MockFn; insertSheet: MockFn; getId: MockFn };
} {
  const defaultSheet = makeSheetMock();
  const sheetNames = Object.keys(SHEET_HEADERS);
  const insertedSheets = sheetNames.slice(1).map(() => makeSheetMock());
  let insertedSheetIndex = 0;

  const spreadsheetMock = {
    getSheets: vi.fn().mockReturnValue([defaultSheet]),
    insertSheet: vi
      .fn()
      .mockImplementation(() => insertedSheets[insertedSheetIndex++]),
    getId: vi.fn().mockReturnValue(MOCK_SPREADSHEET_ID),
  };

  vi.mocked(Drive.Files.create)
    .mockReturnValueOnce({ id: MOCK_ROOT_FOLDER_ID })
    .mockReturnValueOnce({ id: MOCK_FILES_FOLDER_ID })
    .mockReturnValueOnce({ id: MOCK_SPREADSHEET_FILE_ID });

  vi.mocked(SpreadsheetApp.openById).mockReturnValue(spreadsheetMock as never);

  return { defaultSheet, insertedSheets, spreadsheetMock };
}

export function resetAndClear() {
  vi.clearAllMocks();
  resetScriptProperties();
}

type MockFnAny = ReturnType<typeof vi.fn>;

/**
 * Sets up SpreadsheetApp.openById to return a spreadsheet with a Goals sheet
 * that either has the legacy `cover_file_id` header (withLegacyHeader=true)
 * or a modern `cover_hash` header (withLegacyHeader=false).
 * Returns mock references for assertion in tests.
 * implements FR7 of content-addressable-covers
 */
export function setupAlreadyInitializedWithLegacyGoalsSheet(
  dataRows: string[][],
  withLegacyHeader = true,
): {
  goalsSheetMock: {
    getRange: MockFnAny;
    getLastColumn: MockFnAny;
    getLastRow: MockFnAny;
    getSheetByName: MockFnAny;
  };
  headerCellMock: { setValue: MockFnAny };
  dataCellMock: { getValues: MockFnAny; setValues: MockFnAny };
} {
  const headers = withLegacyHeader
    ? [
        "id",
        "name",
        "description",
        "cover_file_id",
        "status",
        "sort_order",
        "is_deleted",
        "created_at",
        "updated_at",
        "revision",
      ]
    : [
        "id",
        "name",
        "description",
        "cover_hash",
        "status",
        "sort_order",
        "is_deleted",
        "created_at",
        "updated_at",
        "revision",
      ];

  const headerRangeMock = {
    getValues: vi.fn().mockReturnValue([headers]),
  };

  const headerCellMock = { setValue: vi.fn() };

  const dataCellMock = {
    getValues: vi.fn().mockReturnValue(dataRows),
    setValues: vi.fn(),
  };

  const goalsSheetMock = {
    getLastColumn: vi.fn().mockReturnValue(headers.length),
    getLastRow: vi
      .fn()
      .mockReturnValue(dataRows.length > 0 ? dataRows.length + 1 : 1),
    getRange: vi
      .fn()
      .mockImplementation(
        (row: number, _col: number, numRows?: number, numCols?: number) => {
          if (numRows === undefined && numCols === undefined) {
            // Single cell — for setValue (header rename)
            return headerCellMock;
          }
          if (row === 1) return headerRangeMock;
          return dataCellMock;
        },
      ),
  };

  const spreadsheetMock = {
    getSheetByName: vi.fn().mockReturnValue(goalsSheetMock),
  };

  vi.mocked(SpreadsheetApp.openById).mockReturnValue(spreadsheetMock as never);

  return {
    goalsSheetMock: goalsSheetMock as never,
    headerCellMock,
    dataCellMock,
  };
}
