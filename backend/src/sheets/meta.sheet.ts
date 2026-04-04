import { SHEET_NAMES, META_KEYS, META_INITIAL_REVISION } from '../helpers/constants';
import { getSpreadsheet, getSheet } from './client';

const META_KEY_COL = 0;
const META_VALUE_COL = 1;
const META_NUM_COLS = 2;

export function readNextRevision(): number {
  const sheet = getSheet(SHEET_NAMES.META);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][META_KEY_COL] === META_KEYS.NEXT_REVISION) {
      return Number(rows[i][META_VALUE_COL]);
    }
  }
  return META_INITIAL_REVISION;
}

export function saveNextRevision(value: number): void {
  const sheet = getSheet(SHEET_NAMES.META);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][META_KEY_COL] === META_KEYS.NEXT_REVISION) {
      sheet.getRange(i + 1, 1, 1, META_NUM_COLS).setValues([[META_KEYS.NEXT_REVISION, value]]);
      return;
    }
  }
  sheet.appendRow([META_KEYS.NEXT_REVISION, value]);
}

export function initMetaSheet(): void {
  const spreadsheet = getSpreadsheet();
  const existingSheet = spreadsheet.getSheetByName(SHEET_NAMES.META);
  if (existingSheet) return;

  const metaSheet = spreadsheet.insertSheet(SHEET_NAMES.META);
  metaSheet.appendRow(['key', 'value']);
  metaSheet.appendRow([META_KEYS.NEXT_REVISION, META_INITIAL_REVISION]);
}
