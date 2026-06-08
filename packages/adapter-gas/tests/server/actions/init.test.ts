import { beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "../../../src/server/actions/init";
import {
  PROPERTY_KEYS,
  SHEET_NAMES,
} from "../../../src/server/helpers/constants";
import { parseResponse } from "../helpers";
import { resetScriptProperties, setScriptProperty } from "../setup/gas-mocks";

// Mock sheet-level functions that init calls
vi.mock("../../../src/server/sheets/meta.sheet", () => ({
  initMetaSheet: vi.fn(),
}));
vi.mock("../../../src/server/sheets/settings.sheet", () => ({
  initDefaults: vi.fn(),
}));
vi.mock("../../../src/server/helpers/drive", () => ({
  driveFileExists: vi.fn().mockReturnValue(true),
}));

const { driveFileExists } = await import("../../../src/server/helpers/drive");

function setupSingleSheetSpreadsheet(
  sheet: ReturnType<typeof createMockSheet>,
) {
  const mockSpreadsheet = {
    getSheetByName: vi.fn().mockReturnValue(sheet),
  };
  vi.mocked(SpreadsheetApp.openById).mockReturnValue(mockSpreadsheet as never);
}

function setupNewSpreadsheetMock() {
  const mockSheet = {
    setName: vi.fn(),
    getRange: vi.fn().mockReturnValue({ setValues: vi.fn() }),
  };
  const mockSpreadsheet = {
    getSheets: vi.fn().mockReturnValue([mockSheet]),
    insertSheet: vi.fn().mockReturnValue(mockSheet),
    getId: vi.fn().mockReturnValue("spreadsheet-id"),
  };
  vi.mocked(SpreadsheetApp.openById).mockReturnValue(mockSpreadsheet as never);
  return mockSpreadsheet;
}

function createMockSheet(headerRow: string[], dataRows: unknown[][] = []) {
  const mockHeaderRange = {
    getValues: vi.fn().mockReturnValue([headerRow]),
    setValues: vi.fn(),
  };
  const mockCellRange = {
    setValue: vi.fn(),
  };
  const mockDataRange = {
    getValues: vi.fn().mockReturnValue(dataRows.map((row) => [row[0] ?? ""])),
    setValues: vi.fn(),
  };
  return {
    getLastColumn: vi.fn().mockReturnValue(headerRow.length),
    getLastRow: vi
      .fn()
      .mockReturnValue(headerRow.length > 0 ? 1 + dataRows.length : 0),
    getRange: vi
      .fn()
      .mockImplementation(
        (row: number, _col: number, numRows?: number, numCols?: number) => {
          if (row === 1 && numCols) return mockHeaderRange;
          if (numRows && numCols) return mockDataRange;
          return mockCellRange;
        },
      ),
    setName: vi.fn(),
    appendRow: vi.fn(),
    _mockDataRange: mockDataRange,
    _mockCellRange: mockCellRange,
    _mockHeaderRange: mockHeaderRange,
  };
}

describe("init action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetScriptProperties();
  });

  describe("when spreadsheet already exists", () => {
    it("should return created: false for existing spreadsheet", () => {
      setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, "existing-id");
      vi.mocked(driveFileExists).mockReturnValue(true);

      const goalsSheet = createMockSheet(["id", "name", "cover_hash"]);
      setupSingleSheetSpreadsheet(goalsSheet);

      init();
      const response = parseResponse();
      expect(response.ok).toBe(true);
      expect(response.created).toBe(false);
      expect(response.spreadsheet_id).toBe("existing-id");
    });

    it("should migrate cover_file_id to cover_hash when legacy column exists", () => {
      setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, "existing-id");
      vi.mocked(driveFileExists).mockReturnValue(true);

      const goalsHeaders = ["id", "name", "cover_file_id", "status"];
      const goalsSheet = createMockSheet(goalsHeaders, [
        ["goal-1", "My Goal", "file-123", "planning"],
      ]);

      // Mock Drive.Files.get for file description
      vi.mocked(Drive.Files.get).mockReturnValue({
        description: "sha256hash",
      } as never);

      // Setup getRange for data cells
      const dataRange = {
        getValues: vi.fn().mockReturnValue([["file-123"]]),
        setValues: vi.fn(),
      };
      goalsSheet.getRange.mockImplementation(
        (row: number, _col: number, numRows?: number, numCols?: number) => {
          if (row === 1 && !numRows) return goalsSheet._mockCellRange;
          if (row === 1 && numCols === goalsHeaders.length)
            return goalsSheet._mockHeaderRange;
          if (row === 2 && numRows === 1 && numCols === 1) return dataRange;
          return goalsSheet._mockCellRange;
        },
      );

      const mockSpreadsheet = {
        getSheetByName: vi.fn().mockImplementation((name: string) => {
          if (name === SHEET_NAMES.GOALS) return goalsSheet;
          return null;
        }),
      };
      vi.mocked(SpreadsheetApp.openById).mockReturnValue(
        mockSpreadsheet as never,
      );

      init();

      // Verify hash was written to data range
      expect(dataRange.setValues).toHaveBeenCalledWith([["sha256hash"]]);
      // Verify header was renamed
      expect(goalsSheet._mockCellRange.setValue).toHaveBeenCalledWith(
        "cover_hash",
      );
    });

    it("should handle migration when Drive.Files.get throws", () => {
      setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, "existing-id");
      vi.mocked(driveFileExists).mockReturnValue(true);

      const goalsHeaders = ["id", "name", "cover_file_id"];
      const goalsSheet = createMockSheet(goalsHeaders, [
        ["goal-1", "Name", "bad-file-id"],
      ]);

      vi.mocked(Drive.Files.get).mockImplementation(() => {
        throw new Error("file not found");
      });

      const dataRange = {
        getValues: vi.fn().mockReturnValue([["bad-file-id"]]),
        setValues: vi.fn(),
      };
      goalsSheet.getRange.mockImplementation(
        (row: number, _col: number, numRows?: number, numCols?: number) => {
          if (row === 1 && !numRows) return goalsSheet._mockCellRange;
          if (row === 1 && numCols === goalsHeaders.length)
            return goalsSheet._mockHeaderRange;
          if (numRows === 1 && numCols === 1) return dataRange;
          return goalsSheet._mockCellRange;
        },
      );

      setupSingleSheetSpreadsheet(goalsSheet);

      init();
      // Should write empty string for failed file lookup
      expect(dataRange.setValues).toHaveBeenCalledWith([[""]]);
    });

    it("should skip migration when Goals sheet has no legacy column", () => {
      setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, "existing-id");
      vi.mocked(driveFileExists).mockReturnValue(true);

      const goalsSheet = createMockSheet(["id", "name", "cover_hash"]);
      setupSingleSheetSpreadsheet(goalsSheet);

      init();
      // No Drive.Files.get calls since there's nothing to migrate
      expect(Drive.Files.get).not.toHaveBeenCalled();
    });

    it("should skip migration data when sheet has only headers", () => {
      setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, "existing-id");
      vi.mocked(driveFileExists).mockReturnValue(true);

      const goalsHeaders = ["id", "name", "cover_file_id"];
      const goalsSheet = createMockSheet(goalsHeaders);
      // lastRow = 1 (headers only)
      goalsSheet.getLastRow.mockReturnValue(1);

      setupSingleSheetSpreadsheet(goalsSheet);

      init();
      // Should still rename the header even without data
      expect(goalsSheet._mockCellRange.setValue).toHaveBeenCalledWith(
        "cover_hash",
      );
    });
  });

  describe("when spreadsheet does not exist", () => {
    it("should create new folder structure and spreadsheet", () => {
      vi.mocked(Drive.Files.create)
        .mockReturnValueOnce({ id: "root-folder-id" } as never)
        .mockReturnValueOnce({ id: "covers-folder-id" } as never)
        .mockReturnValueOnce({ id: "spreadsheet-id" } as never);

      setupNewSpreadsheetMock();

      init();
      const response = parseResponse();
      expect(response.ok).toBe(true);
      expect(response.created).toBe(true);
      expect(response.spreadsheet_id).toBe("spreadsheet-id");
      expect(response.folder_id).toBe("root-folder-id");
    });

    it("should throw when Drive API returns no root folder id", () => {
      vi.mocked(Drive.Files.create).mockReturnValueOnce({} as never);

      expect(() => init()).toThrow("Drive API did not return root folder id");
    });

    it("should throw when Drive API returns no files folder id", () => {
      vi.mocked(Drive.Files.create)
        .mockReturnValueOnce({ id: "root-id" } as never)
        .mockReturnValueOnce({} as never);

      expect(() => init()).toThrow("Drive API did not return files folder id");
    });

    it("should throw when Drive API returns no spreadsheet id", () => {
      vi.mocked(Drive.Files.create)
        .mockReturnValueOnce({ id: "root-id" } as never)
        .mockReturnValueOnce({ id: "covers-id" } as never)
        .mockReturnValueOnce({} as never);

      expect(() => init()).toThrow("Drive API did not return spreadsheet id");
    });
  });

  describe("when existing spreadsheet is trashed", () => {
    it("should clear properties and create new spreadsheet", () => {
      setScriptProperty(PROPERTY_KEYS.SPREADSHEET_ID, "trashed-id");
      vi.mocked(driveFileExists).mockReturnValue(false);

      vi.mocked(Drive.Files.create)
        .mockReturnValueOnce({ id: "new-root" } as never)
        .mockReturnValueOnce({ id: "new-covers" } as never)
        .mockReturnValueOnce({ id: "new-ss" } as never);

      const mockSheet = {
        setName: vi.fn(),
        getRange: vi.fn().mockReturnValue({ setValues: vi.fn() }),
      };
      const mockSpreadsheet = {
        getSheets: vi.fn().mockReturnValue([mockSheet]),
        insertSheet: vi.fn().mockReturnValue(mockSheet),
        getId: vi.fn().mockReturnValue("new-ss"),
      };
      vi.mocked(SpreadsheetApp.openById).mockReturnValue(
        mockSpreadsheet as never,
      );

      init();
      const response = parseResponse();
      expect(response.created).toBe(true);
    });
  });
});
