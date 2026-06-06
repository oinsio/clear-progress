import {
  DRIVE_FOLDER_NAMES,
  DRIVE_MIME_TYPES,
  PROPERTY_KEYS,
  SHEET_HEADERS,
  SHEET_NAMES,
} from "../helpers/constants";
import { driveFileExists } from "../helpers/drive";
import { jsonOk } from "../helpers/response";
import { initMetaSheet } from "../sheets/meta.sheet";
import { initDefaults } from "../sheets/settings.sheet";

const LEGACY_COVER_FILE_ID_HEADER = "cover_file_id";
const COVER_HASH_HEADER = "cover_hash";
const DRIVE_FILE_DESCRIPTION_FIELD = "description";

/**
 * Migrates the Goals sheet from legacy `cover_file_id` column to `cover_hash`.
 * For each row with a non-empty file ID, reads the SHA-256 hash from the Drive
 * file's description field and writes it to the cell. Then renames the header.
 * implements FR7 of content-addressable-covers
 */
function migrateCoverFileIdToCoverHash(spreadsheetId: string): void {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const goalsSheet = spreadsheet.getSheetByName(SHEET_NAMES.GOALS);
  if (!goalsSheet) return;

  const lastColumn = goalsSheet.getLastColumn();
  if (lastColumn === 0) return;

  const headerRange = goalsSheet.getRange(1, 1, 1, lastColumn);
  const headerValues = headerRange.getValues()[0] as string[];
  const legacyColIndex = headerValues.indexOf(LEGACY_COVER_FILE_ID_HEADER);
  if (legacyColIndex === -1) return;

  const lastRow = goalsSheet.getLastRow();
  if (lastRow > 1) {
    const dataRange = goalsSheet.getRange(
      2,
      legacyColIndex + 1,
      lastRow - 1,
      1,
    );
    const cellValues = dataRange.getValues() as string[][];
    const updatedValues = cellValues.map((row) => {
      const fileId = row[0];
      if (!fileId) return row;
      try {
        const driveFile = Drive.Files.get(fileId, {
          fields: DRIVE_FILE_DESCRIPTION_FIELD,
        });
        const hash = driveFile.description ?? "";
        return [hash];
      } catch {
        return [""];
      }
    });
    dataRange.setValues(updatedValues);
  }

  goalsSheet.getRange(1, legacyColIndex + 1).setValue(COVER_HASH_HEADER);
}

export function init(): GoogleAppsScript.Content.TextOutput {
  const props = PropertiesService.getScriptProperties();
  const existingSpreadsheetId = props.getProperty(PROPERTY_KEYS.SPREADSHEET_ID);

  if (existingSpreadsheetId) {
    if (driveFileExists(existingSpreadsheetId)) {
      migrateCoverFileIdToCoverHash(existingSpreadsheetId);
      return jsonOk({ created: false, spreadsheet_id: existingSpreadsheetId });
    }
    props.deleteAllProperties();
  }

  // Create folder structure
  const rootFolderFile = Drive.Files.create({
    name: DRIVE_FOLDER_NAMES.ROOT,
    mimeType: DRIVE_MIME_TYPES.FOLDER,
  });
  const rootFolderId = rootFolderFile.id;
  if (!rootFolderId) throw new Error("Drive API did not return root folder id");

  const filesFolderFile = Drive.Files.create({
    name: DRIVE_FOLDER_NAMES.FILES,
    mimeType: DRIVE_MIME_TYPES.FOLDER,
    parents: [rootFolderId],
  });
  const filesFolderId = filesFolderFile.id;
  if (!filesFolderId)
    throw new Error("Drive API did not return files folder id");

  // Create spreadsheet
  const spreadsheetFile = Drive.Files.create({
    name: DRIVE_FOLDER_NAMES.DATA_FILE,
    mimeType: DRIVE_MIME_TYPES.SPREADSHEET,
    parents: [rootFolderId],
  });
  const spreadsheetId = spreadsheetFile.id;
  if (!spreadsheetId)
    throw new Error("Drive API did not return spreadsheet id");
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  // Create sheets with headers
  const defaultSheet = spreadsheet.getSheets()[0];
  const sheetNames = Object.keys(SHEET_HEADERS);

  sheetNames.forEach((name, index) => {
    let sheet: GoogleAppsScript.Spreadsheet.Sheet;
    if (index === 0) {
      sheet = defaultSheet;
      sheet.setName(name);
    } else {
      sheet = spreadsheet.insertSheet(name);
    }
    sheet
      .getRange(1, 1, 1, SHEET_HEADERS[name].length)
      .setValues([SHEET_HEADERS[name]]);
  });

  // Save IDs
  props.setProperties({
    [PROPERTY_KEYS.SPREADSHEET_ID]: spreadsheet.getId(),
    [PROPERTY_KEYS.FOLDER_ID]: rootFolderId,
    [PROPERTY_KEYS.FILES_FOLDER_ID]: filesFolderId,
  });

  // Write default settings
  initDefaults();

  // Initialize Meta sheet with revision counter
  initMetaSheet();

  return jsonOk({
    created: true,
    spreadsheet_id: spreadsheet.getId(),
    folder_id: rootFolderId,
  });
}
