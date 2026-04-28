import {
  META_INITIAL_PURGE_REVISION,
  META_INITIAL_REVISION,
  META_KEYS,
  SHEET_NAMES,
} from "../helpers/constants";
import { getSheet, getSpreadsheet } from "./client";

const META_KEY_COL = 0;
const META_VALUE_COL = 1;
const META_NUM_COLS = 2;

function readMetaValue(key: string, defaultValue: number): number {
  const sheet = getSheet(SHEET_NAMES.META);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][META_KEY_COL] === key) {
      return Number(rows[i][META_VALUE_COL]);
    }
  }
  return defaultValue;
}

function saveMetaValue(key: string, value: number): void {
  const sheet = getSheet(SHEET_NAMES.META);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][META_KEY_COL] === key) {
      sheet.getRange(i + 1, 1, 1, META_NUM_COLS).setValues([[key, value]]);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

export function readNextRevision(): number {
  return readMetaValue(META_KEYS.NEXT_REVISION, META_INITIAL_REVISION);
}

export function saveNextRevision(value: number): void {
  saveMetaValue(META_KEYS.NEXT_REVISION, value);
}

export function readPurgeRevision(): number {
  return readMetaValue(META_KEYS.PURGE_REVISION, META_INITIAL_PURGE_REVISION);
}

export function savePurgeRevision(value: number): void {
  saveMetaValue(META_KEYS.PURGE_REVISION, value);
}

export function initMetaSheet(): void {
  const spreadsheet = getSpreadsheet();
  const existingSheet = spreadsheet.getSheetByName(SHEET_NAMES.META);
  if (existingSheet) return;

  const metaSheet = spreadsheet.insertSheet(SHEET_NAMES.META);
  metaSheet.appendRow(["key", "value"]);
  metaSheet.appendRow([META_KEYS.NEXT_REVISION, META_INITIAL_REVISION]);
  metaSheet.appendRow([META_KEYS.PURGE_REVISION, META_INITIAL_PURGE_REVISION]);
}
